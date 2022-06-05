import { IllegalArgumentException } from '../../commons/Errors';

export class RequestValidator 
{
    public static validateRequest(...params: any[])
    {
        const invalidParams = params.filter(param => !param)
        if (invalidParams.length > 0) {
            throw new IllegalArgumentException();
        }
    }
}