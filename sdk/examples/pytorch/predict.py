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
test_data_list = [ valid_data, valid_data, valid_data, valid_data, valid_data, valid_data, valid_data, valid_data, valid_data, invalid_data ]

# Call Prediction API endpoint
while True:
    data = random.choice(test_data_list)
    response = requests.post("http://a4b8187cc91da4b96b156f115f7e548f-470106354.cn-northwest-1.elb.amazonaws.com.cn/s/C3OJ6N52CNDCBZV97O0M5FS6H0/predict", json=data)
    print(response.content)
    time.sleep(20)