# NTCore：机器学习开发与部署管理平台

![Docker Pulls](https://img.shields.io/docker/pulls/ntcore/webserver)

English|[简体中文](https://github.com/nantutech/ntcore/blob/main/README-zh-CN.md)
----

NTCore 是一个用于管理机器学习模型开发生命周期的开源平台。它有助于本地开发环境设置、模型版本控制和元数据跟踪，以及生产中的模型部署和监控。
使用 NTCore，用户可以：

•	一分钟内设置开发环境，包括 Jupyter Notebook 和 Python IDE。
•	对模型实验进行版本控制，并使它们可审计和可重现。
•	一键将模型部署为 RESTful API。
•	使用可管理的仪表板监控模型性能（仅在企业版中可用）。

如果需要NTCore的企业版，请发送电子邮件至info@nantutech.com。 

----

## This document includes

- [十分钟内部署您的第一个模型](#deploy-your-first-model-in-10-minutes)
- [用户文档](#documentation)
- [社区](#community)
- [执照](#license)

----

## 十分钟内部署您的第一个模型

0. 按照此[说明](https://docs.docker.com/get-started/#download-and-install-docker) 下载并安装Docker，并确保其正确安装。
```
docker-compose --version
```
1. 复制这个仓库
``` 
git clone https://github.com/nantutech/ntcore.git
```
2. 在ntcore路径，启动ntcore服务器
```
docker-compose up
```
3. 在浏览器中打开[http://localhost:8000/dsp/console/workspaces](http://localhost:8000/dsp/console/workspaces)
4. 创建您的第一个workspace. `Workspace` 可帮助您组织机器学习项目的代码、数据、模型和部署。  
5. 根据您的偏好启动开发实例，例如 Jupyter Notebook。
6. 下面是一个基于sklearn对鸢尾花类型进行分类的例子。执行代码以记录您训练过的模型并查看`Experiment`部分中的元数据。
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
7. 将经过训练的模型部署为 RESTful API。在`Experiment`部分，选择版本并单击`Deploy`按钮以创建您的第一个预测endpoint。
8. 调用您的 RESTful API。例如，通过对鸢尾花类型进行分类。
```
curl -H "Content-Type: application/json" -X POST --data '{"data": [[5.1,3.5,1.4,0.2]]}' http://localhost:8000/s/{workspace_id}/predict
```
这里的`workspace_id`是NTCore根据你的工作区名称分配的。您将看到 API 调用的结果，如下所示。  
```
{"prediction":["setosa"]}
```
祝贺您首次部署模型！

---

## 文档
请查看我们的[用户文档](https://nantutech.github.io/ntcore-doc/#/zh-cn/)

----

## 社区

有关入门指南、教程和 API 参考，请查看我们的文档。

要报告错误、提交文档问题或提交功能请求，请打开 GitHub 问题。

----

## 执照

NTCore 在 Apache 2.0 下获得许可。

----
