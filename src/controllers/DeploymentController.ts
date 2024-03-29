import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { waitUntil } from 'async-wait-until';
import { ContainerProviderFactory } from '../providers/container/ContainerGroupProviderFactory';
import { ContainerGroupContextProviderFactory } from '../providers/container/ContainerGroupProviderFactory';
import { ContainerGroupStateToDeploymentStatusMapping } from '../providers/deployment/DeploymentProvider';
import { IContainerGroup, IContainerGroupProvider, ContainerGroupState, IContainerGroupContextProvider } from '../providers/container/ContainerGroupProvider';
import { DeploymentContext, DeploymentContextProvider } from '../providers/deployment/DeploymentContextProvider';
import { deploymentProvider } from "../libs/config/AppModule";
import { Deployment } from "../providers/deployment/DeploymentProvider";
import { ErrorHandler } from '../libs/utils/ErrorHandler';
import { RequestValidator } from '../libs/utils/RequestValidator';
import { appConfig } from '../libs/config/AppConfigProvider';

const AUTH_USER_HEADER_NAME = "X-NTCore-Auth-User";

/**
 * Controller for deployment related operations.
 */
export class DeploymentController
{
    private readonly _containerGroupContextProvider: IContainerGroupContextProvider;
    private readonly _containerGroupProvider: IContainerGroupProvider;
    private readonly _deploymentContextProvider: DeploymentContextProvider;

    public constructor()
    {   
        this._containerGroupContextProvider = new ContainerGroupContextProviderFactory().createProvider();
        this._containerGroupProvider = new ContainerProviderFactory().createProvider();
        this._deploymentContextProvider = new DeploymentContextProvider();
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
    public async deployModelV1(
        req: Request<{}, {}, {workspaceId: string}, {}>,
        res: Response<{version: number}>)
    {
        const requestContext = await this._deploymentContextProvider.validateAndGetDeploymentContext(req, res);
        if (!requestContext) return;
        const createdBy = req.get(AUTH_USER_HEADER_NAME) ?? appConfig.account.username;
        const version = Math.floor(requestContext.version)
        res.status(201).send({version});

        await this.startAndWait(requestContext, createdBy);
    }

    private async startAndWait(requestContext: DeploymentContext, createdBy: string): Promise<Deployment>
    {
        const workspaceId = requestContext.workspaceId;
        const version = Math.floor(requestContext.version)
        const deploymentId = uuidv4();
        const createdAt = Math.floor((new Date()).getTime()/1000);
        const deployment: Deployment = { workspaceId, deploymentId, version, createdBy, createdAt, status: "PENDING" };
        const context = this._containerGroupContextProvider.getContext(requestContext);
        try {
            await deploymentProvider.create(deployment);
            await this._containerGroupProvider.provision(context);
            await this._containerGroupProvider.start(context);
            const targetStates = [ ContainerGroupState.RUNNING ];
            const finalState = await this.waitForContainerGroupState(context, targetStates);
            await deploymentProvider.updateStatus(workspaceId, deploymentId, ContainerGroupStateToDeploymentStatusMapping[finalState]);
            if (!requestContext.lastActiveId) return deployment;
            await deploymentProvider.updateStatus(workspaceId, requestContext.lastActiveId, ContainerGroupState.STOPPED);
            return deployment;
        } catch (err) {
            await this._containerGroupProvider.stop(context);
            // TODO: Handle failed deployment upsert
            await deploymentProvider.updateStatus(workspaceId, deploymentId, "FAILED");
        }
    }

    private async waitForContainerGroupState(context: IContainerGroup, states: ContainerGroupState[]): Promise<ContainerGroupState>
    { 
        /* Wait 3 seconds to avoid race conditions between applying restart and fetching status below */
        await new Promise((resolve, ) => setTimeout(resolve, 3000));
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
    public async terminateDeploymentV1(
        req: Request<{workspaceId: string}, {}, {}, {}>,
        res: Response<{deploymentId: string}>)
    {
        const requestContext = await this._deploymentContextProvider.validateAndGetTerminationContext(req, res);
        if (!requestContext) return;
        res.status(201).send({deploymentId: requestContext.lastActiveId});
        
        await this.stopAndWait(requestContext);
    }

    private async stopAndWait(requestContext: DeploymentContext) 
    {
        try {
            const context = this._containerGroupContextProvider.getContext(requestContext);
            await this._containerGroupProvider.stop(context);
            const targetStates = [ContainerGroupState.INACTIVE, ContainerGroupState.STOPPED];
            const finalState = await this.waitForContainerGroupState(context, targetStates);
            const deploymentStatus = ContainerGroupStateToDeploymentStatusMapping[finalState];
            await deploymentProvider.updateStatus(requestContext.workspaceId, requestContext.lastActiveId, deploymentStatus);
        } catch (err) {
            // TODO: log error.
        }
    }

    /**
     * Endpoint to list deployments based on the given workspace id.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl http://localhost:8180/dsp/api/v1/workspace/{workspaceId}/deployments
     */
    public async listDeploymentsV1(
        req: Request<{workspaceId: string}, {}, {}, {}>, 
        res: Response<Deployment[]>) {
        const { workspaceId } = req.params;
        try {
            RequestValidator.validateRequest(workspaceId);
            const deployments = await deploymentProvider.listAll(workspaceId);
            res.status(200).send(deployments);
        } catch (err) {
            ErrorHandler.handleException(err, res);
        }
    }

    /**
     * Endpoint to list active deployments.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl http://localhost:8180/dsp/api/v1/deployments/active
     */
    public async listActiveDeploymentsV1(
        req: Request<{}, {}, {}, {}>, 
        res: Response<Deployment[]>) {
        try {
            const userId = req.get(AUTH_USER_HEADER_NAME) ?? appConfig.account.username;
            RequestValidator.validateRequest(userId);
            const deployments = await deploymentProvider.listActive(userId);
            res.status(200).send(deployments);
        } catch (err) {
            ErrorHandler.handleException(err, res);
        }
    }
}