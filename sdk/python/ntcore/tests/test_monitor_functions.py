from http import HTTPStatus
from ..monitor.monitor import Monitor
from datetime import datetime
import unittest
from unittest.mock import patch
import pytest
import json

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
        value = 1
        mock_response.return_value = HTTPStatus.OK
        
        assert monitor.monitor_metric(example_workspace_id, name, value) == HTTPStatus.OK \
    
    def test_post_metrics_error(self):
        '''
        test post metrics with wrong inputs
        the expected will be error
        '''
        example_workspace_id_wrong = 1
        name = "test monitor metrics error"
        value = 0
        with patch("requests.post",side_effect=ConnectionError):
            with pytest.raises(ConnectionError):
                try:
                    monitor.monitor_metric(example_workspace_id_wrong, name, value)
                except Exception as e:
                    assert isinstance(e, ConnectionError)
                    raise 


    @patch("requests.post")
    def test_post_performances(self, mock_response):
        '''
        test post performances method
        '''
        workspace_id = "CE4BCNZRSHGU5EQ7GO2U365ZQL"
        input_data = {}
        ground_truth = 0
        value = 0
        timestamp = datetime.now()
        
        
        assert monitor.monitor_performance(workspace_id, input_data, ground_truth, value, timestamp) == HTTPStatus.OK
    
    def test_post_performances_error(self):
        '''
        test post performances with wrong inputs
        the error will be expected
        '''
        workspace_id_wrong = 1
        input_data = {}
        ground_truth = 0
        value = 0
        timestamp = datetime.now()

        with patch("requests.post", side_effect=ConnectionError):
            with pytest.raises(ConnectionError):
                try:
                    monitor.monitor_performance(workspace_id_wrong, input_data, ground_truth, value, timestamp)
                except Exception as e:
                    assert isinstance(e, ConnectionError)
                    raise
    