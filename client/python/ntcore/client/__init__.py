import requests
import base64
import json
import mlflow

NTCORE_DEFAULT_BASE_ENDPOINT = 'http://localhost:8000'

class Experiment(object):
    """
    Experiment object that matches the NTCore experiment model.
    
    Attributes
    ----------
    client : str
        The client of NTCore server.

    Methods
    ----------
    emit(experiment)
        Sends the experiment metadata and serialized object to NTCore.
    """
    def __init__(self, client) -> None:
        super().__init__()
        self._client = client

    def get_runtime(self):
        return self._runtime

    def set_runtime(self, runtime):
        self._runtime = runtime
    
    def set_framework(self, framework):
        self._framework = framework

    def get_framework(self):
        return self._framework

    def set_parameters(self, parameters):
        self._parameters = parameters

    def get_parameters(self):
        return self._parameters

    def set_metrics(self, metrics):
        self._metrics = metrics

    def get_metrics(self):
        return self._metrics

    def set_model(self, model):
        self._model = model

    def get_model(self):
        return self._model

    def emit(self):
        """
        Sends the experiment data to NTCore server.

        Parameters
        ----------
        experiment : dictionary, required
            Experiment object containing the metadata and the serialized model.
        """
        self._client.log_experiment(self)


class Client(object):
    """
    Client to interact with NTCore server.
    
    Attributes
    ----------
    endpoint : str
        The endpoint of NTCore server.

    Methods
    ----------
    enable_autolog(workspace_id)
        Enables the auto logging for the workspace.
    log_experiment(experiment)
        Sends the experiment metadata and serialized object to NTCore.
    """
    experiment = None

    def __init__(self, endpoint=None):
        """
        Parameters
        ----------
        endpoint : str
            The endpoint of NTCore server.
        """
        self._endpoint = NTCORE_DEFAULT_BASE_ENDPOINT if endpoint is None else endpoint.strip("/")

    def autolog(self, workspace_id):
        """
        Enables auto logging for experiments.

        Parameters
        ----------
        workspace_id : str
            The workspace id to group the experiments.
        """
        from ntcore.integrations import sklearn
        from ntcore.integrations import tensorflow

        # Patch sklearn
        sklearn.patch()
        mlflow.sklearn.autolog()
        # Patch tensorflow
        tensorflow.patch()
        self._workspace_id = workspace_id

    def get_workspace_id(self):
        """
        Returns the workspace id.
        """
        return self._workspace_id

    def set_endpoint(self, endpoint):
        """
        Sets the NTCore base endpont.
        """
        self._endpoint = endpoint

    def log_experiment(self, experiment: Experiment):
        """
        Sends the experiment data to NTCore server.

        Parameters
        ----------
        experiment : dictionary, required
            Experiment object containing the metadata and the serialized model.

        Raises
        ------
        ValueError
            If no workspace id is set.
        RuntimeError
            If NTCore server is not available at the given endpoint.
        """
        if self._workspace_id is None:
            raise ValueError('Experiment wasn\'t logged since workspace id wasn\'t provided.')

        payload = {
            "runtime": experiment.get_runtime(),
            "framework": experiment.get_framework(),
            "parameters": json.dumps(experiment.get_parameters()),
            "metrics": json.dumps(experiment.get_metrics()), 
            "model": base64.b64encode(experiment.get_model())
        }
        try:
            r = requests.post(self._get_experiment_endpoint(), data=payload).json()
            print('[INFO] Successfully logged model version {} of workspace {}.'.format(r['version'], r['workspaceId']))
        except requests.exceptions.ConnectionError as e:
            print('[WARN] Experiment wasn\'t logged since ntcore wasn\'t available at {0}.'.format(self._endpoint))

    def _get_experiment_endpoint(self):
        """
        Returns the NTCore endpoint for sending experiment data.
        """
        return '{base_endpoint}/dsp/api/v1/workspace/{workspace_id}/experiment'.format(
            base_endpoint=self._endpoint, workspace_id=self._workspace_id)

    def get_experiment(self):
        """
        Returns the global experiment object.
        """
        if Client.experiment is None:
            Client.experiment = Experiment(self)
        return Client.experiment
        
    def start_run(self):
        """
        Start the experiment run backed by mlflow ActiveRun.
        """
        return mlflow.start_run()

    def register_experiment(self,workspace_id,version):
        """
        register experiment
        """
        payload = {"version": version}
        try:
            requests.post(f"{self._endpoint}/dsp/api/v1/workspace/{workspace_id}/registry",data=payload)
        except requests.exceptions.ConnectionError as e:
            raise RuntimeError(f"Experiment wasn\'t logged since ntcore wasn\'t available at {self._endpoint}")
    
    def get_registry(self, workspace_id):
        """
        get registry
        """
        try:
            requests.get(f"{self._endpoint}/dsp/api/v1/workspace/{workspace_id}/registry")
        except requests.exceptions.ConnectionError as e:
            raise RuntimeError(f"Experiment wasn\'t logged since ntcore wasn\'t available at {self._endpoint}")
    
    def unregister_experiment(self,workspace_id):
        """
        unregister experiment
        """
        try:
            requests.delete(f"{self._endpoint}/dsp/api/v1/workspace/{workspace_id}/registry")
        except requests.exceptions.ConnectionError as e:
            raise RuntimeError(f"Experiment wasn\'t logged since ntcore wasn\'t available at {self._endpoint}")
    
    def delete_experiment(self, workspace_id, version):
        """
        delete an experiment
        """
        try:
            requests.delete(f"{self._endpoint}/dsp/api/v1/{workspace_id}/experiment/{version}")
        except requests.exceptions.ConnectionError as e:
            raise RuntimeError(f"Experiment wasn\'t logged since ntcore wasn\'t available at {self._endpoint}")
    
    def deploy_model(self, workspace_id, version):
        """
        deploy model
        based on given workspace id and version
        
        """
        try:
            requests.post(f"{self._endpoint}/dsp/api/v1/workspace/{workspace_id}/model/{version}/deploy")
        except requests.exceptions.ConnectionError as e:
            raise RuntimeError(f"Experiment wasn\'t logged since ntcore wasn\'t available at {self._endpoint}")
    
    def download_model(self, workspace_id, version):
        """
        download the model
        """
        try:
            requests.get(f"{self._endpoint}/dsp/api/v1/workspace/{workspace_id}/model/{version}")
        except requests.exceptions.ConnectionError as e:
            raise RuntimeError(f"Experiment wasn\'t logged since ntcore wasn\'t available at {self._endpoint}")
    
    def create_workspace(self, name):
        """
        create a workspace 
        """
        payload={"type":"API", "name":name}
        try:
            requests.post(f"{self._endpoint}/dsp/api/v1/workspace",data=payload)
        except requests.exceptions.ConnectionError as e:
            raise RuntimeError(f"Experiment wasn\'t logged since ntcore wasn\'t available at {self._endpoint}")
    
    def get_workspace(self, id):
        """
        get a workspace
        """
        try:
            requests.get(f"{self._endpoint}/dsp/api/v1/workspace/{id}")
        except requests.exceptions.ConnectionError as e:
            raise  RuntimeError(f"Experiment wasn\'t logged since ntcore wasn\'t available at {self._endpoint}")
    
    def delete_workspace(self, id):
        """
        delete a workspace based on id
        """
        try:
            requests.delete(f"{self._endpoint}/dsp/api/v1/workspace/{id}")
        except requests.exceptions.ConnectionError as e:
            raise  RuntimeError(f"Experiment wasn\'t logged since ntcore wasn\'t available at {self._endpoint}")
    
    def list_workspaces(self):
        """
        list all workspaces
        """
        try:
            requests.get(f"{self._endpoint}/dsp/api/v1/workspaces")
        except requests.exceptions.ConnectionError as e:
            raise  RuntimeError(f"Experiment wasn\'t logged since ntcore wasn\'t available at {self._endpoint}")
    
    def list_active_deployments(self):
        """
        list all active deployments
        """
        try:
            requests.get(f"{self._endpoint}/dsp/api/v1/deployments/active")
        except requests.exceptions.ConnectionError as e:
            raise  RuntimeError(f"Experiment wasn\'t logged since ntcore wasn\'t available at {self._endpoint}")