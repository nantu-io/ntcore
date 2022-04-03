export const enum WorkspaceType 
{
    /**
     * Deploy model as an API. 
     */
    API = "API",

    /**
     * Deploy model as a batch executor. 
     */
    BATCH = "Batch"
}

export const WorkspaceTypeMapping = {
    /**
     * Deploy model as an API. 
     */
    "API": WorkspaceType.API,

    /**
     * Deploy model as a batch executor. 
     */
    "Batch": WorkspaceType.BATCH,
}