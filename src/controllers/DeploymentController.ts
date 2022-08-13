import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { waitUntil } from 'async-wait-until';
import { ContainerProviderFactory } from '../providers/container/ContainerGroupProviderFactory';
import { ContainerGroupContextProviderFactory } from '../providers/container/ContainerGroupProviderFactory';
import { FrameworkToContainerGroupTypeMapping } from '../commons/Framework';
import { DeploymentStatus, ContainerGroupStateToDeploymentStatusMapping } from '../providers/deployment/DeploymentProvider';
import { IContainerGroup, IContainerGroupProvider, ContainerGroupState, IContainerGroupContextProvider, ContainerGroupRequestContext } from '../providers/container/ContainerGroupProvider';
import { experimentProvider, deploymentProvider } from "../libs/config/AppModule";
import { Experiment } from '../providers/experiment/ExperimentProvider';
import { appConfig } from '../libs/config/AppConfigProvider';

const AUTH_USER_HEADER_NAME = "X-NTCore-Auth-User";

export class DeploymentController
{
    private readonly _containerGroupContextProvider: IContainerGroupContextProvider;
    private readonly _containerGroupProvider: IContainerGroupProvider;

    public constructor()
    {   
        this._containerGroupContextProvider = new ContainerGroupContextProviderFactory().createProvider();
        this._containerGroupProvider = new ContainerProviderFactory().createProvider();
        this.listDeploymentsV1 = this.listDeploymentsV1.bind(this);
        this.listActiveDeploymentsV1 = this.listActiveDeploymentsV1.bind(this);
        this.deployModelV1 = this.deployModelV1.bind(this);
        this.terminateDeploymentV1 = this.terminateDeploymentV1.bind(this);
        this.retrieveLogEvents = this.retrieveLogEvents.bind(this);
    }

    /**
     * Endpoint to deploy a model based on the given workspace id and version.
     * @param req Request
     * @param res Response
     * Example usage:
     * curl -X POST -H "Content-Type: application/json" -d '{"workspaceId": "C123"}' localhost:8180/dsp/api/v1/deployments
     */
    public async deployModelV1(req: Request, res: Response)
    {
        const requestContext = await this.validateAndReturnDeploymentContext(req, res);
        if (!requestContext) {
            return;
        }
        const createdBy = req.get(AUTH_USER_HEADER_NAME) ?? appConfig.account.username;
        const context = this._containerGroupContextProvider.getContext(requestContext);
        const version = Math.floor(requestContext.version)
        res.status(201).send({info: `Starting deployment for version ${version}`});
        await this.startAndWait(requestContext.workspaceId, version, context, createdBy);
    }

    private async validateAndReturnDeploymentContext(req: Request, res: Response): Promise<ContainerGroupRequestContext | undefined>
    {
        const { workspaceId } = req.body;
        try {
            const [registry, latestDeployment] = await Promise.all([experimentProvider.getRegistry(workspaceId), deploymentProvider.getLatest(workspaceId)]);
            if (!registry?.version) {
                res.status(400).send({error: 'Unable to find registered model.'});
                return null;
            } else if (latestDeployment?.status === DeploymentStatus.PENDING) {
                res.status(400).send({error: 'Last deployment is still in progress.'});
                return null;
            }
            return this.getRequestContext(req, workspaceId, registry);
        } catch (err) {
            res.status(500).send({error: err});
            return null;
        }
    }

    private async startAndWait(workspaceId: string, version: number, context: IContainerGroup, createdBy: string)
    {
        var deploymentId = uuidv4();
        try {
            await this._containerGroupProvider.provision(context);
            deploymentId = (await this._containerGroupProvider.start(context))?.id ?? deploymentId;
            await this.createDeploymentEntry(workspaceId, deploymentId, version, createdBy);
            const contextWithDeploymentId = { id: deploymentId, ...context };
            const targetStates = [ContainerGroupState.RUNNING, ContainerGroupState.INACTIVE, ContainerGroupState.STOPPED]
            const finalState = await this.waitForContainerGroupState(contextWithDeploymentId, targetStates);
            await deploymentProvider.updateStatus(workspaceId, deploymentId, ContainerGroupStateToDeploymentStatusMapping[finalState]);
        } catch (err) {
            await this._containerGroupProvider.delete(context);
            // TODO: Handle failed deployment upsert
            await deploymentProvider.updateStatus(workspaceId, deploymentId, DeploymentStatus.FAILED);
        }
    }

    private getRequestContext(req: Request, workspaceId: string, registry: Experiment): ContainerGroupRequestContext
    {    
        return {
            type: registry?.framework ? FrameworkToContainerGroupTypeMapping[registry.framework] : null,
            name: `ntcore-${workspaceId.toLowerCase()}`,
            version:  registry?.version,
            runtime: registry?.runtime,
            workspaceId: workspaceId,
            command: req.body.command,
            workflow: req.body.workflow
        }
    }

    private async createDeploymentEntry(workspaceId: string, deploymentId: string, version: number, createdBy: string) 
    {
        return await deploymentProvider.create({
            workspaceId,
            deploymentId,
            version,
            status: DeploymentStatus.PENDING,
            createdBy: createdBy,
            createdAt: new Date(),
        });
    }

    private async waitForContainerGroupState(context: IContainerGroup, states: ContainerGroupState[]): Promise<ContainerGroupState>
    {
        var containerGroupState: ContainerGroupState;
        await waitUntil(async () => {
            containerGroupState = (await this._containerGroupProvider.getState(context))?.state;
            return states.includes(containerGroupState);
        }, { timeout: 900000, intervalBetweenAttempts: 60000 });

        return containerGroupState;
    }

    /**
     * Terminate a deployment with the given workspace id and deployment id.
     * @param req Request
     * @param res Response
     * Example usage:
     * curl -X DELETE http://localhost:8180/dsp/api/v1/{workspace_id}/deployment
     */
    public async terminateDeploymentV1(req: Request, res: Response)
    {
        const requestContext = await this.validateAndReturnTerminationContext(req, res);
        if (!requestContext) {
            return;
        }
        const context = this._containerGroupContextProvider.getContext(requestContext);
        res.status(201).send({info: `Terminating Deployment ${context.id}`});
        await this.stopAndWait(req.params.workspaceId, context.id, context);
    }

    private async validateAndReturnTerminationContext(req: Request, res: Response): Promise<ContainerGroupRequestContext | undefined>
    {
        const { workspaceId } = req.params;
        try {
            const latestDeployment = await deploymentProvider.getLatest(workspaceId);
            if (latestDeployment.status === DeploymentStatus.PENDING) {
                res.status(400).send({error: '[Error] Last deployment is still in progress.'});
                return null;
            }
            return this.getRequestContext(req, workspaceId, null);
        } catch (err) {
            res.status(500).send({error: `[Error] ${err}`});
            return null;
        }
    }

    private async stopAndWait(workspaceId: string, deploymentId: string, context: IContainerGroup) 
    {
        try {
            await this._containerGroupProvider.delete(context);
            const targetStates = [ContainerGroupState.INACTIVE, ContainerGroupState.STOPPED];
            const finalState = await this.waitForContainerGroupState(context, targetStates);
            const deploymentStatus = ContainerGroupStateToDeploymentStatusMapping[finalState];
            await deploymentProvider.updateStatus(workspaceId, deploymentId, deploymentStatus);
        } catch (err) {
            // TODO: log error.
        }
    }

    /**
     * Retrieve the log events for a given deployment.
     * @param req Request
     * @param res Response
     * Example usage:
     * curl http://localhost:8180/dsp/api/v1/{workspaceId}/logs/{deploymentId}
     */
     public async retrieveLogEvents(req: Request, res: Response)
     {
        const workspaceId = req.params.workspaceId;
        const deploymentId = req.params.deploymentId;
        try {
            // const deploymentDetails = deploymentProvider.read(workspaceId, deploymentId);
            const eventName = { definition: "torch-standard-single-node-beta", name: "default", id: deploymentId };
            const events = await this._containerGroupProvider.getLogs(eventName);
            res.status(201).json({events: events});
        } catch {
            res.status(500).json({error: 'Unable to retrieve log events. Please wait and retry.'});
        }
     }

    /**
     * Endpoint to list deployments based on the given workspace id.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl http://localhost:8180/dsp/api/v1/workspace/{workspaceId}/deployments
     */
    public async listDeploymentsV1(req: Request, res: Response) 
    {
        const workspaceId = req.params.workspaceId;
        try {
            const deployments = await deploymentProvider.list(workspaceId);
            res.status(200).send(deployments);
        } catch (err) {
            res.status(500).send({error: 'Unable to list deployments.'});
        }
    }

    /**
     * Endpoint to list active deployments.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl http://localhost:8180/dsp/api/v1/deployments/active
     */
    public async listActiveDeploymentsV1(req: Request, res: Response) 
    {
        try {
            const userId = req.get(AUTH_USER_HEADER_NAME) ?? appConfig.account.username;
            const deployments = await deploymentProvider.listActive(userId);
            res.status(200).send(deployments);
        } catch (err) {
            res.status(500).send({error: 'Unable to list active deployments.'});
        }
    }
}