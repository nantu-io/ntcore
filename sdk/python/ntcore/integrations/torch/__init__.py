import pytorch_lightning as pl
from pytorch_lightning.callbacks import Callback
from packaging import version

class ModelRecorder(Callback):

    def __init__(self, experiment) -> None:
        super().__init__()
        self._experiment = experiment
    
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

        params = {"epochs": trainer.max_epochs}
        if hasattr(trainer, "optimizers"):
            optimizer = trainer.optimizers[0]
            params["optimizer_name"] = self._get_optimizer_name(optimizer)

            if hasattr(optimizer, "defaults"):
                params.update(optimizer.defaults)

        self._experiment.pretraining_metadata = params

    def on_fit_end(self, trainer: "pl.Trainer", pl_module: "pl.LightningModule") -> None:
        """Called when fit ends."""
        cur_metrics = trainer.callback_metrics
        metrics = dict(map(lambda x: (x[0], float(x[1])), cur_metrics.items()))
        # Convert model to ONNX: pl_module.to_onnx("model.onnx")
        self._experiment.posttraining_metadata = metrics
        self._experiment.serializable_model = pl_module
        self._experiment.save()