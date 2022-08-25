from .models.experiment import Experiment
from .resources.api_client import ApiClient
from .integrations.utils import get_runtime_version
from .libs.model_serializer import BaseModelSerializer, SklearnModelSerializer, TensorflowModelSerializer, TorchModelSerializer
from .models.framework import Framework
from importlib import import_module
import json

class Client(object):
    '''
    A Python interface for the NTCore API.
    :param username:
        The username of this API user.
    :param password:
        The password of this API user.
    :param programToken:
        The token for the program this user is accessing.
    :param server:
        Your UAT or Production API URL if applicable.
    :param encryptionData:
        Dictionary with params for encrypted requests (keys: clientPrivateKeySetLocation, keySetLocation, etc).
    .. note::
        **server** defaults to the NTCore Sandbox URL if not provided.
    '''

    def __init__(self,
                 api_token=None,
                 username=None,
                 password=None,
                 program_token=None,
                 server="http://localhost:8000/",
                 encryption_data=None):
        '''
        Create an instance of the API interface.
        This is the main interface the user will call to interact with the API.
        '''
        self._username = username
        self._password = password
        self._program_token = program_token
        self._active_experiments = set()
        self._server = server
        self._api_client = ApiClient(self._username, self._password, self._server, encryption_data, api_token)

    def create_workspace(self, name):
        '''
        Creates a new workspace with the given name.
        '''
        return self._api_client.doPost(self.__build_url('workspace'), dict(type = "API", name = name))

    def get_workspace(self, workspace_id):
        '''
        Retrieves metadata of a workspace with the given id.
        '''
        return self._api_client.doGet(self.__build_url('workspace', workspace_id))

    def list_workspaces(self):
        '''
        Retrieves metadata of all the available workspaces.
        '''
        return self._api_client.doGet(self.__build_url('workspaces'))

    def delete_workspace(self, workspace_id):
        '''
        Deletes a given workspace with the given id.
        '''
        return self._api_client.doDel(self.__build_url('workspace', workspace_id))

    def register_experiment(self, workspace_id, version):
        '''
        Register an experiment with the given workspace id and model version.
        '''
        return self._api_client.doPost(self.__build_url('workspace', workspace_id, 'registry'), {"version": version})

    def get_registered_experiment(self, workspace_id):
        '''
        Retrieves the registered experiment for a workspace.
        '''
        return self._api_client.doGet(self.__build_url('workspace', workspace_id, 'registry'))

    def unregister_experiment(self, workspace_id):
        '''
        Unregister an experiment with the given workspace id and model version.
        '''
        return self._api_client.doDel(self.__build_url('workspace', workspace_id, 'registry'))

    def deploy_model(self, workspace_id):
        '''
        Deploy a trained model as API based on the given workspace id and version.
        '''
        return self._api_client.doPost(self.__build_url('deployments'), data={'workspaceId': workspace_id})
    
    def download_model(self, path, workspace_id, version: int = 0):
        '''
        Deploy a trained model as API based on the given workspace id and version.
        '''
        _version = version if version > 0 else self.get_registered_experiment(workspace_id)['version']
        url = self.__build_url(workspace_id, 'models', str(_version))
        serialized: bytes = self._api_client.doGet(url)
        with open(path, 'wb') as f:
            f.write(serialized)

    def start_run(self, workspace_id):
        '''
        Starts a new experiment run with given workspace id.
        '''
        experiment = Experiment(self, workspace_id)
        self._active_experiments.add(experiment)
        return experiment

    def stop_run(self, experiment):
        '''
        Starts a new experiment run with given workspace id.
        '''
        self._active_experiments.discard(experiment)

    def save(self, experiment: Experiment):
        '''
        Emits the metadata and serialized model to NTCore server.
        '''
        workspace_id = experiment.workspace_id
        if workspace_id is None:
            raise ValueError('Workspace id is required')

        serializer = self.__get_model_serializer(experiment.serializable_model, experiment.framework)
        payload = dict(
            runtime = get_runtime_version(),
            framework = serializer.framework().name,
            parameters = json.dumps(experiment.pretraining_metadata).encode('utf-8'),
            metrics = json.dumps(experiment.posttraining_metadata).encode('utf-8'))
        files = dict(model = serializer.serialize(experiment.serializable_model))

        self._api_client.doPost(self.__build_url(workspace_id, 'experiment'), payload, files=files)
        self._active_experiments.discard(experiment)
        serializer.close()

    def __get_model_serializer(self, model, framework: Framework) -> BaseModelSerializer:
        '''
        Returns the model serializer for frameworks, i.e., sklearn, tensorflow, pytorch
        '''
        if self.__isinstance(model, 'sklearn.base', 'BaseEstimator') or (isinstance(model, str) and framework == Framework.sklearn):
            return SklearnModelSerializer()
        elif self.__isinstance(model, 'tensorflow.keras', 'Model') or (isinstance(model, str) and framework == Framework.tensorflow):
            return TensorflowModelSerializer()
        elif self.__isinstance(model, 'torch.nn', 'Module') or (isinstance(model, str) and framework == Framework.pytorch):
            return TorchModelSerializer()
        else:
            raise Exception('Unable to determine model framework.')

    def __isinstance(self, model, module: str, cls: str) -> bool:
        try:
            return isinstance(model, getattr(import_module(module), cls))
        except Exception:
            return False

    def __build_url(self, *paths):
        '''
        Returns the NTCore endpoint for sending experiment data.
        '''
        return '/'.join(s.strip('/') for s in paths)