import { Request, RequestHandler, Response } from 'express';
import { StorageEngine } from "multer";
import { StorageProvider } from "../StorageEngineProvider";
import { appConfig } from "../../../libs/config/AppConfigProvider";
import * as multer from 'multer';
const fsPromises = require('fs').promises;

/**
 * Docker volume provider.
 */
export class DockerVolumeProvider implements StorageProvider 
{
    /**
     * Provides disk volume storage engine in docker.
     * @returns disk volume storage engine.
     */
    public getStorageEngine(): StorageEngine
    {
        return multer.diskStorage({
            destination: function (req, file, cb)
            {
                cb(null, appConfig.storage.config.root + `/${req.params.workspaceId}/models/.tmp`);
            },
            filename: function (req, file, cb) 
            {
                cb(null, "model");
            }
        });
    }

    /**
     * Creates the workspace root directory with the given id.
     * @param workspaceId workspace id.
     */
    public async createWorkspace(workspaceId: string): Promise<void>
    {
        const root = appConfig.storage.config.root;
        const targetPath = root + `/${workspaceId}`;
        await fsPromises.mkdir(targetPath);
        await fsPromises.mkdir(targetPath + "/models");
        await fsPromises.mkdir(targetPath + "/models/.tmp");
    }

    /**
     * Moves object to the target location.
     * @param workspaceId workspace id
     * @param version model version
     */
    public async putObject(workspaceId: string, version: number): Promise<void>
    {
        const root = appConfig.storage.config.root;
        const tempPath = root + `/${workspaceId}/models/.tmp/model`;
        const targetPath = root + `/${workspaceId}/models/v${version}`;
        await fsPromises.mkdir(targetPath);
        await fsPromises.rename(tempPath, targetPath + "/model");
    }

    /**
     * Returns middleware for object retrieval.
     */
    public getObjectProxy(): RequestHandler
    {
        return async (req: Request, res: Response) => {
            const workspaceId = req.params.workspaceId;
            const version = req.params.version;
            const root = appConfig.storage.config.root;
            const modelPath = root + `/${workspaceId}/models/v${version}/model`;
            try {
                await fsPromises.stat(modelPath);
                res.status(200).download(modelPath);
            } catch (err) {
                res.status(500).send({error: `Unable to download model: ${err}`});
            }
        }
    }

    /**
     * Deletes the given workspace.
     * @param workspaceId workspace id.
     */
    public async deleteWorkspace(workspaceId: string): Promise<void>
    {
        const root = appConfig.storage.config.root;
        const toDeletePath = root + `/${workspaceId}`;
        await fsPromises.rmdir(toDeletePath, { recursive: true, force: true });
    }
}