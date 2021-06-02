import { v4 as uuidv4 } from 'uuid';
import short = require('short-uuid');

const INSTANCE_NAMESPACE = '0a285782-a757-44ed-ad94-094509b1494e';

export class Util {

    public static createInstanceId(name: string) {
        const uuidv5 = require('uuid/v5');
        const uuid = uuidv5(name, INSTANCE_NAMESPACE);
        return short().fromUUID(uuid);
    }

    public static createWorkspaceId(name: string) {
        const uuidv5 = require('uuid/v5');
        const uuid = uuidv5(name, INSTANCE_NAMESPACE);
        const translator = short('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ')
        return translator.fromUUID(uuid);
    }

    public static createDeploymentId() {
        return uuidv4();
    }
}