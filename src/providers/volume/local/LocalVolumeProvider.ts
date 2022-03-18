import Dockerode = require("dockerode");
import { GenericVolume, GenericVolumeProvider } from "../GenericVolumeProvider";

/**
 * Local volume config.
 */
export class LocalVolume extends GenericVolume {}

/**
 * Local volume provider.
 */
export class LocalVolumeProvider implements GenericVolumeProvider {
    private readonly _dockerClient: Dockerode;

    constructor(dockerClient: Dockerode) 
    {
        this._dockerClient = dockerClient;
    }
    
    /**
     * Create a volume with given name.
     * @param volume Volume config.
     * @returns 
     */
    public async create(volume: LocalVolume) 
    {
        return await this._dockerClient.createVolume({Name: volume.name})
    }

    /**
     * Delete a volume based on the given name.
     * @param volume Volume config.
     * @returns 
     */
    public async delete(volume: LocalVolume)
    {
        return await this._dockerClient.getVolume(volume.name).remove();
    }
}