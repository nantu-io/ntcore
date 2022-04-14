import { ECSClient, RunTaskCommand, StopTaskCommand, DescribeTasksCommand } from "@aws-sdk/client-ecs";
import { ContainerGroupState, IContainerGroupProvider } from '../../ContainerGroupProvider';
import { AWSECSContainerGroup } from './AWSECSContainerGroup';
import { NotImplementedException } from "../../../../commons/Errors";

export class AWSECSContainerGroupProvider implements IContainerGroupProvider 
{
    private readonly _awsECSClient: ECSClient;

    constructor(awsECSClient: ECSClient) 
    {
        this._awsECSClient = awsECSClient;
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
            name: "default",
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
        return { id: response.tasks[0].taskArn, cluster: config.cluster, state: state };
    } 
}