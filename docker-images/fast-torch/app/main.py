import os, logging, tempfile
from fastapi import FastAPI
from models import Request
from ts.context import Context
from util import build_context, get_torch_handler
from ntcore import Client
from ntcore.monitor import Monitor
import time

# Config the enviroment
workspace_id = os.environ["DSP_WORKSPACE_ID"]
model_dir = tempfile.TemporaryDirectory()

# Initialize NTCore client.
client = Client(server="http://" + os.environ["DSP_API_ENDPOINT"])
monitor = Monitor(server="http://" + os.environ["DSP_MONITORING_ENDPOINT"])

# Download serialized model
client.download_model(os.path.join(model_dir.name, "model.pt"), workspace_id)

# Build inference context.
context: Context = build_context(workspace_id, model_dir.name, "model.pt")

# Initialize torch handler cache
torch_handlers = dict()

# Initialize Fast API server.
app = FastAPI()


@app.post('/predict')
async def predict(request: Request):
    """
    Returns predictions based on the input data and selected torch handler.
    """
    if (request.handler not in torch_handlers):
        torch_handler = get_torch_handler(request.handler)
        torch_handler.initialize(context)
        torch_handlers[request.handler] = torch_handler
    else:
        torch_handler = torch_handlers[request.handler]

    try:
        start_time = round(time.time() * 1000)
        prediction = torch_handler.handle(request.data, context)
        monitor.add_metric(workspace_id, "Latency", round(time.time() * 1000) - start_time)
        return prediction
    except Exception as e:
        monitor.add_metric(workspace_id, "Error", 1.0)
        logging.error('Unable to get prediction: {0}'.format(str(e)))
        return {"error": str(e)}


@app.get("/health")
async def healthcheck():
    """
    Returns if the service is healthy
    """
    return {"status": "healthy"}