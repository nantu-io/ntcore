FROM tiangolo/uvicorn-gunicorn:python3.8-alpine3.10

LABEL maintainer="Jinxiong Tan <jinxiong.tan@nantutech.com>"

COPY requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

COPY ./app /app