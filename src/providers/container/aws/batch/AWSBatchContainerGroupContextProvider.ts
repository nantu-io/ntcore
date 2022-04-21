import { ContainerGroupType, IContainerGroupContextProvider, ContainerGroupRequestContext } from "../../ContainerGroupProvider";
import { AWSBatchContainerGroup } from "./AWSBatchContainerGroup";

export class AWSBatchContainerGroupContextProvider implements IContainerGroupContextProvider
{
    /**
     * 
     * @param requestContext 
     * @returns 
     */
    public getContext(requestContext: ContainerGroupRequestContext): AWSBatchContainerGroup 
    {
        switch (requestContext.type) {
            case ContainerGroupType.PYTORCH: return this.getTorchBatchContext(requestContext);
            default: throw new Error('Invalid container group type.');
        }
    }

    private getTorchBatchContext(requestContext: ContainerGroupRequestContext): AWSBatchContainerGroup
    {
        return {
            type: requestContext.type,
            name: `ntcore-${requestContext.workspaceId.toLowerCase()}`,
            definition: "torch-standard-beta",
            queue: "torch-c5-on_demand-multi-node-beta",
            command: requestContext.command,
            container: {
                image: "ntcore/batch-torch",
                environment: [
                    { name: "DSP_API_ENDPOINT", value: "a889a86116f124201a0d2bdec0ee7fad-1262036029.cn-northwest-1.elb.amazonaws.com.cn:8000" },
                    { name: "DSP_WORKSPACE_ID", value: requestContext.workspaceId },
                    { name: "DSP_WORFLOW_REPO", value: requestContext.workflow },
                ],
                resourceRequirements: [
                    { type: "VCPU", value: "4" }
                ]
            },
        };
    }
}