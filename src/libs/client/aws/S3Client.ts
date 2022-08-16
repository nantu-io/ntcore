import { appConfig } from "../../config/AppConfigProvider";
import { AWSClientConfig } from "../../config/AWSClientConfig";
import * as S3 from "aws-sdk/clients/s3";

export default class S3ClientProvider
{
    /**
     * Database client instance;
     */
    private static _client: S3;

    public static get(): S3
    {
        const awsClientConfig = appConfig.storage.config as AWSClientConfig
        return this._client || (this._client = new S3(awsClientConfig));
    }
}