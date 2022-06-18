from torchvision import datasets, transforms
import requests
import torch
import random, time

transform=transforms.Compose([transforms.ToTensor(), transforms.Normalize((0.1307,), (0.3081,))])
dataset = datasets.MNIST('../data', train=False, download=True, transform=transform)
data_loader = torch.utils.data.DataLoader(dataset)
test_data = [ data for data, _ in data_loader ]
valid_data = {"data": test_data[0].tolist()}
invalid_data = {"data": []}
test_data_list = [ valid_data, invalid_data ]

# Replace with your own server url
server_url = "localhost:8000"
# Replace with a real workspace_id
workspace_id = "C123"
while True:
    data = random.choice(test_data_list)
    # Call Prediction API endpoint with tensors
    response = requests.post("http://{server_url}/s/{workspace_id}/predict".format(server_url=server_url, workspace_id=workspace_id), json=data)
    print(response.content)
    time.sleep(20)