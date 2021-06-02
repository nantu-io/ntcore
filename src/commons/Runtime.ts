/**
 * Runtimes.
 */
 export const enum Runtime {
    /**
     * Python 3.7
     */
    PYTHON_37 = "python-3.7",
    /**
     * Python 3.8
     */
    PYTHON_38 = "python-3.8",
    /**
     * Python 3.9
     */
    PYTHON_39 = "python-3.9",
}
/**
 * Runtime mapping.
 */
 export const RuntimeMapping = {
    /**
     * Python 3.7
     */
    "python-3.7": Runtime.PYTHON_37,
    /**
     * Python 3.8
     */
    "python-3.8": Runtime.PYTHON_38,
    /**
     * Python 3.9
     */
    "python-3.9": Runtime.PYTHON_39,
}