import os, logging, requests
from fastapi import FastAPI
from models import Request
from ts.context import Context
from util import build_context, get_torch_handler
import tempfile

template = "http://{endpoint}/dsp/api/v1/workspace/{workspaceId}/model/{version}"
model_file = "model.pt"
try:
    endpoint=os.environ["DSP_API_ENDPOINT"]
    workspace_id=os.environ["DSP_WORKSPACE_ID"]
    version=os.environ["DSP_MODEL_VERSION"]
    url = template.format(endpoint=endpoint, workspaceId=workspace_id, version=version)
    # Read serialized model from NTCore server.
    logging.info('Downloading model from {0}'.format(url))
    serialized_model = requests.get(url).content
    
    # Write serialized model to a binary file.
    model_dir = tempfile.TemporaryDirectory()
    f = open(os.path.join(model_dir.name, model_file), 'wb')
    f.write(serialized_model)
    f.close()
except Exception as e:
    logging.error("Unable to load model: {0}".format(str(e))) 

# Initialize Fast API server.
app = FastAPI()

@app.post('/predict')
async def predict(request: Request):
    """
    Returns predictions based on the input data and selected torch handler.
    """
    torch_handler = get_torch_handler(request.handler)
    context: Context = build_context(workspace_id, model_dir.name, model_file)
    try:
        torch_handler.initialize(context)
        return torch_handler.handle(request.data, context)
    except Exception as e:
        logging.error('Unable to get prediction: {0}'.format(str(e)))
        return {"error": str(e)}

@app.get("/health")
async def healthcheck():
    """
    Returns if the service is healthy
    """
    return {"status": "healthy"}