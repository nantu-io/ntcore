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