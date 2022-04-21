import { ECSClient, RunTaskCommand, StopTaskCommand, DescribeTasksCommand } from "@aws-sdk/client-ecs";
import { ContainerGroupState, IContainerGroupProvider } from '../../ContainerGroupProvider';
import { AWSECSContainerGroup } from './AWSECSContainerGroup';
import { NotImplementedException } from "../../../../commons/Errors";
import { CloudWatchLogsClient, GetLogEventsCommand } from "@aws-sdk/client-cloudwatch-logs";

export class AWSECSContainerGroupProvider implements IContainerGroupProvider 
{
    private readonly _awsECSClient: ECSClient;
    private readonly _cloudWatchLogsClient: CloudWatchLogsClient;

    constructor(awsECSClient: ECSClient, cloudWatchLogsClient: CloudWatchLogsClient) 
    {
        this._awsECSClient = awsECSClient;
        this._cloudWatchLogsClient = cloudWatchLogsClient;
    }

    public async provision(config: AWSECSContainerGroup): Promise<AWSECSContainerGroup> 
    {
        return config;
    }

    public async start(config: AWSECSContainerGroup): Promise<AWSECSContainerGroup>  
    {
        const containerOverride = {
            command: config.command.split(" "),
            environment: config.container.environment,
            name: config.name,
        }
        const response = await this._awsECSClient.send(new RunTaskCommand({
            cluster: config.cluster,
            taskDefinition: config.definition,
            overrides: { containerOverrides: [ containerOverride ] }
        }));
        return {id: response.tasks[0].taskArn.split("/").pop(), ...config};
    }
 
    public async stop(config: AWSECSContainerGroup): Promise<AWSECSContainerGroup>  
    {
        throw new NotImplementedException();   
    }
     
    public async delete(config: AWSECSContainerGroup): Promise<AWSECSContainerGroup>  
    {
        this._awsECSClient.send(new StopTaskCommand({
            task: config.id,
        }));
        return config;
    }
     
    public async update(config: AWSECSContainerGroup): Promise<AWSECSContainerGroup>  
    {
        throw new NotImplementedException();
    }
 
    public async getState(config: AWSECSContainerGroup): Promise<AWSECSContainerGroup> 
    {
        const response = await this._awsECSClient.send(new DescribeTasksCommand({
            cluster: config.cluster,
            tasks: [ config.id ]
        }));
        if (response.tasks.length == 0) {
            throw new Error('Tasks not found!')
        }
        const task = response.tasks[0];
        var state: ContainerGroupState;
        if (task.lastStatus == "STOPPED") {
            state = ContainerGroupState.STOPPED;
        } else if (task.lastStatus == "RUNNING") {
            state = ContainerGroupState.RUNNING;
        } else {
            state = ContainerGroupState.PENDING;
        }
        return { id: response.tasks[0].taskArn.split("/").pop(), cluster: config.cluster, state: state };
    } 

    public async getLogs(config: AWSECSContainerGroup): Promise<string>
    {
        const response = await this._cloudWatchLogsClient.send(new GetLogEventsCommand({
            logGroupName: "/aws/batch/job",
            logStreamName: `${config.definition}/${config.name}/${config.id}`
        }));
        return response.events.slice(0, 100).map(e => e.message).join("\n")
    }
}