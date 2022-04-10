import { Request, Response } from 'express';
import { ExperimentState } from "../providers/experiment/ExperimentProvider";
import { workspaceProvider, experimentProvider } from "../libs/config/AppModule";

export class ExperimentController 
{
    public constructor() 
    {
        this.createExperimentV1 = this.createExperimentV1.bind(this);
        this.listExperimentsV1 = this.listExperimentsV1.bind(this);
        this.getExperimentsV1 = this.getExperimentsV1.bind(this);
        this.downloadModelV1 = this.downloadModelV1.bind(this);
        this.deleteExperimentV1 = this.deleteExperimentV1.bind(this);
        this.registerExperimentV1 = this.registerExperimentV1.bind(this);
        this.getRegistryV1 = this.getRegistryV1.bind(this);
        this.unregisterExperimentV1 = this.unregisterExperimentV1.bind(this);
    }

    /**
     * Endpoint to create experiment.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl -H "Content-Type: application/json" -d '{"model": "Logistic Regression", "parameters": {"penalty": "l2"}, "metrics": {"auc":0.9}}' -X POST http://localhost:8180/dsp/api/v1/workspace/C123/experiment
     */
    public async createExperimentV1(req: Request, res: Response) 
    {
        const workspaceId = req.params.workspaceId;
        const description = req.body.description;
        const runtime = req.body.runtime;
        const framework = req.body.framework;
        const parameters = JSON.parse(req.body.parameters);
        const metrics = JSON.parse(req.body.metrics);
        const model = Buffer.from(req.body.model, 'base64');
        const state = ExperimentState.UNREGISTERED;
        const version = await workspaceProvider.incrementVersion(workspaceId);
        await experimentProvider.create({
            workspaceId,
            version,
            runtime,
            framework,
            parameters,
            metrics,
            description,
            model,
            state,
            createdBy: 'ntcore',
            createdAt: new Date()
        });
        res.status(201).send({workspaceId, version});
    }

    /**
     * Endpoint to list experiment based on the given workspace id.
     * @param req Request
     * @param res Response
     * Example usage:
     * curl http://localhost:8180/dsp/api/v1/workspace/{workspaceId}/experiments
     */
    public async listExperimentsV1(req: Request, res: Response) 
    {
        const workspaceId = req.params.workspaceId;
        const experiments = await experimentProvider.list(workspaceId);
        res.status(200).send(experiments);
    }

    /**
     * Endpoint to get an experiment based on the given workspace id and version.
     * @param req Request
     * @param res Response
     * Example usage:
     * curl http://localhost:8180/dsp/api/v1/workspace/{workspaceId}/experiment/{version}
     */
    public async getExperimentsV1(req: Request, res: Response) 
    {
        const workspaceId = req.params.workspaceId;
        const version = parseInt(req.params.version);
        const experiment = await experimentProvider.read(workspaceId, version);
        res.status(200).send(experiment);
    }

    /**
     * Endpoint to download a model based on the given workspace id and version.
     * @param req Request
     * @param res Response
     * Example usage:
     * curl localhost:8180/dsp/api/v1/workspace/{workspaceId}/model/{version}
     */
    public async downloadModelV1(req: Request, res: Response) 
    {
        const workspaceId = req.params.workspaceId;
        const version = parseInt(req.params.version);
        const buffer = await experimentProvider.loadModel(workspaceId, version);
        const model = Buffer.from(buffer['model'], 'binary');
        res.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Content-Length': model.length
        });
        res.end(model);
    }

    /**
     * Endpoint to delete a experiment version.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl -X DELETE http://localhost:8180/dsp/api/v1/workspace/{id}/experiment/{version}
     */
    public async deleteExperimentV1(req: Request, res: Response) 
    {
        const workspaceId = req.params.workspaceId;
        const version = parseInt(req.params.version);
        await experimentProvider.delete(workspaceId, version)
        res.status(201).send({info: 'Successfully deleted experiment.'});
    }
    
    /**
     * Endpoint to register an experiment.
     * @param req Request
     * @param res Response.
     * Example: curl -X POST http://localhost:8180/dsp/api/v1/workspace/{workspace_id}/registry/{version}
     */
    public async registerExperimentV1(req: Request, res: Response) 
    {
        const workspaceId = req.params.workspaceId;
        const version = parseInt(req.body.version);
        await experimentProvider.register(workspaceId, version);
        res.status(200).send({info: `Registered version ${version}`});
    }

    /**
     * Endpoint to register an experiment.
     * @param req Request
     * @param res Response.
     * Example: curl http://localhost:8180/dsp/api/v1/workspace/{workspace_id}/registry
     */
    public async unregisterExperimentV1(req: Request, res: Response) 
    {
        const workspaceId = req.params.workspaceId;
        await experimentProvider.unregister(workspaceId);
        res.status(200).send({info: `Unregistered all versions in workspace ${workspaceId}`});
    }

    /**
     * Endpoint to register an experiment.
     * @param req Request
     * @param res Response.
     * Example: curl http://localhost:8180/dsp/api/v1/workspace/{workspace_id}/registry
     */
    public async getRegistryV1(req: Request, res: Response) 
    {
        const workspaceId = req.params.workspaceId;
        const registry = await experimentProvider.getRegistry(workspaceId);
        res.status(200).json(registry);
    }
}