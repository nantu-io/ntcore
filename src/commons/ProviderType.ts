export const enum ProviderType {
    /**
     * Deploy instances locally with docker.
     */
    DOCKER = "DOCKER",
    /**
     * Deploy instances in Kubernetes cluster.
     */
    KUBERNETES = "KUBERNETES",
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