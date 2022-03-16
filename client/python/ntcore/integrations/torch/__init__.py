import gorilla
import io
import torch
import os
import io
import pytorch_lightning as pl
from pytorch_lightning.callbacks import Callback
from packaging import version
from ntcore import client
from ...client import Experiment
from ..utils import get_runtime_version
from typing import BinaryIO, Union, IO
import dill


settings = gorilla.Settings(allow_hit=True)
FRAMEWORK = 'pytorch'
patched_methods = set()


class ModelRecorder(Callback):

    def __init__(self, workspace_id) -> None:
        super().__init__()
        self._experiment = Experiment(client, workspace_id)
    
    def _get_optimizer_name(self, optimizer):
        if version.parse(pl.__version__) < version.parse("1.1.0"):
            return optimizer.__class__.__name__
        else:
            from pytorch_lightning.core.optimizer import LightningOptimizer
            return (
                optimizer._optimizer.__class__.__name__
                if isinstance(optimizer, LightningOptimizer)
                else optimizer.__class__.__name__
            )

    def on_fit_start(self, trainer: "pl.Trainer", pl_module: "pl.LightningModule") -> None:
        """Called when fit starts"""
        self._experiment.set_framework(FRAMEWORK)
        self._experiment.set_runtime(get_runtime_version())

        params = {"epochs": trainer.max_epochs}
        if hasattr(trainer, "optimizers"):
            optimizer = trainer.optimizers[0]
            params["optimizer_name"] = self._get_optimizer_name(optimizer)

            if hasattr(optimizer, "defaults"):
                params.update(optimizer.defaults)
        
        self._experiment.set_parameters(params)

    def on_fit_end(self, trainer: "pl.Trainer", pl_module: "pl.LightningModule") -> None:
        """Called when fit ends."""
        cur_metrics = trainer.callback_metrics
        metrics = dict(map(lambda x: (x[0], float(x[1])), cur_metrics.items()))
        try:
            # Use this to convert model to ONNX.
            # pl_module.to_onnx("model.onnx")
            buffer = io.BytesIO()
            torch.save(pl_module.state_dict(), buffer)
            self._experiment.set_metrics(metrics)
            self._experiment.set_model(buffer.read())
            self._experiment.emit()
        except ValueError as e:
            print(e)
            print('[WARN] Model is not recorded because \'model.example_input_array\' is not set!')


def _patch_save(module):
    method_name = 'save'
    @gorilla.patch(module)
    def _save_model(obj, f, transform=None, workspace_id=None, **kwargs):
        missing_args = []
        if transform is None:
            missing_args.append('transform')
        if workspace_id is None:
            missing_args.append('workspace_id')
        if len(missing_args) > 0:
            print('[WARN] Model is not recorded due to missing field(s): {0}'.format(missing_args))
            original = gorilla.get_original_attribute(module, method_name)
            original(obj, f, **kwargs)
            serialized = _get_serialized(f)
        else:
            # serialized = dill.dumps({ 'model': obj, 'transform': transform, 'clazz': type(obj) })
            print('[INFO] Model is recorded')
            original = gorilla.get_original_attribute(module, method_name)
            original({ 'model': obj, 'transform': transform }, f, **kwargs)
            serialized = _get_serialized(f)

            # open('model_class.py', 'w').write(dill.source.getsource(type(obj)))

            # dill.dump(mainify(obj), open("model.pkl", "wb"))

        experiment = Experiment(client, workspace_id)
        experiment.set_framework(FRAMEWORK)
        experiment.set_runtime(get_runtime_version())
        experiment.set_parameters({})
        experiment.set_metrics({})
        experiment.set_model(serialized)
        # experiment.emit()

        # deserialized = torch.load(f)
        # model.load_state_dict(deserialized['state_dict'])
        # model.eval()
        # print(deserialized)

    if method_name not in patched_methods:
        patch = gorilla.Patch(module, method_name, _save_model, settings=settings)
        gorilla.apply(patch)
        patched_methods.add(method_name)

    def mainify(obj):
        """If obj is not defined in __main__ then redefine it in 
        main so that dill will serialize the definition along with the object"""
        if obj.__module__ != "__main__":
            import __main__
            import inspect
            s = inspect.getsource(obj)
            co = compile(s, '<string>', 'exec')
            exec(co, __main__.__dict__)

def _get_serialized(f: Union[str, os.PathLike, BinaryIO, IO[bytes]]):
    """
    Get seriazlied pt/ptb file.
    """
    if isinstance(f, str):
        return open(f, "rb").read()
    elif isinstance(f, os.PathLike):
        return open(f, "rb").read()
    elif isinstance(f, io.BytesIO):
        return f.read()
    else:
        raise Exception('Invalid model path.')

def patch():
    """
    Patch tensorflow methods to intercept training params and metrics
    """
    _patch_save(torch)