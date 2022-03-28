import { Request, Response } from 'express';
import { workspaceProvider } from "../libs/config/AppModule";
import short = require('short-uuid');

const NAMESPACE = '0a285782-a757-44ed-ad94-094509b1494e';

export class WorkspaceController 
{
    public constructor() 
    {
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
    public async createWorkspaceV1(req: Request, res: Response) 
    {
        const workspace = {
            id: this.createWorkspaceId(req.body.name),
            name: req.body.name,
            type: req.body.type,
            createdBy: 'ntcore',
            createdAt: new Date(),
            maxVersion: 0
        }
        try {
            await workspaceProvider.create(workspace);
            res.status(201).send(workspace);
        } catch (err) {
            res.status(400).send({error: err});
        }
    }

    private createWorkspaceId(name: string) 
    {
        const uuidv5 = require('uuid/v5');
        const uuid = uuidv5(name, NAMESPACE);
        const translator = short('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ')
        return `C${translator.fromUUID(uuid)}`;
    }

    /**
     * Endpoint to retrieve a workspace.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl http://localhost:8180/dsp/api/v1/workspace/{id}
     */
    public async getWorkspaceV1(req: Request, res: Response) 
    {
        const workspace = await workspaceProvider.read(req.params.id);
        res.status(200).send(workspace);
    }

    /**
     * Endpoint to list all workspaces.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl http://localhost:8180/dsp/api/v1/workspaces
     */
    public async listWorkspacesV1(req: Request, res: Response) 
    {
        const workspaces = await workspaceProvider.list();
        res.status(200).send(workspaces);
    }

    /**
     * Endpoint to delete a workspace based on the given id.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl -X DELETE http://localhost:8180/dsp/api/v1/workspace/{id}
     */
    public async deleteWorkspaceV1(req: Request, res: Response) 
    {
        const workspaces = await workspaceProvider.delete(req.params.id);
        res.status(201).send(workspaces);
    }
}