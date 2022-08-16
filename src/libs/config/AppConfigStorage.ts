/**
 * Storage config in AppConfig.
 */
export class AppConfigStorage
{
    type: "volume" | "s3";
    config: AppConfigVolume | AppConfigS3
}
/**
 * S3 storage config in AppConfig.
 */
export class AppConfigS3
{
    bucket: string;
    root: string;
    region: string
    accessKeyId: string;
    secretAccessKey: string;
}
/**
 * Disk storage config in AppConfig.
 */
export class AppConfigVolume
{
    root: string;
}