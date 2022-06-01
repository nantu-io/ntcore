import os, tempfile
from fastapi import FastAPI
from models import Request
from ts.context import Context
from util import build_context, get_torch_handler
from ntcore import Client
from ntcore.monitor import Monitor, SystemMetricsPublisherDaemon
import time

# Config the enviroment
workspace_id = os.environ["DSP_WORKSPACE_ID"]
model_dir = tempfile.TemporaryDirectory()

# Initialize NTCore client.
client = Client(server="http://" + os.environ["DSP_API_ENDPOINT"])
monitor = Monitor(workspace_id, server="http://" + os.environ["DSP_MONITORING_ENDPOINT"])

# Download serialized model
client.download_model(os.path.join(model_dir.name, "model.pt"), workspace_id)

# Build inference context.
context: Context = build_context(workspace_id, model_dir.name, "model.pt")

# Initialize torch handler cache
torch_handlers = dict()

# Initialize Fast API server.
app = FastAPI()

# Start the system metrics daemon
system_metrics_daemon = SystemMetricsPublisherDaemon(monitor, workspace_id)
system_metrics_daemon.start()


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

    start_time = round(time.time() * 1000)
    try:
        prediction = torch_handler.handle(request.data, context)
        monitor.log("[INFO] Successfully generated prediction.")
        monitor.add_metric("Success", 1.0)
    except Exception as e:
        monitor.log("[Error] Unable to generate prediction: {0}".format(str(e)))
        monitor.add_metric("Error", 1.0)
    finally:
        monitor.add_metric("Latency", round(time.time() * 1000) - start_time)

    return prediction

@app.get("/health")
async def healthcheck():
    """
    Returns if the service is healthy
    """
    return {"status": "healthy"}