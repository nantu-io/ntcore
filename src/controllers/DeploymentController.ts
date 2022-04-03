import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { waitUntil } from 'async-wait-until';
import { ContainerProviderFactory } from '../providers/container/ContainerGroupProviderFactory';
import { ServiceConfigProviderFactory } from '../providers/container/ContainerGroupProviderFactory';
import { Framework, FrameworkMapping } from '../commons/Framework';
import { DeploymentStatus } from '../providers/deployment/GenericDeploymentProvider';
import { IContainerGroupProvider, IContainerGroupConfigProvider, ContainerGroupState, ContainerGroupType } from '../providers/container/ContainerGroupProvider';
import { experimentProvider, deploymentProvider } from "../libs/config/AppModule";

export class DeploymentController
{
    private readonly _configProvider: IContainerGroupConfigProvider;
    private readonly _serviceProvider: IContainerGroupProvider;

    public constructor() 
    {   
        this._configProvider = new ServiceConfigProviderFactory().createProvider();
        this._serviceProvider = new ContainerProviderFactory().createProvider();
        this.listDeploymentsV1 = this.listDeploymentsV1.bind(this);
        this.listActiveDeploymentsV1 = this.listActiveDeploymentsV1.bind(this);
    }

    /**
     * Endpoint to deploy a model based on the given workspace id and version.
     * @param req Request
     * @param res Response
     * Example usage:
     * curl -X POST -H "Content-Type: application/json" localhost:8180/dsp/api/v1/workspace/{workspaceId}/model/{version}/deploy
     */
    public async deployModelV1(req: Request, res: Response) 
    {
        const workspaceId = req.params.workspaceId;
        const deploymentId = uuidv4();
        const registry = await experimentProvider.getRegistry(workspaceId);
        const type = this.getServiceType(registry.framework);
        const version = registry.version;
        const runtime = registry.runtime;
        const config = this._configProvider.createDeploymentConfig(type, workspaceId, version, runtime, registry.framework, 1, 2);

        try {
            await deploymentProvider.aquireLock(workspaceId, version);
        } catch (err) {
            if (err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
                res.status(400).send({error: 'Deployment in progress'});
            } else {
                res.status(500).send({error: err.toString()});
            }
            throw err;
        }

        try {
            await this.createDeployment(workspaceId, deploymentId, version);
            res.status(201).send({info: `Started Deployment ${deploymentId}`});
            // Create containers with container service provider.
            await this._serviceProvider.provision(config);
            await this._serviceProvider.start(config);
            await this.waitForServiceRunning(type, workspaceId);
            await deploymentProvider.updateStatus(workspaceId, deploymentId, DeploymentStatus.RUNNING);
        } catch (err) {
            await deploymentProvider.updateStatus(workspaceId, deploymentId, DeploymentStatus.FAILED);
        } finally {
            await deploymentProvider.releaseLock(workspaceId);
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

    private async createDeployment(workspaceId: string, deploymentId: string, version: number) 
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

    private async waitForServiceRunning(type: ContainerGroupType, workspaceId: string) 
    {
        const config = this._configProvider.createDeploymentConfig(type, workspaceId);
        await waitUntil(async () => (await this._serviceProvider.getState(config)).state === ContainerGroupState.RUNNING,
            { timeout: 900000, intervalBetweenAttempts: 10000 });
        return config;
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