import gorilla
import io
import torch
import pytorch_lightning as pl
import os
from pytorch_lightning.callbacks import Callback
from packaging import version
from ntcore import client
from ...client import Experiment
from ..utils import get_runtime_version


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
    def _save_model(*args, **kwargs):
        original = gorilla.get_original_attribute(module, "save")
        if not 'workspace_id' in kwargs:
            print('[[WARN] Model is not recorded because workspace_id is not set!')
            return
        experiment = Experiment(client, kwargs['workspace_id'])
        del kwargs['workspace_id']
        original(*args, **kwargs)

        if isinstance(args[1], str):
            experiment.set_model(open(args[1], "rb").read())
        elif isinstance(args[1], os.PathLike):
            experiment.set_model(open(args[1], "rb").read())
        elif isinstance(args[1], io.BytesIO):
            experiment.set_model(args[1].read())
        else:
            raise Exception('Invalid model path.')
        experiment.emit()
    if method_name not in patched_methods:
        patch = gorilla.Patch(module, method_name, _save_model, settings=settings)
        gorilla.apply(patch)
        patched_methods.add(method_name)


def patch():
    """
    Patch tensorflow methods to intercept training params and metrics
    """
    _patch_save(torch)