import { Request, Response } from 'express';
import { experimentProvider, deploymentProvider } from "../../libs/config/AppModule";
import { RequestValidator } from '../../libs/utils/RequestValidator';
import { FrameworkToContainerGroupTypeMapping } from '../../commons/Framework';
import { Experiment } from "../../providers/experiment/ExperimentProvider";
import { ContainerGroupType } from '../container/ContainerGroupProvider';
import { Runtime } from '../../commons/Runtime';
import { interpolation } from 'interpolate-json';
import yaml = require('js-yaml');
import fs = require('fs');

/* Load container config from yaml */
const servingConfigs = yaml.load(fs.readFileSync('app-config/global/serving.yml', 'utf8'));

/**
 * Container group request context.
 */
export class DeploymentContext
{
    name: string;
    type: ContainerGroupType;
    workspaceId: string;
    version: number;
    runtime: Runtime;
    lastActiveId?: string;
    listenPort: number;
    servingConfig: {
        targetPort: number;
        sourcePath: string;
        targetPath: string;
        environment: { name: string, value: string }[];
        healthCheckPath: string;
    }
}

/**
 * Provides deployment context.
 */
export class DeploymentContextProvider
{
    private static readonly PENDING = "PENDING";

    /**
     * Validates and return the deployment initialization context.
     * @param req Express request
     * @param res Express response
     * @returns Deployment context
     */
    public async validateAndGetDeploymentContext(req: Request, res: Response): Promise<DeploymentContext | undefined>
    {
        const { workspaceId } = req.body;
        const [registry, lastDeployment, lastActiveDeployment] = await Promise.all([
            RequestValidator.nullOnException(() => experimentProvider.getRegistry(workspaceId)),
            RequestValidator.nullOnException(() => deploymentProvider.getLatest(workspaceId)),
            RequestValidator.nullOnException(() => deploymentProvider.getActive(workspaceId)),
        ]);
        if (!registry?.version) {
            res.status(400).send({error: 'Unable to find registered model version'});
            return null;
        } else if (DeploymentContextProvider.PENDING === lastDeployment?.status) {
            res.status(400).send({error: 'Last deployment is still in progress'});
            return null;
        }
        return this.getContext(workspaceId, registry, lastActiveDeployment?.deploymentId);
    }

    /**
     * Validates and return the deployment termination context.
     * @param req Express request
     * @param res Express response
     * @returns Deployment context
     */
    public async validateAndGetTerminationContext(req: Request, res: Response): Promise<DeploymentContext | undefined>
    {
        const { workspaceId } = req.params;
        const [lastDeployment, lastActiveDeployment] = await Promise.all([
            RequestValidator.nullOnException(() => deploymentProvider.getLatest(workspaceId)),
            RequestValidator.nullOnException(() => deploymentProvider.getActive(workspaceId)),
        ]);
        if (!lastActiveDeployment) {
            res.status(400).send({error: 'No active deployment'});
            return null;
        }
        if (DeploymentContextProvider.PENDING === lastDeployment?.status) {
            res.status(400).send({error: 'Last deployment is still in progress'});
            return null;
        }
        const experiment: Experiment = await experimentProvider.read(workspaceId, lastActiveDeployment.version);
        return this.getContext(workspaceId, experiment, lastActiveDeployment?.deploymentId);
    }

    private getContext(workspaceId: string, experiment: Experiment, lastActiveId: string): DeploymentContext
    {   
        const type = FrameworkToContainerGroupTypeMapping[experiment.framework];
        const name = `ntcore-${workspaceId.toLowerCase()}`;
        const version = experiment.version;
        const runtime = experiment.runtime;
        const listenPort = 18080;
        const servingConfig = interpolation.expand(servingConfigs, { workspaceId })[type.toLowerCase()];

        return { type, name, version, runtime, workspaceId, lastActiveId, listenPort, servingConfig };
    }
}