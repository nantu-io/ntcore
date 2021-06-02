/**
 * Volume config base.
 */
export abstract class GenericVolume {
    name: string;
    size?: number;
    label?: string;
}
/**
 * Interface for volume provider.
 */
export interface GenericVolumeProvider {
    /**
     * Creates a new volume.
     */
    create: (volume: GenericVolume) => Promise<any>
    /**
     * Delete a volume.
     */
    delete: (volume: GenericVolume) => Promise<any>
}