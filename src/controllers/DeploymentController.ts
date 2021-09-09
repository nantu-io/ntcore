import { Request, Response } from 'express';
import { deploymentProvider } from "../libs/config/AppModule";

export class DeploymentController {

    public constructor() {
        this.listDeploymentsV1 = this.listDeploymentsV1.bind(this);
        this.listActiveDeploymentsV1 = this.listActiveDeploymentsV1.bind(this);
    }

    /**
     * Endpoint to list deployments based on the given workspace id.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl http://localhost:8180/dsp/api/v1/workspace/{workspaceId}/deployments
     */
    public async listDeploymentsV1(req: Request, res: Response) {
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
    public async listActiveDeploymentsV1(req: Request, res: Response) {
        const deployments = await deploymentProvider.listActive();
        res.status(200).send(deployments);
    }
}