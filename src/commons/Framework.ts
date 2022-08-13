import { ContainerGroupType } from "../providers/container/ContainerGroupProvider"

/**
 * Runtimes.
 */
 export type Framework = "sklearn" | "tensorflow" | "pytorch"
/**
 * Framework to container group type mapping.
 */
export const FrameworkToContainerGroupTypeMapping = {
    /**
     * Sklearn.
     */
    ["sklearn" as Framework] : ContainerGroupType.SKLEARN,
    /**
     * Tensorflow.
     */
    ["tensorflow" as Framework] : ContainerGroupType.TENSORFLOW,
    /**
     * Pytorch.
     */
    ["pytorch" as Framework] : ContainerGroupType.PYTORCH,
}