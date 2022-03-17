import unittest
from ntcore.client import Client
from unittest.mock import patch
from http import HTTPStatus
import pytest
import json

NTCORE_DEFAULT_BASE_ENDPOINT = 'http://localhost:8000'
workspace_id = "CAHCEWM6X6PN2HADX7TR138XB8" # your own workspace id
version = 1 # your own experiment version
client = Client()
framework = "sklearn"
fake_registry_data_path = "./ntcore/tests/static_data/registry.json"

def fake_registry_data() -> dict:
    """
    fixture that returns a fake registry static data
    """
    with open(fake_registry_data_path) as f:
        return json.load(f)

# def test_log_experiment(mocker):
#     """
#     mock test function for the log experiment method
#     """
#     mock_response = mocker.patch("requests.post")
#     mock_response.return_value = HTTPStatus.OK
#     mock_experiment = Experiment(client)
#     assert client.log_experiment(mock_experiment) == HTTPStatus.OK\
#             and isinstance(client.log_experiment(mock_experiment),int)
class PythonClientTest(unittest.TestCase):
    """
    Test case for python client
    
    """
    
    @patch("requests.post")
    def test_register_experiment(self, mock_response):
        """
        mock test function for the register experiment method
        """
        mock_response.return_value = HTTPStatus.OK
    
        assert client.register_experiment(workspace_id, version) == HTTPStatus.OK and \
            isinstance(client.register_experiment(workspace_id,version),int)\
    
   
    def test_register_experiment_error(self):
        """
        mock test register experiment fail
        """
        with patch("requests.post", side_effect=ConnectionError):
            with pytest.raises(ConnectionError):
                try:
                    client.register_experiment("demo",0)
                except Exception as e:
                    assert isinstance(e, ConnectionError)
                    raise # so that pytest can see the error ref: https://stackoverflow.com/questions/57080127/pytest-raises-failed-did-not-raise-with-try-except
    
    @patch("requests.get")
    def test_get_registry(self, mock_response):
        """
        mock test get registry method
        """
        mock_response.return_value = HTTPStatus.OK

        assert client.get_registry(workspace_id) == HTTPStatus.OK and \
                isinstance(client.get_registry(workspace_id), int)
    
    @patch("requests.get")
    def test_get_registry_correct_attributes(self, mocker):
        """
        mock test the response returned from get registry has correct attributes 
        """
        mock_return_value = fake_registry_data()
        mocker.return_value=mock_return_value
        
        mocker.status_code = HTTPStatus.OK

        actual_response = client.get_registry(workspace_id)
        
        assert "version" in actual_response.keys() and actual_response["version"] == str(float(version))
        assert "framework" in actual_response.keys() and actual_response["framework"] == framework
        
    def test_get_registry_error(self):
        """
        mock test get registry fail
        """
        with patch("requests.get", side_effect=ConnectionError):
            with pytest.raises(ConnectionError):
                try:
                    client.get_registry("demo")
                except Exception as e:
                    assert isinstance(e, ConnectionError)
                    raise
    
    @patch("requests.delete")
    def test_unregister_experiment(self, mock_response):
        """
        mock test unregister experiment
        """
        mock_response.return_value = HTTPStatus.OK
        
        assert client.unregister_experiment(workspace_id) == HTTPStatus.OK and \
                isinstance(client.unregister_experiment(workspace_id), int)

    def test_unregister_experiment_error(self):
        """
        mock test unregister experiment fail
        """
        with patch("requests.delete", side_effect=ConnectionError):
            with pytest.raises(ConnectionError):
                try:
                    client.unregister_experiment("demo")
                except Exception as e:
                    assert isinstance(e, ConnectionError)
                    raise
    
    @patch("requests.delete")
    def test_delete_experiment(self, mock_response):
        """
        mock test delete experiment method
        """
        mock_response.return_value = HTTPStatus.OK
        
        assert client.delete_experiment(workspace_id, version) == HTTPStatus.OK and \
                isinstance(client.delete_experiment(workspace_id, version), int)

    @patch("requests.post")
    def test_deploy_model(self, mock_response):
        """
        mock test deploy model method
        """
        mock_response.return_value = HTTPStatus.OK

        assert client.deploy_model(workspace_id, version) == mock_response.return_value and \
                isinstance(client.deploy_model(workspace_id, version), int)

    def test_deploy_model_error(self):
        """
        mock test deploy model fail
        """
        with patch("requests.post", side_effect=ConnectionError):
            with pytest.raises(ConnectionError):
                try:
                    client.deploy_model("demo",0)
                except Exception as e:
                    assert isinstance(e, ConnectionError)
                    raise
    
    @patch("requests.post")
    def test_download_model(self, mock_response):
        """
        mock test download model
        """
        mock_response.return_value = HTTPStatus.OK

        assert client.download_model(workspace_id, version) == mock_response.return_value and \
                isinstance(client.download_model(workspace_id, version), int)

    # ## this command won't stop
    def test_download_model_error(self):
        """
        mock test download model error
        """
        with patch("requests.post", side_effect=ConnectionError):
            with pytest.raises(ConnectionError):
                try:
                    client.download_model("demo", "failed")
                except Exception as e:
                    assert isinstance(e, ConnectionError)
                    raise

    @patch("requests.post")
    def test_create_workspace(self, mock_response):
        """
        mock test create workspace
        """
        mock_response.return_value = HTTPStatus.OK

        assert client.create_workspace("API", "test") == HTTPStatus.OK and \
                isinstance(client.create_workspace("API", "test"), int)

    def test_create_workspace_error(self):
        """
        mock test create workspace fail
        """
        with patch("requests.post", side_effect=ConnectionError):
            with pytest.raises(ConnectionError):
                try:
                    client.create_workspace("API", "test")
                except Exception as e:
                    isinstance(e, ConnectionError)
                    raise

    @patch("requests.get")
    def test_get_workspace(self, mock_response):
        """
        mock test get workspace
        """
        mock_response.return_value = HTTPStatus.OK

        assert client.get_workspace(workspace_id) == HTTPStatus.OK and \
                isinstance(client.get_workspace(workspace_id), int)

    def test_get_workspace_error(self):
        """
        mock test get workspace fail
        """
        with patch("requests.get", side_effect=ConnectionError):
            with pytest.raises(ConnectionError):
                try:
                    client.get_workspace("demo")
                except Exception as e:
                    assert isinstance(e, ConnectionError)
                    raise

    @patch("requests.delete")
    def test_delete_workspace(self, mock_response):
        """
        mock test delete workspace method
        """
        mock_response.return_value = HTTPStatus.OK

        assert client.delete_workspace(workspace_id) == HTTPStatus.OK and \
                isinstance(client.delete_workspace(workspace_id), int)

    def test_delete_workspace_error(self):
        """
        mock test delete workspace fail
        """
        with patch("requests.delete", side_effect=ConnectionError):
            with pytest.raises(ConnectionError):
                try:
                    client.delete_workspace("demo")
                except Exception as e:
                    assert isinstance(e, ConnectionError)
                    raise
    
    @patch("requests.get")
    def test_list_workspaces(self, mock_response):
        """
        mock test list workspaces method
        """
        mock_response.return_value = HTTPStatus.OK

        assert client.list_workspaces() == HTTPStatus.OK and \
                isinstance(client.list_workspaces(), int)

    def test_list_workspace_error(self):
        """
        mock test list workspace fail
        """
        with patch("requests.get", side_effect=ConnectionError):
            with pytest.raises(ConnectionError):
                try:
                    client.list_workspaces()
                except Exception as e:
                    isinstance(e, ConnectionError)
                    raise
    
    @patch("requests.get")
    def test_list_active_deployments(self, mock_response):
        """
        mock test list active deployments
        """
        mock_response.return_value = HTTPStatus.OK

        assert client.list_active_deployments() == HTTPStatus.OK and \
                isinstance(client.list_active_deployments(), int)

    def test_list_active_deployments_error(self):
        """
        mock test list active deployment error
        """
        with patch("requests.get", side_effect=ConnectionError):
            with pytest.raises(ConnectionError):
                try:
                    client.list_active_deployments()
                except Exception as e:
                    assert isinstance(e, ConnectionError)
                    raise
