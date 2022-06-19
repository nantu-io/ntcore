from pathlib import Path
from ntcore import Client
import logging, tarfile, os

workspace_id = os.environ["DSP_WORKSPACE_ID"]
endpoint = os.environ["DSP_API_ENDPOINT"]
url = endpoint if endpoint.startswith("http://") else "http://" + endpoint
# Initialize ntcore client with given server url
client = Client(server=url)
# tensorflow-serving requires version in number format
model_version = "1"

try:
    extract_path = os.path.join("/models", workspace_id)
    model_path = os.path.join(extract_path, "model.tar.gz")
    Path(extract_path).mkdir(parents=True, exist_ok=True)
    # download model from ntcore
    client.download_model(model_path, workspace_id)
    # Unzip the file to get the original saved model
    with tarfile.open(model_path, "r:gz") as tar:
        tar.extractall(extract_path)
    # Remove the binary model file
    os.remove(model_path)
    os.rename(os.path.join(extract_path, 'model'), os.path.join(extract_path, model_version))

except Exception as e:
    logging.error("Failed loading model from {0}: {1}".format(url, e)) 
    err_message = "Error: " + str(e)