import logging
from fastapi import FastAPI
from models import Request
from ts.context import Context
from util import build_context, get_torch_handler

app = FastAPI()

@app.post('/predict/')
async def predict(request: Request):
    """
    Returns predictions based on the input data and selected torch handler.
    """
    torch_handler = get_torch_handler(request.handler)
    context: Context = build_context()
    try:
        torch_handler.initialize(context)
        return torch_handler.handle(request.data, context)
    except Exception as e:
        logging.error(e)
        return {"error": str(e)}

@app.get("/health")
async def healthcheck():
    """
    Returns if the service is healthy
    """
    return {"status": "healthy"}