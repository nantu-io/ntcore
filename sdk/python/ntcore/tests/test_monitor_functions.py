from monitor.monitor import Monitor
from datetime import datetime
from exceptions.exceptions import NTCoreAPIException
import unittest
from unittest.mock import patch

monitor = Monitor()

class PythonSDKMonitorTest(unittest.TestCase):
    '''
    Python Monitor Test Class

    '''

    @patch("requests.post")
    def test_post_metrics(self, mock_response):
        '''
        test post metrics method
        '''
        
        example_workspace_id = "CE4BCNZRSHGU5EQ7GO2U365ZQL"
        name = "test monitor metrics"
        value = 0.0018
        mock_response.return_value = dict(workspaceId=example_workspace_id, name=name, value=str(value),timestamp=str(datetime.now()))
        res = monitor.monitor_metric(example_workspace_id, name, value)
        
        assert isinstance(res,dict)
        assert "workspaceId" in res
        assert "name" in res
        assert "value" in res
    
    @patch("requests.post")
    def test_post_metrics_error(self, mock_response):
        '''
        test post metrics with wrong inputs
        the expected will be error
        '''
        
        example_workspace_id_wrong = 1
        name = "test monitor metrics error"
        value = "4"
        mock_response = NTCoreAPIException()
        
        with patch("requests.post"):
            try:
                monitor.monitor_metric(example_workspace_id_wrong, name, value)
            except Exception as e:
                assert "errror" in e
                assert type(e) == type(mock_response)
                raise 


    @patch("requests.post")
    def test_post_performances(self, mock_response):
        '''
        test post performances method
        '''
        workspace_id = "CE4BCNZRSHGU5EQ7GO2U365ZQL"
        input_data = {"a":1.0,"b":2.0,"c":3.0}
        ground_truth = 0
        value = 0
        timestamp = datetime.now()
        
        
        assert isinstance(monitor.monitor_performance(workspace_id, input_data, ground_truth, value, timestamp),dict)
    
    @patch("requests.post")
    def test_post_performances_error(self, mock_response):
        '''
        test post performances with wrong inputs
        the error will be expected
        '''
        workspace_id_wrong = 1
        input_data = {}
        ground_truth = 0
        value = 0
        timestamp = datetime.now()
        mock_response = NTCoreAPIException()

        with patch("requests.post"):
            try:
                monitor.monitor_performance(workspace_id_wrong, input_data, ground_truth, value, timestamp)
            except Exception as e:
                assert "error" in e
                assert type(e) == type(mock_response)
                raise
