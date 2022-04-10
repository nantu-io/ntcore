import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { waitUntil } from 'async-wait-until';
import { ContainerProviderFactory } from '../providers/container/ContainerGroupProviderFactory';
import { ContainerGroupConfigProviderFactory } from '../providers/container/ContainerGroupProviderFactory';
import { Framework, FrameworkMapping } from '../commons/Framework';
import { DeploymentStatus } from '../providers/deployment/DeploymentProvider';
import { IContainerGroupProvider, IContainerGroupConfigProvider, ContainerGroupState, ContainerGroupType } from '../providers/container/ContainerGroupProvider';
import { experimentProvider, deploymentProvider } from "../libs/config/AppModule";

export class DeploymentController
{
    private readonly _containerGroupProvider: IContainerGroupProvider;
    private readonly _configProvider: IContainerGroupConfigProvider;

    public constructor()
    {   
        this._configProvider = new ContainerGroupConfigProviderFactory().createProvider();
        this._containerGroupProvider = new ContainerProviderFactory().createProvider();
        this.listDeploymentsV1 = this.listDeploymentsV1.bind(this);
        this.listActiveDeploymentsV1 = this.listActiveDeploymentsV1.bind(this);
        this.deployModelV1 = this.deployModelV1.bind(this);
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
        const framework = registry.framework
        const type = this.getServiceType(framework);
        const version = registry.version;
        const runtime = registry.runtime;
        const config = this._configProvider.createDeploymentConfig(type, workspaceId, version, runtime, framework, 1, 2);

        const deploymentId = await this.aquireDeploymentLock(workspaceId, version, res);
        try {
            await this.createDeploymentEntry(workspaceId, deploymentId, version);
            res.status(201).send({info: `Started Deployment ${deploymentId}`});
            // Create containers with container service provider.
            await this._containerGroupProvider.provision(config);
            await this._containerGroupProvider.start(config);
            await this.waitForServiceRunning(type, workspaceId);
            await deploymentProvider.updateStatus(workspaceId, deploymentId, DeploymentStatus.RUNNING);
        } catch (err) {
            await deploymentProvider.updateStatus(workspaceId, deploymentId, DeploymentStatus.FAILED);
        } finally {
            await deploymentProvider.releaseLock(workspaceId);
        }
    }

    private async aquireDeploymentLock(workspaceId: string, version: number, res: Response): Promise<string>
    {
        try {
            await deploymentProvider.aquireLock(workspaceId, version);
            return uuidv4();
        } catch (err) {
            if (err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
                res.status(400).send({error: '[Error] Deployment in progress'});
            } else {
                await deploymentProvider.releaseLock(workspaceId);
                res.status(500).send({error: err.toString()});
            }
            throw err;
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

    private async waitForServiceRunning(type: ContainerGroupType, workspaceId: string) 
    {
        const config = this._configProvider.createDeploymentConfig(type, workspaceId);
        await waitUntil(async () => (await this._containerGroupProvider.getState(config)).state === ContainerGroupState.RUNNING,
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