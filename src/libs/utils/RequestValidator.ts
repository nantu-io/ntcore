import { IllegalArgumentException } from '../../commons/Errors';

export class RequestValidator
{
    /**
     * Validate existence of the given parameters
     * @param params input parameters
     */
    public static validateRequest(...params: any[])
    {
        const invalidParams = params.filter(param => !param)
        if (invalidParams.length > 0) {
            throw new IllegalArgumentException();
        }
    }

    /**
     * Returns null when error happens.
     * @param executor operation to execute
     * @returns object from api request
     */
    public static async nullOnException<T>(executor: () => Promise<T>): Promise<T> {
        try {
            return (await executor());
        } catch (e) {
            return null;
        }
    }

    /**
     * Throws illegal argument exception when error happens
     * @param executor operation to execute
     */
    public static async throwOnException<T>(executor: () => Promise<T>): Promise<void> {
        try {
            (await executor());
        } catch (e) {
            throw new IllegalArgumentException();
        }
    }
}