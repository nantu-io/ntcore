import json
import base64
import numpy as np
from onnx import numpy_helper
from google.protobuf.json_format import MessageToJson
import requests

# JSON format request
input_array = np.random.rand(1, 28 * 28).astype(np.float32)
tensor_proto = numpy_helper.from_array(input_array)
json_str = MessageToJson(tensor_proto, use_integers_for_enums=True)
data = json.loads(json_str)
payload = {}
payload["inputs"] = {"0": data}

json_request_headers = {'Content-Type': 'application/json', 'Accept': 'application/json'}
res = requests.post("http://localhost:8001/v1/models/default/versions/1:predict", headers=json_request_headers, data=json.dumps(payload))
raw_data = json.loads(res.text)
result = np.frombuffer(base64.b64decode(raw_data['outputs']['10']['rawData']), dtype=np.float32)
