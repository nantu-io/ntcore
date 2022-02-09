/**
 * Runtimes.
 */
 export const enum Framework {
    /**
     * Python 3.7
     */
    SKLEARN = "sklearn",
    /**
     * Python 3.8
     */
    TENSORFLOW = "tensorflow",
    /**
     * Python 3.9
     */
    PYTORCH = "pytorch",
}
/**
 * Framework mapping.
 */
 export const FrameworkMapping = {
    /**
     * Sklearn.
     */
    "sklearn": Framework.SKLEARN,
    /**
     * Tensorflow.
     */
    "tensorflow": Framework.TENSORFLOW,
    /**
     * Pytorch.
     */
    "pytorch": Framework.PYTORCH,
}