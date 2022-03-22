from torchvision import datasets, transforms
import requests
import torch

transform=transforms.Compose([transforms.ToTensor(), transforms.Normalize((0.1307,), (0.3081,))])
dataset = datasets.MNIST('../data', train=False, download=True, transform=transform)
data_loader = torch.utils.data.DataLoader(dataset)
test_data = [ data for data, _ in data_loader ]
data = {"data": test_data[0].tolist()}

# Call Prediction API endpoint
response = requests.post("http://localhost:8000/predict", json=data)

print(response.content)