gao# NTCore：让AI/ML模型周期管理变得简单

![workflows-intro](https://user-images.githubusercontent.com/42594415/146384196-7ff6edcb-b30d-4daf-b878-822a5ddcae73.jpg)


![Docker Image Version (latest by date)](https://img.shields.io/docker/v/ntcore/webserver)
![Docker Pulls](https://img.shields.io/docker/pulls/ntcore/webserver)
![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)
![PyPI](https://img.shields.io/pypi/v/ntcore)
![GitHub last commit](https://img.shields.io/github/last-commit/nantu-io/ntcore) 

----

## 概述

NTCore 可帮助数据科学家和机器学习工程师轻松地对 AI/ML 模型进行版本控制、部署和监控。

* 自动记录各种机器学习框架的模型实验元数据，例如 sklearn、tensorflow 和 keras 等。
* 与 Docker、Kubernetes 和云提供商（例如 AWS、Azure、Alicloud 等）一键部署。
* 仪表盘实时监控和报告模型各项参数与性能。


## 特征
* 易于集成的 Python 客户端，可自动对来自多个 AI/ML 框架（包括 sklearn、tensorflow 和 keras 等）的模型进行版本控制。
* 通过来自训练的元数据（例如召回率和精确度）对可审计性和再现性进行建模。
* 可通过 curl、Postman 和 HTTP 客户端调用的开箱即用 RESTful 端点。
* 使用 Docker、Kubernetes 和云提供商（例如 Amazon EKS、Microsoft AKS 等）的模型在生产中一键部署。
* 具有 ML 模型的易于扩展且高度可用的预测服务，以支持最先进的 Web 和移动应用程序架构。
* 每个模型一个端点，为多个端点提供服务。
* 与 Prometheus 集成的模型性能监控（持续开发中）。
* UI仪表板以管理 ML 模型版本、部署和性能指标（持续开发中）。
* API，用于通过与工作流管理器（例如 Apache Airflow）的集成来自动化 ML 工作流。


加入我们的[Slack](https://app.slack.com/client/T02DN2XTE2J/C02R163F1K4)社区.

[English](https://github.com/nantu-io/ntcore/blob/main/README.md) | 简体中文

----
## 目录
- [快速开始](#quickstart)
- [文档](#documentation)
- [为什么选择NTCore](#why-ntcore)
- [社区](#community)
- [执照](#license)

## 快速开始
0. 使用 [docker compose](https://docs.docker.com/compose/install/)安装 docker 引擎。
1. 克隆这个存储库并通过 docker compose 启动 ntcore
    ``` 
    docker-compose -f docker-compose.yml up
    ```
2. 安装ntcore客户端
    ```
    pip install ntcore
    ```
3. 到[http://localhost:8000/dsp/console/workspaces](http://localhost:8000/dsp/console/workspaces) 并创建您的第一个工作区。  
4. 模型版本控制。可以从[这里](https://github.com/nantu-io/ntcore/tree/promotion/client/examples)了解更多。
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
5. 查看模型版本并注册一个用于预生产部署。 
    <kbd>
        <img width="1674" alt="Screen Shot 2021-12-20 at 10 08 08 AM" src="https://user-images.githubusercontent.com/42594415/146832457-addbbc54-c18a-4024-8cea-ca935c67ce5e.png">
    </kbd>
<br /> 

6. 部署您注册的模型版本并在部署成功后调用 RESTful 端点。
    ```bash
    curl -H "Content-Type: application/json" -X POST --data '{"data": [[5.1,3.5,1.4,0.2]]}' http://localhost:8000/s/{workspace_id}/predict
    ```

## 文档
NTCore 文档: https://nantu-io.github.io/ntcore-doc.

- [快速开始](https://nantu-io.github.io/ntcore-doc/#/quick_start)
- [模型部署](https://nantu-io.github.io/ntcore-doc/#/production)
- [例子](https://github.com/nantu-io/ntcore/tree/promotion/client/examples)

## 为什么选择NTCore
假设您是一名数据科学家，为 10 个不同的场景优化 AI/ML 模型，每个场景都需要 100 次迭代。您如何保留这 1000 个实验的输入/输出，比较它们以找到最佳模型并重现它们？这并不容易。但这并不是你噩梦的结束。如果要将“最佳”模型部署为预测端点，则必须重构代码以创建 API，然后 DevOps 团队才能部署。这个过程通常需要几天时间。更重要的是，当这个过程每小时、每天甚至每月重复一次时，疼痛会变得更糟。

NTCore 是一个旨在减轻痛苦的平台。它提供了 UI 工具和 API，以帮助数据科学家以最少的与 DevOps 团队的互动，将他们训练有素的模型持续无缝地传送到生产环境。它还提供监控功能，以便数据科学家可以快速访问其模型的最新性能指标。


## 社区
有关入门指南、教程和 API 参考，请查看我们的文档。

要报告错误、提交文档问题或提交功能请求，请打开 GitHub 问题。


## 执照
NTCore在[Apache 2.0](https://github.com/nantu-io/ntcore/blob/main/LICENSE)下获得许可.
