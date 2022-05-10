from ..ntcore.monitor.monitor import Monitor
from ..ntcore.exceptions.exceptions import NTCoreAPIException
from unittest import mock
from unittest.mock import patch
from requests.exceptions import ConnectionError
import unittest, json

monitor = Monitor()

class MonitorModuleTest(unittest.TestCase):
    '''
    Python Monitor Test Class
    '''
    @patch("requests.sessions.Session.request")
    def test_add_metric(self, mock_post):
        '''
        test add metrics method
        '''
        workspace_id = "workspace_id"
        name = "test_metrics"
        value = 0.0018
        mock_response_content = json.dumps(dict(workspaceId=workspace_id, name=name, value=value))
        mock_response = mock.Mock(
            status_code=201, 
            headers={'Content-Type': 'application/json'},
            content=mock_response_content)
        mock_post.return_value = mock_response
        res = monitor.add_metric(workspace_id, name, value)
        
        assert isinstance(res, dict)
        assert res["workspaceId"] == workspace_id
        assert res["name"] == name
        assert res["value"] == value

    @patch("requests.sessions.Session.request")
    def test_add_metric_error(self, mock_post):
        '''
        test post metrics with connection errors
        expects NTCoreAPIException
        '''
        mock_post.side_effect = ConnectionError("Connection error")
        try:
            monitor.add_metric("workspace_id", "test_metrics", 0.0018)
        except Exception as e:
            assert type(e) == NTCoreAPIException

    @patch("requests.sessions.Session.request")
    def test_upload_ground_truth(self, mock_post):
        '''
        test post evaluate_model method
        '''
        workspace_id = "workspace_id"
        input_data = json.dumps(dict(x=1))
        ground_truth = "ground_truth"
        
        mock_response_content = json.dumps(dict(workspaceId=workspace_id, input_data=input_data, ground_truth=ground_truth))
        mock_response = mock.Mock(
            status_code=201, 
            headers={'Content-Type': 'application/json'},
            content=mock_response_content)
        mock_post.return_value = mock_response
        res = monitor.evaluate_model(workspace_id, input_data, ground_truth)
        
        assert isinstance(res, dict)
        assert res["workspaceId"] == workspace_id
        assert res["input_data"] == input_data
        assert res["ground_truth"] == ground_truth

    @patch("requests.sessions.Session.request")
    def test_upload_ground_truth_error(self, mock_post):
        '''
        test post performances with wrong inputs
        the error will be expected
        '''
        mock_post.side_effect = ConnectionError("Connection error")
        try:
            monitor.evaluate_model("workspace_id", "{}", "truth")
        except Exception as e:
            assert type(e) == NTCoreAPIException