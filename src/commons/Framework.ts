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
 * Runtime mapping.
 */
 export const FrameworkMapping = {
    /**
     * Python 3.7
     */
    "sklearn": Framework.SKLEARN,
    /**
     * Python 3.8
     */
    "tensorflow": Framework.TENSORFLOW,
    /**
     * Python 3.9
     */
    "pytorch": Framework.PYTORCH,
}