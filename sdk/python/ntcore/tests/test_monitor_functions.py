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
        
        mock_response = dict()
        res = monitor.monitor_performance(workspace_id, input_data, ground_truth, value, timestamp)
        
        assert type(res) == type(mock_response)
        assert "workspaceId" in res.keys()
        assert "inputData" in res.keys()
        assert "groundTruth" in res.keys()
        # assert "value" in res.keys()
        assert "timestamp" in res.keys()

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
    
    @patch("requests.post")
    def test_integration(self, mock_response):
        '''
        test integration between monitoring metrics and monitoring performances workflows
        '''

        example_workspace_id = "CE4BCNZRSHGU5EQ7GO2U365ZQL"
        name = "test monitoring metrics and performances"
        value = 0.0018

        input_data = {"x":[1.0, 2.0, 3.0],"b":[3.0, 4.5, 5.0],"c":[6.5, 7.2, 8.4]}
        ground_truth = 0.5
        value = 2
        timestamp = datetime.now()

        mock_response = dict()

        monitor_metrics_res = monitor.monitor_metric(example_workspace_id, name, value)
        monitor_performance_res = monitor.monitor_performance(example_workspace_id, input_data, ground_truth, value, timestamp)
        
        assert type(monitor_metrics_res) == type(mock_response) \
        
        assert type(monitor_performance_res) == type(mock_response) 
        

        