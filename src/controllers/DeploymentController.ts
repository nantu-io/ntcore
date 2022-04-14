import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { waitUntil } from 'async-wait-until';
import { ContainerProviderFactory } from '../providers/container/ContainerGroupProviderFactory';
import { ContainerGroupContextProviderFactory } from '../providers/container/ContainerGroupProviderFactory';
import { Framework, FrameworkMapping } from '../commons/Framework';
import { DeploymentStatus } from '../providers/deployment/DeploymentProvider';
import { IContainerGroup, IContainerGroupProvider, ContainerGroupState, ContainerGroupType, IContainerGroupContextProvider, ContainerGroupRequestContext } from '../providers/container/ContainerGroupProvider';
import { experimentProvider, deploymentProvider } from "../libs/config/AppModule";
import { Experiment } from '../providers/experiment/ExperimentProvider';

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
        const workspaceId = req.body.workspaceId;
        const registry = await experimentProvider.getRegistry(workspaceId);
        const requestContext = this.getRequestContext(req, registry);
        const context = this._containerGroupContextProvider.getContext(requestContext);
        // await deploymentProvider.releaseLock(workspaceId);
        if (!await this.aquireDeploymentLock(workspaceId, registry.version, res)) {
            return;
        }

        var deploymentId: string;
        try {
            // Create containers with container group provider.
            await this._containerGroupProvider.provision(context);
            const response = (await this._containerGroupProvider.start(context));
            deploymentId = response.id != null ? response.id : uuidv4();
            res.status(201).send({info: `Started Deployment ${deploymentId}`});
            await this.createDeploymentEntry(workspaceId, deploymentId, registry.version);
            // Wait for container group to be running.
            const configWithDeploymentId = { id: deploymentId, ...context };
            await this.waitForDeploymentState(configWithDeploymentId, ContainerGroupState.RUNNING);
            await deploymentProvider.updateStatus(workspaceId, deploymentId, DeploymentStatus.RUNNING);
        } catch (err) {
            deploymentId = (deploymentId == null) ? uuidv4() : deploymentId;
            await deploymentProvider.updateStatus(workspaceId, deploymentId, DeploymentStatus.FAILED);
        } finally {
            await deploymentProvider.releaseLock(workspaceId);
        }
    }

    private getRequestContext(req: Request, registry: Experiment): ContainerGroupRequestContext
    {
        return {
            type: this.getServiceType(registry.framework),
            framework: registry.framework,
            version:  registry.version,
            runtime: registry.runtime,
            workspaceId: req.body.workspaceId,
            command: req.body.command,
            workflow: req.body.workflow,
            cpus: 1, memory: 2,
        }
    }

    private async aquireDeploymentLock(workspaceId: string, version: number, res: Response): Promise<boolean>
    {
        try {
            await deploymentProvider.aquireLock(workspaceId, version);
            return true;
        } catch (err) {
            if (err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
                res.status(400).send({error: '[Error] Deployment in progress'});
            } else {
                await deploymentProvider.releaseLock(workspaceId);
                res.status(500).send({error: err.toString()});
            }
            return false;
        }
    }

    private getServiceType(framework: string): ContainerGroupType
    {
        switch(FrameworkMapping[framework]) {
            case Framework.SKLEARN: return ContainerGroupType.FLASK_SKLEARN;
            case Framework.TENSORFLOW: return ContainerGroupType.TENSORFLOW;
            case Framework.PYTORCH: return ContainerGroupType.PYTORCH;
            default: throw new Error("Invalid framework.");
        }
    }

    private async createDeploymentEntry(workspaceId: string, deploymentId: string, version: number) 
    {
        return await deploymentProvider.create({
            workspaceId,
            deploymentId,
            version,
            status: DeploymentStatus.PENDING,
            createdBy: 'ntcore',
            createdAt: new Date(),
        });
    }

    private async waitForDeploymentState(config: IContainerGroup, state: ContainerGroupState) 
    {
        await waitUntil(async () => (await this._containerGroupProvider.getState(config)).state === state,
            { timeout: 86400000, intervalBetweenAttempts: 60000 });
        return config;
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
        const workspaceId = req.params.workspaceId;
        await this.aquireDeploymentLock(workspaceId, -1, res);
        try {
            const deploymentId = (await deploymentProvider.getActive(workspaceId)).deploymentId;
            await this._containerGroupProvider.delete({ id: deploymentId });
            res.status(201).send({info: `Terminating Deployment ${deploymentId}`});
            await this.waitForDeploymentState({ id: deploymentId }, ContainerGroupState.INACTIVE);
            await deploymentProvider.updateStatus(workspaceId, deploymentId, DeploymentStatus.STOPPED);
        } finally {
            await deploymentProvider.releaseLock(workspaceId);
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
        const deployments = await deploymentProvider.list(workspaceId);
        res.status(200).send(deployments);
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
        const deployments = await deploymentProvider.listActive();
        res.status(200).send(deployments);
    }
}