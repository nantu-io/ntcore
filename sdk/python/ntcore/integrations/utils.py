import platform

def get_runtime_version():
    return "python-" + ".".join(platform.python_version().split('.')[0:2])