import { ContainerGroupType, IContainerGroupContextProvider, ContainerGroupRequestContext } from "../../ContainerGroupProvider";
import { AWSECSContainerGroup } from "./AWSECSContainerGroup";

export class AWSECSContainerGroupContextProvider implements IContainerGroupContextProvider
{
    /**
     * Creates the ECS container context.
     * @param requestContext request context
     * @returns ecs container context
     */
    public getContext(requestContext: ContainerGroupRequestContext): AWSECSContainerGroup 
    {
        switch (requestContext.type) {
            case ContainerGroupType.PYTORCH: return this.getTorchBatchContext(requestContext);
            default: throw new Error('Invalid container group type.');
        }
    }

    private getTorchBatchContext(requestContext: ContainerGroupRequestContext): AWSECSContainerGroup
    {
        return {
            type: requestContext.type,
            name: "default",
            cluster: "torch-inf1-unmanaged-beta_Batch_0132bdb6-945e-3eea-9a11-3f16d8e62b9e",
            definition: "torch-standard-single-node-beta",
            command: requestContext.command,
            container: {
                environment: [
                    { name: "DSP_API_ENDPOINT", value: "a889a86116f124201a0d2bdec0ee7fad-1262036029.cn-northwest-1.elb.amazonaws.com.cn:8000" },
                    { name: "DSP_WORKSPACE_ID", value: requestContext.workspaceId },
                    { name: "DSP_WORFLOW_REPO", value: requestContext.workflow },
                ],
                resourceRequirements: [
                    { type: "cpu", value: "4" }
                ]
            },
        };
    }
}