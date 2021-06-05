# NTCore: Machine Learning Development Lifecycle Management Platform.

![Docker Pulls](https://img.shields.io/docker/pulls/ntcore/webserver)

----

NTCore is an open-source platform to manage machine learning model development lifecycles. It facilates local development environment setup, model versioning and metadata tracking, as well as model deployment and monitoring in production.

With NTCore you can:
* Setup your development environments including Jupyter Notebook and Python IDE in 1 minute.
* Version your trained models with metadata during experiments and make them auditable and reproducible.
* Deploy your models as RESTful APIs with just one click.
* Monitor your model performance with manageable dashboards (This is only available in enterprise version).

If you are looking for a enterprise version of NTCore, please send an email to info@nantutech.com.

----

## This document includes

- [Deploy your first model in 10 minutes](#deploy-your-first-model-in-10-minutes)
- [Documentation](#documentation)
- [Community](#community)
- [License](#license)

----

## Deploy your first model in 10 minutes

0. Follow this [instruction](https://docs.docker.com/get-started/#download-and-install-docker) to download and install the Docker engine. Make sure docker compose is installed properly via 
```
docker-compose --version
```
1. Clone this repository
``` 
git clone https://github.com/nantutech/ntcore.git
```
2. <ins>Inside</ins> the cloned repository, start the ntcore server
```
docker-compose up
```
3. Open this url [http://localhost:8000/dsp/console/workspaces](http://localhost:8000/dsp/console/workspaces) in your browser.
4. Create your first workspace. `Workspace` helps you organize your codes, data, models and deployments for a Machine Learning project.
5. Launch a development instance based on your preference, e.g., Jupyter Notebook.
6. Below is an example based on `sklearn` to classify iris flower types. Execute the code to log the models you've trained and check out the metadata in the `Experiment` section.
```
from sklearn import datasets
from sklearn.svm import SVC
import ntcore

# Enable autologging
ntcore.sklearn.autolog()

# Prepare the training dataset
iris = datasets.load_iris()
clf = SVC()

with ntcore.start_run() as run:
    clf.fit(iris.data, iris.target_names[iris.target])
```
7. Deploy your trained model as a RESTful API. In the `Experiment` section, select the version and click the `Deploy` button to create your first prediction endpoint.
8. Call your RESTful API. For instance, classifying the iris flower type via
```
curl -H "Content-Type: application/json" -X POST --data '{"data": [[5.1,3.5,1.4,0.2]]}' http://localhost:8000/s/{workspace_id}/predict
```
The `workspace_id` here is assigned by NTCore based on your workspace name. You'll see the result from the API call as below.
```
{"prediction":["setosa"]}
```
Congratulation on your first model deployment!


---

## Documentation
Please check out our [User Guide](https://nantutech.github.io/ntcore-doc/#/zh-cn/)

----

## Community

For Getting Started guides, Tutorials, and API reference check out our docs.

To report a bug, file a documentation issue, or submit a feature request, please open a GitHub issue.


----

## License

NTCore is licensed under Apache 2.0.

----
