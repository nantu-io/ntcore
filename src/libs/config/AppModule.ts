import { WorkpaceProviderFactory } from "../../providers/workspace/WorkspaceProvider";
import { ExperimentProviderFactory } from "../../providers/experiment/ExperimentProvider";
import { DeploymentProviderFactory } from "../../providers/deployment/DeploymentProvider";
import { ContainerGroupStateProviderFactory } from "../../providers/container/ContainerGroupProviderFactory";

export const workspaceProvider = new WorkpaceProviderFactory().createProvider();
export const experimentProvider = new ExperimentProviderFactory().createProvider();
export const deploymentProvider = new DeploymentProviderFactory().createProvider();
export const serviceStateProvider = new ContainerGroupStateProviderFactory().createProvider();

export async function initialize() 
{
    await workspaceProvider.initialize();
    await experimentProvider.initialize();
    await deploymentProvider.initialize();
    await serviceStateProvider.initialize();
}