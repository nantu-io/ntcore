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

# Step 3: Register an experiment.
client.register_experiment(workspace_id, 1)

# Step 4: Deploy the registered model.
client.deploy_model(workspace_id, 1)

# Step 5: Unregister experiments.
client.unregister_experiment(workspace_id)

# Step 6: Delete workspace.
client.delete_workspace(workspace_id)