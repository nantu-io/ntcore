from ntcore import Client

client = Client()

# Step 1: Create a workspace.
workspace = client.create_workspace('workflow')
workspace_id = workspace['id']

# Step 2: Produce an experiment record.
from sklearn import datasets
iris = datasets.load_iris()
from sklearn.ensemble import RandomForestClassifier
clf = RandomForestClassifier(max_depth=2, random_state=0)

from ntcore import Client
client = Client()
with client.start_run(workspace_id) as exper:
    clf.fit(iris.data, iris.target_names[iris.target], experiment=exper)

# Step 3: Download model to audit.
client.download_model('model_audit.pkl', workspace_id, 1)