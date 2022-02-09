# NTCore: Make AI/ML Model Lifecycle Management Easy

![workflows-intro](https://user-images.githubusercontent.com/42594415/146384196-7ff6edcb-b30d-4daf-b878-822a5ddcae73.jpg)

![Docker Image Version (latest by date)](https://img.shields.io/docker/v/ntcore/webserver)
![Docker Pulls](https://img.shields.io/docker/pulls/ntcore/webserver)
![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)
![PyPI](https://img.shields.io/pypi/v/ntcore)
![GitHub last commit](https://img.shields.io/github/last-commit/nantu-io/ntcore)

English | [简体中文](https://github.com/nantutech/ntcore/blob/main/README-zh-CN.md)

----
## Overview

NTCore helps data scientists and machine learning engineers easily version, deploy and monitor AI/ML models. 

* Auto-recording models from various ML frameworks, e.g, sklearn, tensorflow and keras etc., with metadata.
* One-click deployment with Docker, Kubernetes and cloud providers, e.g, AWS, Azure, Alicloud etc.
* Clean dashboards to monitor and report ML model performance metrics.

## Features
* Easy-to-integrate python clients that automatically versions models from multiple AI/ML frameworks including sklearn, tensorflow and keras etc.
* Model auditability and reproducibility through metadata from training, e.g., recall and precision.
* Out of the box RESTful endpoints that're callable through curl, Postman and HTTP clients.
* One-click deployment in production for models using Docker, Kubernetes and cloud providers, e.g, Amazon EKS, Microsoft AKS etc.
* Easy-to-scale and highly available prediction services with ML models to support state-of-art architectures of web and mobile applications. 
* Serving multiple endpoints with one endpoint per model.
* Model performance monitoring with integration to Prometheus (roadmap).
* Clean UI dashboards to manage ML model versions, deployments and performance metrics (roadmap).
* High-level APIs to automate ML workflows with integration to workflow managers, e.g, Apache Airflow.

Join our community on [Slack](https://app.slack.com/client/T02DN2XTE2J/C02R163F1K4).

----
## What’s In This Document
- [Quick Start](#quickstart)
- [Documentation](#documentation)
- [Why NTCore](#why-ntcore)
- [Community](#community)
- [License](#license)

## Quickstart
0. Install docker engine with [docker compose](https://docs.docker.com/compose/install/).
1. Clone this repository and start ntcore via docker compose
    ``` 
    docker-compose -f docker-compose.yml up
    ```
2. Install the ntcore client via
    ```
    pip install ntcore
    ```
3. Navigate to [http://localhost:8000/dsp/console/workspaces](http://localhost:8000/dsp/console/workspaces) and create your first workspace.
4. Version an ML model. More examples can be found [here](https://github.com/nantu-io/ntcore/tree/promotion/client/examples).
    ```python
    from sklearn import datasets
    # Config the ntcore client
    from ntcore import client
    client.set_endpoint('http://localhost:8000')
    client.autolog('{workspace_id}')

    # Prepare the training dataset
    from sklearn import datasets
    iris = datasets.load_iris()

    # Init the model
    from sklearn.ensemble import RandomForestClassifier
    clf = RandomForestClassifier(max_depth=2, random_state=0)

    # Start an experiment run
    with client.start_run():
        clf.fit(iris.data, iris.target_names[iris.target])
    ```
5. View the model versions and register one for pre-production deployment.
    <kbd>
        <img width="1674" alt="Screen Shot 2021-12-20 at 10 08 08 AM" src="https://user-images.githubusercontent.com/42594415/146832457-addbbc54-c18a-4024-8cea-ca935c67ce5e.png">
    </kbd>
<br /> 

6. Deploy your registered model version and invoke the RESTful endpoint after deployment succeeds.
    ```bash
    curl -H "Content-Type: application/json" -X POST --data '{"data": [[5.1,3.5,1.4,0.2]]}' http://localhost:8000/s/{workspace_id}/predict
    ```

## Documentation
NTCore documentation: https://nantu-io.github.io/ntcore-doc.

- [Quickstart](https://nantu-io.github.io/ntcore-doc/#/quick_start)
- [Production](https://nantu-io.github.io/ntcore-doc/#/production)
- [Examples](https://github.com/nantu-io/ntcore/tree/promotion/client/examples)

## Why NTCore
Imagine you are a data scientist optimizing AI/ML models for 10 different scenarios, each of which requires 100 iterations. How can you retain inputs/outputs of these 1000 experiments, compare them to find the best models and reproduce them? I hear you, it's not easy. But that's not the end of your nightmare. If you want to deploy the "best" models as prediction endpoints, you have to refactor your codes to create APIs before DevOps team can deploy. This process usually takes days. More importantly, the pain becomes worse when the processes are repeated hourly, daily or even monthly.

NTCore is a platform built to relieve the pain. It provides the UI tools as well as the APIs to help data scientists continuously and seamlessly ship their trained models to production environments with minimal interactions with DevOps teams. It also provides the monitoring functionality so that data scientists can quickly access the latest performance metrics of their models.

## Community
For Getting Started guides, tutorials, and API reference check out our docs.

To report a bug, file a documentation issue, or submit a feature request, please open a GitHub issue.

## License
NTCore is licensed under [Apache 2.0](https://github.com/nantu-io/ntcore/blob/main/LICENSE).
