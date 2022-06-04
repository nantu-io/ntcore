export const enum ProviderType {
    /**
     * Deploy instances locally with docker.
     */
    DOCKER = "DOCKER",
    /**
     * Deploy instances in Kubernetes cluster.
     */
    KUBERNETES = "KUBERNETES",
    /**
     * Deploy instances in AliCloud 
     */
    ALICLOUD = "ALICLOUD",
}
/**
 * Provider type mapping.
 */
export const ProviderTypeMapping = {
    /**
     * Docker.
     */
    "docker": ProviderType.DOCKER,
    /**
     * Kubernetes.
     */
    "kubernetes": ProviderType.KUBERNETES,
    /**
     * Ali cloud.
     */
    "alicloud": ProviderType.ALICLOUD,
}
/**
 * Database types.
 */
export const enum DatabaseType 
{
    /**
     * Local database type.
     */
    SQLITE = "SQLITE",
    /**
     * Postgres SQL.
     */
    POSTGRES = "POSTGRES",
}
/**
 * Database types mapping.
 */
export const DatabaseTypeMapping = {
    /**
     * Docker.
     */
     "sqlite": DatabaseType.SQLITE,
     /**
      * Kubernetes.
      */
     "postgres": DatabaseType.POSTGRES,
}
/**
 * Storage engine type.
 */
export const enum StorageEngineType
{
    /**
     * Local storage type.
     */
    VOLUME = "VOLUME",
    /**
     * AWS S3.
     */
    S3 = "S3",
}
/**
 * Storage engine type mapping.
 */
export const StorageEngineTypeMapping = {
    /**
     * Disk volume
     */
    "volume": StorageEngineType.VOLUME,
    /**
     * AWS S3.
     */
    "s3": StorageEngineType.S3,
}