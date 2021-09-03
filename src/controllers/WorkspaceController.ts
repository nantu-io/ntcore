import { Request, Response } from 'express';
import { GenericWorkspaceProvider, WorkpaceProviderFactory } from "../providers/workspace/GenericWorkspaceProvider";
import { Util } from '../commons/Util';

export class WorkspaceController {
    private readonly _provider: GenericWorkspaceProvider;

    public constructor() {
        this._provider = new WorkpaceProviderFactory().createProvider();
        this.createWorkspaceV1 = this.createWorkspaceV1.bind(this);
        this.getWorkspaceV1 = this.getWorkspaceV1.bind(this);
        this.listWorkspacesV1 = this.listWorkspacesV1.bind(this);
        this.deleteWorkspaceV1 = this.deleteWorkspaceV1.bind(this);
    }

    /**
     * Endpoint to create a workspace.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl -H "Content-Type: application/json" -d '{"type":"API", "name":"test"}' -X POST http://localhost:8180/dsp/api/v1/workspace
     */
    public async createWorkspaceV1(req: Request, res: Response) {
        const id = `C${Util.createWorkspaceId(req.body.name)}`;
        await this._provider.create({
            id: id,
            name: req.body.name,
            type: req.body.type,
            createdBy: 'ntcore',
            createdAt: new Date(),
            maxVersion: 0
        });
        res.status(201).send({id: id});
    }

    /**
     * Endpoint to retrieve a workspace.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl http://localhost:8180/dsp/api/v1/workspace/{id}
     */
    public async getWorkspaceV1(req: Request, res: Response) {
        const workspace = await this._provider.read(req.params.id);
        res.status(200).send(workspace);
    }

    /**
     * Endpoint to list all workspaces.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl http://localhost:8180/dsp/api/v1/workspaces
     */
    public async listWorkspacesV1(req: Request, res: Response) {
        const workspaces = await this._provider.list();
        res.status(200).send(workspaces);
    }

    /**
     * Endpoint to delete a workspace based on the given id.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl -X DELETE http://localhost:8180/dsp/api/v1/workspace/{id}
     */
    public async deleteWorkspaceV1(req: Request, res: Response) {
        const workspaces = await this._provider.delete(req.params.id);
        res.status(201).send(workspaces);
    }
}