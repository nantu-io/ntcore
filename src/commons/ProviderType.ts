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
     * Deploy instances in AWS 
     */
    AWS = "AWS",
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
     * AWS.
     */
    "aws": ProviderType.AWS,
    /**
     * Ali cloud.
     */
    "alicloud": ProviderType.ALICLOUD,
}