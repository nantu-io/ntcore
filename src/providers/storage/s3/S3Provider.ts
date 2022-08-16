import { Request, RequestHandler, Response } from 'express';
import { StorageProvider } from "../StorageEngineProvider";
import { StorageEngine } from "multer";
import { appConfig } from "../../../libs/config/AppConfigProvider";
import { AppConfigS3 } from "../../../libs/config/AppConfigStorage";
import * as S3 from "aws-sdk/clients/s3";
import multerS3 = require('multer-s3');

/**
 * Docker volume provider.
 */
export class S3Provider implements StorageProvider
{
    private readonly _s3Client: S3;
    
    constructor(s3Client: S3)
    {
        this._s3Client = s3Client;
    }

    public getStorageEngine(): StorageEngine 
    {
        const config = appConfig.storage.config as AppConfigS3
        return multerS3({
            s3: this._s3Client,
            bucket: config.bucket,
            metadata: function (req: Request, file, cb) {
                cb(null, {fieldName: file.fieldname});
            },
            key: function (req: Request, file: any, cb: any) {
                // TODO: Append useId as suffix to avoid multi user conflicts
                cb(null, config.root + `/${req.params.workspaceId}/models/.tmp/model`);
            }
        });
    }

    /**
     * Creates the workspace root directory with the given id.
     * @param workspaceId workspace id.
     */
    public async createWorkspace(workspaceId: string): Promise<void>
    {
        
    }

    /**
     * Moves object to the target location.
     * @param workspaceId workspace id
     * @param version model version
     */
    public async putObject(workspaceId: string, version: number): Promise<void>
    {
        const config = appConfig.storage.config as AppConfigS3;
        await this._s3Client.copyObject({
            Bucket: config.bucket,
            CopySource: `${config.bucket}/${config.root}/${workspaceId}/models/.tmp/model`,
            Key: `${config.root}/${workspaceId}/models/v${version}/model`,
        }).promise()
        await this._s3Client.deleteObject({
            Bucket: config.bucket,
            Key: `${config.root}/${workspaceId}/models/.tmp/model}`,
        }).promise();
    }

    /**
     * Returns middleware for object retrieval.
     */
    public getObjectProxy(): RequestHandler
    {
        return async (req: Request<{workspaceId: string, version: string}>, res: Response) => {
            const { workspaceId, version } = req.params;
            const config = appConfig.storage.config as AppConfigS3;
            const fileKey = `${config.root}/${workspaceId}/models/v${version}/model`;
            const options = { Bucket: config.bucket, Key: fileKey };
            res.attachment(fileKey);
            const fileStream = this._s3Client.getObject(options).createReadStream();
            fileStream.pipe(res);
        }
    }

    /**
     * Deletes the given workspace.
     * @param workspaceId workspace id.
     */
    public async deleteWorkspace(workspaceId: string): Promise<void>
    {
        
    }
}
