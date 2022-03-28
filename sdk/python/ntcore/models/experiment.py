class Experiment(object):
    """
    Experiment object that matches the NTCore experiment model.
    
    Attributes
    ----------
    client : str
        The client of NTCore server.

    Methods
    ----------
    emit(experiment)
        Sends the experiment metadata and serialized object to NTCore.
    """
    def __init__(self, client, workspace_id):
        self._client = client
        self._workspace_id = workspace_id
        self._runtime = None
        self._framework = None
        self._pretraining_metadata = dict()
        self._posttraining_metadata = dict()
        self._serializable_model = None

    @property
    def workspace_id(self):
        return self._workspace_id

    @property
    def runtime(self):
        return self._runtime

    @runtime.setter
    def runtime(self, runtime):
        self._runtime = runtime
    
    @property
    def framework(self):
        return self._framework

    @framework.setter
    def framework(self, framework):
        self._framework = framework

    @property
    def pretraining_metadata(self):
        return self._pretraining_metadata

    @pretraining_metadata.setter
    def pretraining_metadata(self, pretraining_metadata):
        self._pretraining_metadata = pretraining_metadata

    @property
    def posttraining_metadata(self):
        return self._posttraining_metadata

    @posttraining_metadata.setter
    def posttraining_metadata(self, posttraining_metadata):
        self._posttraining_metadata = posttraining_metadata

    @property
    def serializable_model(self):
        return self._serializable_model

    @serializable_model.setter
    def serializable_model(self, serializable_model):
        self._serializable_model = serializable_model

    def log_pretraining_metadata(self, pretraining_metadata: dict):
        '''
        Logs pre-training metadata from model
        '''
        self._pretraining_metadata = pretraining_metadata

    def log_posttraining_metadata(self, posttraining_metadata: dict):
        '''
        Logs post-training metadata from model
        '''
        self._pretraining_metadata = posttraining_metadata

    def save_model(self, serializable_model):
        '''
        Saves the serializable model to NTCore server.
        '''
        self.serializable_model = serializable_model
        self._client.save(self)

    def save(self):
        '''
        Same as save_model, only used after setting serializable_model property.
        '''
        if self._serializable_model is None:
            raise ValueError('Serializable model is not provided.')
        self._client.save(self)

    def __enter__(self):
        '''
        Returns self as an experiment object.
        '''
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        '''
        Removes self from active experiments.
        '''
        self._client.stop_run(self)