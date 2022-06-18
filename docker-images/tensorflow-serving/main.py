from pathlib import Path
import logging
import tarfile
import os
from ntcore import Client

MODEL_BASEPATH = "./models"
MODEL_FILENAME = "model.tar.gz"
url = "http://" + os.environ["DSP_API_ENDPOINT"]
client = Client(server="http://" + os.environ["DSP_API_ENDPOINT"])

try:
    extract_path = os.path.join(MODEL_BASEPATH, os.environ["DSP_WORKSPACE_ID"])
    model_path = os.path.join(extract_path, MODEL_FILENAME)
    Path(extract_path).mkdir(parents=True, exist_ok=True)
    # download model from ntcore
    client.download_model(model_path, os.environ["DSP_WORKSPACE_ID"])
    # Unzip the file to get the original saved model
    with tarfile.open(model_path, "r:gz") as tar:
        tar.extractall(extract_path)
    # Remove the binary model file
    os.remove(model_path)
    os.rename(os.path.join(extract_path, 'model'), os.path.join(extract_path, os.environ["DSP_MODEL_VERSION"]))

except Exception as e:
    logging.error("Failed loading model from {0}: {1}".format(url, e)) 
    err_message = "Error: " + str(e)