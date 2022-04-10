import { BatchClient } from "@aws-sdk/client-batch";
import { appConfig } from "../../config/AppConfigProvider";

export default class ContainerClientProvider 
{
    /**
     * Container client instance;
     */
    private static _client: BatchClient;

    public static get(): BatchClient
    {
        const config = {
            region: appConfig.container.region,
            accessKeyId: appConfig.container.accessKeyId,
            secretAccessKey: appConfig.container.secretAccessKey,
        }
        return this._client || (this._client = new BatchClient(config));
    }
}