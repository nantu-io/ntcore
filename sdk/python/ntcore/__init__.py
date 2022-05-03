from ntcore.client import Client
from importlib import import_module

for module in ["ntcore.integrations.sklearn", "ntcore.integrations.tensorflow", "ntcore.integrations.torch"]:
    try:
        import_module(module)
    except Exception as e:
        pass