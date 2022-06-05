from abc import ABC
from ..resources.api_async_client import ApiAsyncClient
import json, time

class Monitor(ABC):
    """
    NTcore Monitor module

    """

    def __init__(self, 
                workspace_id,
                username=None,
                password=None,
                program_token=None, 
                server="http://localhost:8000/",
                encryption_data=None):
        '''
        Generate Monitor class
        This is the general Python interface that user can monitor the ML/AL models.

        PARAMETERS
        ----
        workspace_id: str
        username: str
        password: str
        program_token: str 
        server: str
        encryption_data: str
        '''
        self._workspace_id = workspace_id
        self._username = username
        self._password = password
        self._program_token = program_token
        self._server = server
        self._api_client = ApiAsyncClient(self._username, self._password, self._server, encryption_data)

    def add_metric(self, name, value):
        '''
        Emits the metric line to ntcore monitoring service.
        
        PARAMETERS
        ----
        workspace_id: str
        name: str
        value: float
        '''
        data = dict(workspaceId = self._workspace_id, name = name, value = value)
        return self._api_client.doPost(self.__build_url("monitoring", "metrics"), data)
        
    def upload_ground_truth(self, input_data, ground_truth, timestamp=None):
        '''
        Upload ground truth data to ntcore monitoring service.
        
        PARAMETERS
        ----
        workspace_id: str
        input_data: JSON String
        ground_truth: any
        value: any
        timestamp: long
        '''
        input_data_json_string = json.dumps(input_data)
        data = dict(workspaceId = self._workspace_id, inputData = input_data_json_string, groundTruth = ground_truth)
        if timestamp:
            data['timestamp'] = timestamp
            
        return self._api_client.doPost(self.__build_url("monitoring", "performances"), data)

    def log(self, message):
        '''
        Emits the log event to ntcore monitoring service.

        PARAMETERS
        ----
        message: str
        '''
        data = dict(event = dict(message = message, time = int(time.time() * 1000)))
        return self._api_client.doPost(self.__build_url("monitoring", self._workspace_id, "events"), data)

    def __build_url(self, *paths):
        '''
        Returns the NTCore endpoint for sending experiment data.
        '''
        return '/'.join(s.strip('/') for s in paths)

    def get_workspace_id(self):
        '''
        Returns the workspace id for this monitor.
        '''
        return self._workspace_id