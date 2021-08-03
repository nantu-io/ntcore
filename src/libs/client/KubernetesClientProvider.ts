import k8s = require('@kubernetes/client-node');
import { KubernetesObjectApi } from '@kubernetes/client-node';

export default class ContainerClientProvider {
    /**
     * Container client instance;
     */
    private static _client: KubernetesObjectApi;

    public static get(): KubernetesObjectApi {
        return this._client || (this._client = this.createKubernetesClient());
    }

    private static createKubernetesClient() {
        const kubernetesConfig = new k8s.KubeConfig();
        kubernetesConfig.loadFromDefault();
        return k8s.KubernetesObjectApi.makeApiClient(kubernetesConfig);
    }
}