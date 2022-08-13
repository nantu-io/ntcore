import * as express from "express";
import * as multer from 'multer';
import { DeploymentController } from "../controllers/DeploymentController";
import { ExperimentController } from "../controllers/ExperimentController";
import { WorkspaceController } from "../controllers/WorkspaceController";
import { storageProvider } from "../libs/config/AppModule";

export class Routes 
{
    private workspaceController: WorkspaceController;
    private experimentController: ExperimentController;
    private deploymentController: DeploymentController;

    constructor() 
    {
        this.workspaceController = new WorkspaceController();
        this.experimentController = new ExperimentController();
        this.deploymentController = new DeploymentController();
    }

    public routes(app: express.Application): void 
    {
        app.route('/dsp/api/v1/workspace')
            .post(this.workspaceController.createWorkspaceV1)
        app.route('/dsp/api/v1/workspace/:id')
            .get(this.workspaceController.getWorkspaceV1)
            .delete(this.workspaceController.deleteWorkspaceV1)
        app.route('/dsp/api/v1/workspaces')
            .get(this.workspaceController.listWorkspacesV1)
        app.route('/dsp/api/v1/workspace/:workspaceId/experiment')
            .post(this.experimentController.createExperimentV1)
        app.route('/dsp/api/v1/workspace/:workspaceId/experiments')
            .get(this.experimentController.listExperimentsV1)
        app.route('/dsp/api/v1/workspace/:workspaceId/experiment/:version')
            .get(this.experimentController.getExperimentsV1)
            .delete(this.experimentController.deleteExperimentV1)
        app.route('/dsp/api/v1/workspace/:workspaceId/registry')
            .post(this.experimentController.registerExperimentV1)
            .get(this.experimentController.getRegistryV1)
            .delete(this.experimentController.deregisterExperimentV1)
        app.route('/dsp/api/v1/deployments')
            .post(this.deploymentController.deployModelV1)
        app.route('/dsp/api/v1/workspace/:workspaceId/deployments')
            .get(this.deploymentController.listDeploymentsV1)
        app.route('/dsp/api/v1/deployments/active')
            .get(this.deploymentController.listActiveDeploymentsV1)

         // TODO: follow the below url format to modify the above.
        app.route('/dsp/api/v1/:workspaceId/deployment')
            .delete(this.deploymentController.terminateDeploymentV1)
        app.route('/dsp/api/v1/:workspaceId/logs/:deploymentId')
            .get(this.deploymentController.retrieveLogEvents)
        app.post('/dsp/api/v1/:workspaceId/experiment', 
            multer({ storage: storageProvider.getStorageEngine() }).single('model'), 
            this.experimentController.createExperimentV1);
        app.get('/dsp/api/v1/:workspaceId/models/:version',
            storageProvider.getObjectProxy())
    }
}