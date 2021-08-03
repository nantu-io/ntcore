import Dockerode = require('dockerode');

export default class ContainerClientProvider {
    /**
     * Container client instance;
     */
    private static _client: Dockerode;

    public static get(): Dockerode {
        return this._client || (this._client = new Dockerode());
    }
}