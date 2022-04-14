import { BatchClient, SubmitJobCommand, DescribeJobsCommand, CancelJobCommand, TerminateJobCommand, NodeOverrides } from "@aws-sdk/client-batch";
import { ContainerGroupState, IContainerGroupProvider } from '../../ContainerGroupProvider';
import { AWSBatchContainerGroup } from './AWSBatchContainerGroup';
import { NotImplementedException } from "../../../../commons/Errors";

export class AWSBatchContainerGroupProvider implements IContainerGroupProvider 
{
    private readonly _awsBatchClient: BatchClient;

    constructor(awsBatchClient: BatchClient) 
    {
        this._awsBatchClient = awsBatchClient;
    }

    public async provision(config: AWSBatchContainerGroup): Promise<AWSBatchContainerGroup> 
    {
        return config;
    }

    public async start(config: AWSBatchContainerGroup): Promise<AWSBatchContainerGroup>  
    {
        const nodePropertyOverride = {
            targetNodes: "0:",
            containerOverrides: {
                environment: config.container.environment,
                resourceRequirements: config.container.resourceRequirements
            }
        };
        const response = await this._awsBatchClient.send(new SubmitJobCommand({
            jobDefinition: config.definition,
            jobQueue: config.queue,
            jobName: config.name,
            /*
            containerOverrides: { 
                environment: config.container.environment,
                resourceRequirements: config.container.resourceRequirements
            },
            */
            nodeOverrides: { nodePropertyOverrides: [ nodePropertyOverride ] }
        }));
        return {id: response.jobId, ...config};
    }
 
    public async stop(config: AWSBatchContainerGroup): Promise<AWSBatchContainerGroup>  
    {
        this._awsBatchClient.send(new CancelJobCommand({
            jobId: config.id,
            reason: 'NTCore API Request'
        }));
        return config;
    }
     
    public async delete(config: AWSBatchContainerGroup): Promise<AWSBatchContainerGroup>  
    {
        this._awsBatchClient.send(new TerminateJobCommand({
            jobId: config.id,
            reason: 'NTCore API Request'
        }));
        return config;
    }
     
    public async update(config: AWSBatchContainerGroup): Promise<AWSBatchContainerGroup>  
    {
        throw new NotImplementedException();
    }
 
    public async getState(config: AWSBatchContainerGroup): Promise<AWSBatchContainerGroup> 
    {
        const response = await this._awsBatchClient.send(new DescribeJobsCommand({
            jobs: [ config.id ]
        }));
        if (response.jobs.length == 0) {
            throw new Error('Jobs not found!')
        }
        const job = response.jobs[0];
        var state: ContainerGroupState;
        if (job.status == "SUCCEEDED" || job.status == "FAILED") {
            state = ContainerGroupState.STOPPED;
        } else if (job.status == "RUNNING") {
            state = ContainerGroupState.RUNNING;
        } else {
            state = ContainerGroupState.PENDING;
        }
        return { id: job.jobId, name: job.jobName, state: state };
    }

    public async getLogs(config: AWSBatchContainerGroup): Promise<string>
    {
        throw new NotImplementedException();
    }
}