#!/bin/bash

if [ -z "${DSP_API_ENDPOINT}" ]; then
    echo "[Error] DSP_API_ENDPOINT not set!"
    exit
fi
if [ -z "${DSP_WORKSPACE_ID}" ]; then
    echo "[Error] DSP_WORKSPACE_ID not set!"
    exit
fi
if [ -z "${DSP_WORFLOW_REPO}" ]; then
    echo "[Error] DSP_WORFLOW_REPO not set!"
    exit
fi

# Checkout git repo
git clone ${DSP_WORFLOW_REPO} workflow && cd workflow

# Install required dependencies
pip install --no-cache-dir -r requirements.txt

. /opt/bitnami/scripts/pytorch/entrypoint.sh