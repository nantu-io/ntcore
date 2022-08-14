import { Request, Response } from 'express';
import { workspaceProvider } from "../libs/config/AppModule";
import { storageProvider } from "../libs/config/AppModule";
import { appConfig } from '../libs/config/AppConfigProvider';
import { Workspace } from '../providers/workspace/WorkspaceProvider';
import { RequestValidator } from '../libs/utils/RequestValidator';
import { ErrorHandler } from '../libs/utils/ErrorHandler';
import { v4 as uuidv4 } from 'uuid';
import short = require('short-uuid');

const AUTH_USER_HEADER_NAME = "X-NTCore-Auth-User";
const SHORT_UUID_TRANSLATOR = short('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ')

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
        res: Response<Workspace>) {
        try {
            const { name, type } = req.body;
            RequestValidator.validateRequest(name, type);
            const userId = req.get(AUTH_USER_HEADER_NAME) ?? appConfig.account.username;
            const workspace = this.createWorkspace(name, type, userId);
            await workspaceProvider.create(workspace);
            await storageProvider.createWorkspace(workspace.id);
            res.status(201).send(workspace);
        } catch (err) {
            ErrorHandler.handleException(err, res);
        }
    }

    private createWorkspace(name: string, type: "API" | "Batch", userId: string): Workspace
    {
        return {
            id: `C${SHORT_UUID_TRANSLATOR.fromUUID(uuidv4())}`,
            type: type,
            name: name,
            createdBy: userId,
            createdAt: Date.now(),
            maxVersion: 0,
            isDeleted: 0,
        }
    }

    /**
     * Endpoint to retrieve a workspace.
     * @param req Request
     * @param res Response
     * Example usage: 
     * curl http://localhost:8180/dsp/api/v1/workspace/{id}
     */
    public async getWorkspaceV1(
        req: Request<{id: string}, {}, {}, {}>, 
        res: Response<Workspace>) {
        try {
            const { id } = req.params;
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
    public async listWorkspacesV1(
        req: Request<{}, {}, {}, {}>, 
        res: Response<Workspace[]>) {
        try {
            const userId = req.get(AUTH_USER_HEADER_NAME) ?? appConfig.account.username;
            const workspaces = await workspaceProvider.list(userId);
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
        req: Request<{id: string}, {}, {}, {}>, 
        res: Response<Workspace>) {
        try {
            const { id } = req.params;
            RequestValidator.validateRequest(id);
            await workspaceProvider.delete(id);
            await storageProvider.deleteWorkspace(id);
            res.status(201).send();
        } catch (err) {
            ErrorHandler.handleException(err, res);
        }
    }
}