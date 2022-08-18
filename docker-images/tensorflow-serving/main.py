import logging, tarfile, os
from pathlib import Path
from ntcore import Client
import proxy

def download_model():
    """
    Downloads model from ntcore server and place in the serving path.
    """
    # Fetches environment variables
    workspace_id = os.environ["DSP_WORKSPACE_ID"]
    api_endpoint = os.environ["DSP_API_ENDPOINT"]
    # Initialize ntcore client with given server url
    ntcore_server = api_endpoint if api_endpoint.startswith("http://") else "http://" + api_endpoint
    ntcore_client = Client(server=ntcore_server)

    try:
        extract_path = os.path.join("/models", workspace_id)
        model_path = os.path.join(extract_path, "model.tar.gz")
        Path(extract_path).mkdir(parents=True, exist_ok=True)
        # download model from ntcore
        ntcore_client.download_model(model_path, workspace_id)
        # Unzip the file to get the original saved model
        with tarfile.open(model_path, "r:gz") as tar:
            tar.extractall(extract_path)
        # Remove the binary model file
        os.remove(model_path)
        # tensorflow-serving requires version in number format
        os.rename(os.path.join(extract_path, 'model'), os.path.join(extract_path, "1"))

    except Exception as e:
        logging.error("Failed loading model from {0}: {1}".format(ntcore_server, e))


if __name__ == '__main__':
    # Downloads model from ntcore server and place in the serving path.
    download_model()
    with proxy.Proxy() as p:
    # Uncomment the line below and
    # implement your app your logic here
        proxy.sleep_loop()