from abc import ABC, abstractmethod
from ..models.framework import Framework
import pickle, tarfile, tempfile, os


class BaseModelSerializer(ABC):

    def __init__(self) -> None:
        super().__init__()

    def serialize(self, model) -> bytes:
        return self._from_disk(model) if isinstance(model, str) else self._from_memory(model)


    @abstractmethod
    def _from_memory(self, model) -> bytes:
        pass

    @abstractmethod
    def _from_disk(self, path: str) -> bytes:
        pass

    @abstractmethod
    def framework(self) -> Framework:
        pass

    @abstractmethod
    def close(self) -> None:
        pass


class SklearnModelSerializer(BaseModelSerializer):

    def _from_disk(self, path: str):
        if not path.endswith(".pkl"):
            raise ValueError('Sklearn model should be a file with extension as .pkl')
        return open(path, "rb").read()

    def _from_memory(self, model):
        return pickle.dumps(model)

    def framework(self) -> Framework:
        return Framework.sklearn

    def close(self) -> None:
        pass


class TensorflowModelSerializer(BaseModelSerializer):

    def __init__(self) -> None:
        super().__init__()
        self._model_file = tempfile.NamedTemporaryFile(suffix='.tar.gz')
        
    def _gzip(self, dir) -> None:
        tar = tarfile.open(self._model_file.name, "w:gz")
        tar.add(dir, arcname="model")
        tar.close()

    def _from_disk(self, path: str) -> bytes:
        if not os.path.isdir(path):
            raise ValueError('Tensorflow model should be a directory')
        self._gzip(path)
        return open(self._model_file.name, "rb").read()

    def _from_memory(self, model) -> bytes:
        with tempfile.TemporaryDirectory() as model_dir:
            model.save(model_dir)
            self._gzip(model_dir)
        return open(self._model_file.name, "rb").read()

    def framework(self) -> Framework:
        return Framework.tensorflow

    def close(self) -> None:
        self._model_file.close()


class TorchModelSerializer(BaseModelSerializer):

    def __init__(self) -> None:
        super().__init__()
        self._model_file = tempfile.NamedTemporaryFile(suffix='.pt')

    def _from_disk(self, path: str) -> bytes:
        if not ((path.endswith(".pt") or path.endswith(".pth"))):
            raise ValueError('Pytorch model should be a file with extension as .pt or .pth')
        return open(self._model_file.name, "rb").read()

    def _from_memory(self, model) -> bytes:
        ##################################
        ## Saving and loading extra files
        ##################################
        # extra_files = {'transform': pickle.dumps(transform)}
        # model_script.save('model_script.pt', _extra_files=extra_files)
        # extra_files = {'transform': None}
        # model = torch.jit.load('model_script.pt', _extra_files=extra_files)
        # transform = pickle.loads(extra_files['transform'])
        from torch.jit import script
        buffer = script(model)
        buffer.save(self._model_file.name)
        return open(self._model_file.name, "rb").read()

    def framework(self) -> Framework:
        return Framework.pytorch

    def close(self) -> None:
        self._model_file.close()