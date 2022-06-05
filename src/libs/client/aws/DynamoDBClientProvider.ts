import { appConfig } from "../../config/AppConfigProvider";
import { AWSClientConfig } from "../../config/AWSClientConfig";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

export default class DatabaseClientProvider 
{
    /**
     * Database client instance;
     */
    private static _client: DynamoDBClient;

    public static get(): DynamoDBClient
    {
        const awsClientConfig = appConfig.database.config as AWSClientConfig
        return this._client || (this._client = new DynamoDBClient(awsClientConfig));
    }
}