import { WorkpaceProviderFactory } from "../../providers/workspace/WorkspaceProvider";
import { ExperimentProviderFactory } from "../../providers/experiment/ExperimentProvider";
import { DeploymentProviderFactory } from "../../providers/deployment/DeploymentProvider";
import { StorageProviderFactory } from "../../providers/storage/StorageEngineProvider";

export const workspaceProvider = new WorkpaceProviderFactory().createProvider();
export const experimentProvider = new ExperimentProviderFactory().createProvider();
export const deploymentProvider = new DeploymentProviderFactory().createProvider();
export const storageProvider = new StorageProviderFactory().createProvider();

export async function initialize() 
{
    await workspaceProvider.initialize();
    await experimentProvider.initialize();
    await deploymentProvider.initialize();
}