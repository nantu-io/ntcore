import * as express from "express";
import { DeploymentController } from "../controllers/DeploymentController";
import { ExperimentController } from "../controllers/ExperimentController";
import { InstanceController } from "../controllers/InstanceController";
import { WorkspaceController } from "../controllers/WorkspaceController";
import { ProviderType } from "../commons/ProviderType";

export class Routes {
    private workspaceController: WorkspaceController;
    private instanceController: InstanceController;
    private experimentController: ExperimentController;
    private deploymentController: DeploymentController;

    constructor(providerType: ProviderType) {
        this.workspaceController = new WorkspaceController(providerType);
        this.instanceController = new InstanceController(providerType);
        this.experimentController = new ExperimentController(providerType);
        this.deploymentController = new DeploymentController(providerType);
    }

    public routes(app: express.Application): void {
        app.route('/dsp/api/v1/service/:name/workspace/:workspaceId')
            .post(this.instanceController.createWorkspaceV1)
        app.route('/dsp/api/v1/service/:name')
            .get(this.instanceController.getServiceStateV1)
            .put(this.instanceController.stopServiceV1)
            .delete(this.instanceController.deleteServiceV1)
        app.route('/dsp/api/v1/service')
            .post(this.instanceController.createServiceV1)
        app.route('/dsp/api/v1/services')
            .get(this.instanceController.listServicesV1)
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
        app.route('/dsp/api/v1/workspace/:workspaceId/model/:version')
            .post(this.experimentController.uploadModelV1)
            .get(this.experimentController.downloadModelV1)
        app.route('/dsp/api/v1/workspace/:workspaceId/model/:version/deploy')
            .post(this.experimentController.deployModelV1)
        app.route('/dsp/api/v1/workspace/:workspaceId/deployments')
            .get(this.deploymentController.listDeploymentsV1)
        app.route('/dsp/api/v1/deployments/active')
            .get(this.deploymentController.listActiveDeploymentsV1)
    }
}