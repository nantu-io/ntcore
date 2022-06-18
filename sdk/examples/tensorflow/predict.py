import requests, time

# Replace with your own server url
server_url = "localhost:8000"
# Replace with a real workspace_id
workspace_id = "C123"
while True:
    # Provides tensors with size aligned with the trainig data
    data = { "instances": [1] * 784 }
    # Call Prediction API endpoint with tensors
    response = requests.post("http://{server_url}/s/{workspace_id}/predict".format(server_url=server_url, workspace_id=workspace_id), json=data)
    print(response.content)
    time.sleep(20)