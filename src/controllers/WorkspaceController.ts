import { Request, Response } from 'express';
import { GenericWorkspaceProvider } from "../providers/workspace/GenericWorkspaceProvider";
import { Util } from '../commons/Util';
import { WorkpaceProviderFactory } from '../providers/workspace/WorkspaceProviderFactory';
import { ProviderType } from '../commons/ProviderType';
import { DatabaseProviderType as DatabaseType } from '../commons/DatabaseProviderType';

export class WorkspaceController {
    private readonly _provider: GenericWorkspaceProvider;

    public constructor() {
        this._provider = new WorkpaceProviderFactory().createProvider(ProviderType.LOCAL, DatabaseType.SQLITE);
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
     * curl -H "Content-Type: application/json" -d '{"type":"FLASK_APP", "name":"test"}' -X POST http://localhost:8180/dsp/api/v1/workspace
     */
    public createWorkspaceV1(req: Request, res: Response) {
        const id = `C${Util.createWorkspaceId(req.body.name)}`;
        const workspace = this._provider.create({
            id: id,
            name: req.body.name,
            type: req.body.type,
            createdBy: 'ntcore',
            createdAt: new Date(),
            maxVersion: 0
        });
        workspace.then(() => res.status(201).send({id: id})); 
    }

    /**
     * Endpoint to retrieve a workspace.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl http://localhost:8180/dsp/api/v1/workspace/id
     */
    public getWorkspaceV1(req: Request, res: Response) {
        const workspace = this._provider.read(req.params.id);
        workspace.then(w => res.status(200).send(w));
    }

    /**
     * Endpoint to list all workspaces.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl http://localhost:8180/dsp/api/v1/workspaces
     */
    public listWorkspacesV1(req: Request, res: Response) {
        const workspaces = this._provider.list();
        workspaces.then(w => res.status(200).send(w));
    }

    /**
     * Endpoint to delete a workspace based on the given id.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl -X DELETE http://localhost:8180/dsp/api/v1/workspace/id
     */
    public deleteWorkspaceV1(req: Request, res: Response) {
        const workspaces = this._provider.delete(req.params.id);
        workspaces.then(w => res.status(201).send(w));
    }
}