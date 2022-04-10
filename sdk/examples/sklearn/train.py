# Load iris dataset.
from sklearn import datasets
iris = datasets.load_iris()

# Init the model
from sklearn.ensemble import RandomForestClassifier
clf = RandomForestClassifier(max_depth=2, random_state=0)

# Start an experiment run
from ntcore import Client
client = Client()
with client.start_run('CF13XRW1CI52FPS7GTBQIC1NG8') as exper:
    clf.fit(iris.data, iris.target_names[iris.target], experiment=exper)