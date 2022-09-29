import { Request, Response } from 'express';
import { experimentProvider, deploymentProvider } from "../../libs/config/AppModule";
import { ContainerGroupRequestContext } from '../../providers/container/ContainerGroupProvider';
import { RequestValidator } from '../../libs/utils/RequestValidator';
import { FrameworkToContainerGroupTypeMapping } from '../../commons/Framework';
import { Experiment } from "../../providers/experiment/ExperimentProvider";

export class DeploymentContextProvider
{
    /**
     * Validates and return the deployment initialization context.
     * @param req Express request
     * @param res Express response
     * @returns Deployment context
     */
    public async validateAndReturnDeploymentContext(req: Request, res: Response): Promise<ContainerGroupRequestContext | undefined>
    {
        const { workspaceId } = req.body;
        const [registry, lastDeployment, lastActiveDeployment] = await Promise.all([
            RequestValidator.nullOnException(() => experimentProvider.getRegistry(workspaceId)),
            RequestValidator.nullOnException(() => deploymentProvider.getLatest(workspaceId)),
            RequestValidator.nullOnException(() => deploymentProvider.getActive(workspaceId)),
        ]);
        if (!registry?.version) {
            res.status(400).send({error: 'Unable to find registered model version.'});
            return null;
        } else if ("PENDING" === lastDeployment?.status) {
            res.status(400).send({error: 'Last deployment is still in progress.'});
            return null;
        }
        return this.getRequestContext(req, workspaceId, registry, lastActiveDeployment?.deploymentId);
    }

    /**
     * Validates and return the deployment termination context.
     * @param req Express request
     * @param res Express response
     * @returns Deployment context
     */
    public async validateAndReturnTerminationContext(req: Request, res: Response): Promise<ContainerGroupRequestContext | undefined>
    {
        const { workspaceId } = req.params;
        const [lastDeployment, lastActiveDeployment] = await Promise.all([
            RequestValidator.nullOnException(() => deploymentProvider.getLatest(workspaceId)),
            RequestValidator.nullOnException(() => deploymentProvider.getActive(workspaceId)),
        ]);
        if ("PENDING" === lastDeployment?.status) {
            res.status(400).send({error: 'Last deployment is still in progress.'});
            return null;
        }
        return this.getRequestContext(req, workspaceId, null, lastActiveDeployment?.deploymentId);
    }

    private getRequestContext(req: Request, workspaceId: string, registry: Experiment, lastActiveId: string): ContainerGroupRequestContext
    {    
        return {
            type: registry?.framework ? FrameworkToContainerGroupTypeMapping[registry.framework] : null,
            name: `ntcore-${workspaceId.toLowerCase()}`,
            version:  registry?.version,
            runtime: registry?.runtime,
            workspaceId: workspaceId,
            command: req.body.command,
            workflow: req.body.workflow,
            lastActiveId: lastActiveId
        }
    }
}