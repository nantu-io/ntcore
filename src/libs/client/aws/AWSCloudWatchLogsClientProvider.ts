import { CloudWatchLogsClient } from "@aws-sdk/client-cloudwatch-logs";
import { appConfig } from "../../config/AppConfigProvider";

export default class LogsClientProvider 
{
    /**
     * Container client instance;
     */
    private static _client: CloudWatchLogsClient;

    public static get(): CloudWatchLogsClient
    {
        const config = {
            region: appConfig.container.region,
            accessKeyId: appConfig.container.accessKeyId,
            secretAccessKey: appConfig.container.secretAccessKey,
        }
        return this._client || (this._client = new CloudWatchLogsClient(config));
    }
}