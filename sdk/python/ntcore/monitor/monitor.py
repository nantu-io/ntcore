from abc import ABC
from ..resources.api_async_client import ApiAsyncClient
import json, os

class Monitor(ABC):
    """
    NTcore Monitor module

    """

    def __init__(self, 
                username=None,
                password=None,
                program_token=None, 
                server="http://localhost:8000/",
                encryption_data=None):
        '''
        Generate Monitor class
        This is the general Python interface that user can monitor the progress
        '''
        
        self._username = username
        self._password = password
        self._program_token = program_token

        try:
            self._server = "http://" + os.environ["DSP_API_ENDPOINT"]
        except Exception:
            self._server = server

        self._api_client = ApiAsyncClient(self._username, self._password, self._server, encryption_data)

    def add_metric(self, workspace_id, name, value):
        '''
        monitor metrics through the python sdk
        
        PARAMETERS
        ----
        workspace_id: str
        name: str
        value: float
        '''
        data = dict(workspaceId = workspace_id, name = name, value = value)
        return self._api_client.doPost(self.__build_url("monitoring", "metrics"), data)
        
    def upload_ground_truth(self, workspace_id, input_data, ground_truth, timestamp=None):
        '''
        monitor performances through the 
        
        PARAMETERS
        ----
        workspace_id: str
        input_data: JSON String
        ground_truth: any
        value: any
        timestamp: long
        '''
        input_data_json_string = json.dumps(input_data)
        data = dict(workspaceId = workspace_id, inputData = input_data_json_string, groundTruth = ground_truth)
        if timestamp:
            data['timestamp'] = timestamp
            
        return self._api_client.doPost(self.__build_url("monitoring", "performances"), data)

    def __build_url(self, *paths):
        '''
        Returns the NTCore endpoint for sending experiment data.
        '''
        return '/'.join(s.strip('/') for s in paths)