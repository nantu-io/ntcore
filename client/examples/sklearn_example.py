from ntcore import Client
from sklearn import datasets
from sklearn.svm import SVC

client = Client('http://localhost:8180')
client.enable_autolog('C8W60XEPH7DA3AAH3S41PJZ3OV')

# Prepare the training dataset
iris = datasets.load_iris()
clf = SVC()

with client.start_run() as run:
    clf.fit(iris.data, iris.target_names[iris.target], run=run)