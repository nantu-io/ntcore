import { DeploymentContext } from "../../deployment/DeploymentContextProvider";
import { KubernetesServiceV1 } from "./KubeContainerGroup";

export class KubernetesServiceProviderV1
{
    public getKubernetesService(namespace: string, deploymentContext: DeploymentContext): KubernetesServiceV1 
    {
        return {
            apiVersion: "v1",
            kind: "Service",
            metadata: { 
                name: deploymentContext.name,
                namespace: namespace
            },
            spec: {
                selector: { app: deploymentContext.name },
                ports: [ { protocol: "TCP", name: "web", port: deploymentContext.listenPort } ]
            }
        };
    }
}