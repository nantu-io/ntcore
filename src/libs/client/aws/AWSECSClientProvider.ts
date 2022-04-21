import { ECSClient } from "@aws-sdk/client-ecs";
import { appConfig } from "../../config/AppConfigProvider";

export default class ContainerClientProvider 
{
    /**
     * Container client instance;
     */
    private static _client: ECSClient;

    public static get(): ECSClient
    {
        const config = {
            region: appConfig.container.region,
            accessKeyId: appConfig.container.accessKeyId,
            secretAccessKey: appConfig.container.secretAccessKey,
        }
        return this._client || (this._client = new ECSClient(config));
    }
}