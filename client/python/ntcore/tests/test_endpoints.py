from ntcore.client import Experiment,Client
import requests
import base64
import json
import mlflow
import pytest

NTCORE_DEFAULT_BASE_ENDPOINT = 'http://localhost:8000'

class TestClient(object):
    """
    Tests for the client
    """
    experiment = None
    def __init__(self, endpoint=None, workspace_id=None) -> None:
        """
        base endpoint of NTCore server
        """
        super().__init__()
        self._endpoint = NTCORE_DEFAULT_BASE_ENDPOINT if endpoint is None else endpoint.strip("/")
        self._workspace_id = "CAHCEWM6X6PN2HADX7TR138XB8" if workspace_id is None else workspace_id
    
    def _get_experiment_endpoint(self):
        """
        Returns the NTCore endpoint for sending experiment data.
        """
        return '{base_endpoint}/dsp/api/v1/workspace/{workspace_id}/experiment'.format(
            base_endpoint=self._endpoint, workspace_id=self._workspace_id)

    def test_log_experiment(self,experiment):
        """
        test log experiment
        """
        assert self._workspace_id is not None
        
        payload = {
            "runtime": experiment.get_runtime(),
            "framework": experiment.get_framework(),
            "parameters": json.dumps(experiment.get_parameters()),
            "metrics": json.dumps(experiment.get_metrics()), 
            "model": base64.b64encode(experiment.get_model())
        }
        try:
            response = requests.post(self._get_experiment_endpoint(), data=payload)
            assert response.status_code == 201 or response.status_code == 200 and response.headers["Content-Type"].split(";")[0] == "application/json"
        except requests.exceptions.ConnectionError as e:
            raise RuntimeError('Experiment wasn\'t logged since ntcore wasn\'t available at {0}.'.format(self._endpoint))

    # def test_get_experiment_endpoint(self):
    #     """
    #     test for _get_experiment_endpoint method
    #     """
    #     response = self.client._get_experiment_endpoint()
    #     assert response == '{base_endpoint}/dsp/api/v1/workspace/{workspace_id}/experiment'.format(
    #         base_endpoint=self._endpoint, workspace_id=self._workspace_id)

    # def test_get_experiment(self):
    #     """
    #     test for get_experiment method
    #     """
    #     response = self.client.get_experiment()
        
    
    def test_register_experiment(self):
        """
        test for start_run method
        """
        test_payload = {"version": 1}
        try: 
            response = requests.post(f"{self._endpoint}/dsp/api/v1/workspace/{self._workspace_id}/registry",data=test_payload)
            assert response.status_code == 200 and response.headers["Content-Type"].split(";")[0] == "application/json"
        except requests.exceptions.ConnectionError as e:
            raise RuntimeError(f"Experiment wasn\'t logged since ntcore wasn\'t available at {self._endpoint}")

    def test_get_registry(self):
        """
        test for get_registry method
        """
        try:
            response = requests.get(f"{self._endpoint}/dsp/api/v1/workspace/{self._workspace_id}/registry")
            print(response.headers["Content-Type"])
            assert response.status_code == 200
        except requests.exceptions.ConnectionError as e:
            raise RuntimeError(f"Experiment wasn\'t logged since ntcore wasn\'t available at {self._endpoint}")
        
    def test_unregister_experiment(self):
        """
        test for unregister experiment
        """
        try:
            response = requests.delete(f"{self._endpoint}/dsp/api/v1/workspace/{self._workspace_id}/registry")
            assert response.status_code == 200
        except requests.exceptions.ConnectionError as e:
            raise RuntimeError(f"Experiment wasn\'t logged since ntcore wasn\'t available at {self._endpoint}")

    def test_deploy_model(self):
        """
        test deploy model
        """
        version = 1

        try:
            response = requests.post(f"{self._endpoint}/dsp/api/v1/workspace/{self._workspace_id}/model/{version}/deploy")
            assert response.status_code == 201
        except requests.exceptions.ConnectionError as e:
            raise RuntimeError(f"Experiment wasn\'t logged since ntcore wasn\'t available at {self._endpoint}")
        
    def test_download_model(self):
        """
        test download model
        """
        version = 1
        try:
            response = requests.get(f"{self._endpoint}/dsp/api/v1/workspace/{self._workspace_id}/model/{version}")
            assert response.status_code == 200
        except requests.exceptions.ConnectionError as e:
            raise RuntimeError(f"Experiment wasn\'t logged since ntcore wasn\'t available at {self._endpoint}")
    
    def test_create_workspace(self):
        """
        test create workspace
        """
        payload={"type":"API", "name":"test"}
        try:
            response = requests.post(f"{self._endpoint}/dsp/api/v1/workspace",data=payload)
            assert response.status_code == 201
        except requests.exceptions.ConnectionError as e:
            raise RuntimeError(f"Experiment wasn\'t logged since ntcore wasn\'t available at {self._endpoint}")
        
    def test_get_workspace(self):
        """
        test get_workspace
        """
        try:
            response = requests.get(f"{self._endpoint}/dsp/api/v1/workspace/{self._workspace_id}")
            assert response.status_code == 200 and response.headers["Content-Type"].split(";")[0] == "application/json"
        except requests.exceptions.ConnectionError as e:
            raise  RuntimeError(f"Experiment wasn\'t logged since ntcore wasn\'t available at {self._endpoint}")

    def test_delete_workspace(self):
        """
        test delete workspace
        """
        try:
            response = requests.delete(f"{self._endpoint}/dsp/api/v1/workspace/{self._workspace_id}")
            assert response.status_code == 201
        except requests.exceptions.ConnectionError as e:
            raise  RuntimeError(f"Experiment wasn\'t logged since ntcore wasn\'t available at {self._endpoint}")

    def test_list_workspace(self):
        """
        test list workspace
        """
        try:
            response = requests.get(f"{self._endpoint}/dsp/api/v1/workspaces")
            assert response.status_code == 200 and response.headers["Content-Type"].split(";")[0] == "application/json"
        except requests.exceptions.ConnectionError as e:
            raise  RuntimeError(f"Experiment wasn\'t logged since ntcore wasn\'t available at {self._endpoint}")

    def test_list_active_deployment(self):
        """
        test active deployments
        """
        try:
            response = requests.get(f"{self._endpoint}/dsp/api/v1/deployments/active")
            assert response.status_code == 200 and response.headers["Content-Type"].split(";")[0] == "application/json"
        except requests.exceptions.ConnectionError as e:
            raise  RuntimeError(f"Experiment wasn\'t logged since ntcore wasn\'t available at {self._endpoint}")
"""
below is the testing portion
"""


# def test_test_create_workspace():
#     """
#     test create workspace
#     """
#     test_client = TestClient()
#     test_client.test_create_workspace()



def test_test_register_experiment():
    """
    test register experiment
    """
    test_client = TestClient()
    test_client.test_register_experiment()

def test_test_get_registry():
    """
    test get registry
    """
    test_client = TestClient()
    test_client.test_get_registry()

def test_test_deploy_model():
    test_client = TestClient()
    test_client.test_deploy_model()

def test_test_download_model():
    test_client = TestClient()
    test_client.test_download_model()

def test_test_get_workspace():
    test_client = TestClient()
    test_client.test_get_workspace()

def test_test_list_workspace():
    test_client = TestClient()
    test_client.test_list_workspace()

def test_test_list_active_deployment():
    test_client = TestClient()
    test_client.test_list_active_deployment()

def test_test_unregister_experiment():
    test_client = TestClient()
    test_client.test_unregister_experiment()


# def test_test_delete_workspace():
#     test_client = TestClient()
#     test_client.test_delete_workspace()