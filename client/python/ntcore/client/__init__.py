import requests
import pickle
import base64
import json
from integrations import sklearn

NTCORE_DEFAULT_BASE_ENDPOINT = 'http://localhost:8180'


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

    def __init__(self, endpoint=None):
        """
        Parameters
        ----------
        endpoint : str
            The endpoint of NTCore server.
        """
        self._endpoint = NTCORE_DEFAULT_BASE_ENDPOINT if endpoint is None else endpoint

    def enable_autolog(self, workspace_id):
        """
        Enable auto logging for experiments.

        Parameters
        ----------
        workspace_id : str
            The workspace id to group the experiments.
        """
        self._workspace_id = workspace_id
        self._autolog_enabled = True


    def log_experiment(self, experiment):
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
        if experiment['workspace_id'] is None:
            raise ValueError('Experiment wasn\'t logged since workspace id wasn\'t provided.')

        payload = {
            # "runtime": experiment['runtime'],        
            # "framework": experiment['framework'],
            # "parameters": json.dumps(experiment['parameters']),
            "metrics": json.dumps(experiment['metrics']), 
            # "model": base64.b64encode(pickle.dumps(experiment['estimator'])) 
        }

        try:
            # requests.post(self._get_experiment_endpoint(), data=payload)
            print(payload)
        except requests.exceptions.ConnectionError as e:
            raise RuntimeError('Experiment wasn\'t logged since ntcore wasn\'t available at {0}.'.format(self._endpoint))

    def _get_experiment_endpoint(self):
        """
        Gets the NTCore endpoint for sending experiment data.
        """
        return '{base_endpoint}/dsp/api/v1/workspace/{workspace_id}/experiment'.format(
            base_endpoint=self._endpoint, workspace_id=self._workspace_id)

    def start_run(self):
        return Run(self)


class Run(object):

    def __init__(self, client: Client):
        """
        Parameters
        ----------
        client : NTCore client
        """
        self._client = client

    def log_experiment(self, experiment):
        """
        Sends the experiment data to NTCore server.

        Parameters
        ----------
        experiment : dictionary, required
            Experiment object containing the metadata and the serialized model.
        """
        self._client.log_experiment(experiment)

    def __enter__(self):
        """
        Return itself as the run object.
        """
        return self

    def __exit__(self, type, value, traceback):
        """
        Return itself as the run object.
        """
        return
