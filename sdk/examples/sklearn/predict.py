################################################################
## curl \
#   -H "Content-Type: application/json" \
#   -X POST --data '{"data": [[5.1,3.5,1.4,0.2]]}' \
#   http://localhost:8000/s/CEPYLVMD0GMSFEMMYKP8QPA9DT/predict
################################################################
import requests

data = {"data": [[5.1,3.5,1.4,0.2]]}
response = requests.post("http://localhost:8000/s/CEPYLVMD0GMSFEMMYKP8QPA9DT/predict", json=data)
print(response.content)