import { Request, Response } from 'express';
import { workspaceProvider } from "../libs/config/AppModule";
import { storageProvider } from "../libs/config/AppModule";
import { appConfig } from '../libs/config/AppConfigProvider';
import { Workspace } from '../providers/workspace/WorkspaceProvider';
import { RequestValidator } from '../libs/utils/RequestValidator';
import { ErrorHandler } from '../libs/utils/ErrorHandler';
import short = require('short-uuid');

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
    public async createWorkspaceV1(
        req: Request<{}, {}, {name: string, type: "API" | "Batch"}, {}>, 
        res: Response<Workspace>)
    {
        const { name, type } = req.body;
        try {
            RequestValidator.validateRequest(name, type);
            const workspace = {
                id: this.createWorkspaceId(name),
                type: type,
                name: name,
                createdBy: appConfig.account.username,
                createdAt: Date.now(),
                maxVersion: 0
            }
            await workspaceProvider.create(workspace);
            await storageProvider.createWorkspace(workspace.id);
            res.status(201).send(workspace);
        } catch (err) {
            ErrorHandler.handleException(err, res);
        }
    }

    private createWorkspaceId(name: string)
    {
        const uuidv5 = require('uuid/v5');
        const uuid = uuidv5(name, '0a285782-a757-44ed-ad94-094509b1494e');
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
    public async getWorkspaceV1(
        req: Request<{id: string}, {}, {}, {}>, res: Response<Workspace>)
    {
        const { id } = req.params;
        try {
            RequestValidator.validateRequest(id);
            const workspace = await workspaceProvider.read(id);
            res.status(200).send(workspace);
        } catch (err) {
            ErrorHandler.handleException(err, res);
        }
    }

    /**
     * Endpoint to list all workspaces.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl http://localhost:8180/dsp/api/v1/workspaces
     */
    public async listWorkspacesV1(req: Request, res: Response<Workspace[]>)
    {
        try {
            const username = appConfig.account.username;
            const workspaces = await workspaceProvider.list(username);
            res.status(200).send(workspaces);
        } catch (err) {
            ErrorHandler.handleException(err, res);
        }
    }

    /**
     * Endpoint to delete a workspace based on the given id.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl -X DELETE http://localhost:8180/dsp/api/v1/workspace/{id}
     */
    public async deleteWorkspaceV1(
        req: Request<{id: string}, {}, {}, {}>, res: Response<Workspace>)
    {
        const { id } = req.params;
        try {
            RequestValidator.validateRequest(id);
            await workspaceProvider.delete(id);
            await storageProvider.deleteWorkspace(id);
            res.status(201).send();
        } catch (err) {
            ErrorHandler.handleException(err, res);
        }
    }
}