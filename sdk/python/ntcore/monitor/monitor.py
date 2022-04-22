from ..resources.api_client import ApiClient
from .utils import build_url
import json,os

class Monitor(object):
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

        self._api_client = ApiClient(self._username, self._password, self._server, encryption_data)

    def monitor_metric(self, workspace_id, name, value):
        '''
        monitor metrics through the python sdk
        
        PARAMETERS
        ----
        workspace_id: str
        name: str
        value: float
        '''
        
        url = build_url("monitoring", "metrics")
        data = dict({"workspace_id": workspace_id, "name":name, "value":value})
        
        return self._api_client.doPost(url, data)
        
    def monitor_performance(self, workspace_id, input_data, ground_truth, value, timestamp):
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
        
        url = build_url("monitoring","performances")
        input_data_json_string = json.dumps(input_data)
        data = dict({"workspace_id": workspace_id, "inputData":input_data_json_string, "groundTruth": ground_truth, "value": value, "timestamp": timestamp})

        return self._api_client.doPost(url, data)

        

    

