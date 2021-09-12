from distutils.command.clean import clean


class Client(object):
    
    def enable_autolog(workspace_id):
        pass

    def log_experiment(experiment):
        pass

class Run(object):

    def __init__(self, client) -> None:
        self._client = client

    def log_experiment(self):
        self._client.log_experiment();