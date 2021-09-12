# Config the ntcore client
from ntcore import client
client.set_endpoint('http://localhost:8000')
client.autolog('C8W60XEPH7DA3AAH3S41PJZ3OV')

# Prepare the training dataset
from sklearn import datasets
iris = datasets.load_iris()

# Init the model
from sklearn.ensemble import RandomForestClassifier
clf = RandomForestClassifier(max_depth=2, random_state=0)

# Start an experiment run
with client.start_run():
    clf.fit(iris.data, iris.target_names[iris.target])