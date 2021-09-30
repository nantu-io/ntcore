from client import Client
from sklearn import datasets
from sklearn.svm import SVC

client = Client('http://localhost:8180')

# Prepare the training dataset
iris = datasets.load_iris()
clf = SVC()

with client.start_run() as run:
    clf.fit(iris.data, iris.target_names[iris.target], run=run)