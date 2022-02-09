from mlflow.utils.autologging_utils import get_mlflow_run_params_for_fn_args
from tensorflow.python.keras.engine.training import flatten_metrics_in_order
from tensorflow.keras.models import Model
from tensorflow import estimator
from ..utils import get_runtime_version
import tensorflow
from ntcore import client
import gorilla
import tarfile
from packaging import version
import os


settings = gorilla.Settings(allow_hit=True)
FRAMEWORK = 'tensorflow'
patched_methods = set()


def _patch_save_model(module, method_name):
    model_filename = "model.tar.gz"
    @gorilla.patch(module)
    def _save_model(self, *args, **kwargs):
        original = gorilla.get_original_attribute(module, method_name)
        original(self, *args, **kwargs)
        tar = tarfile.open(model_filename, "w:gz")
        tar.add(args[0], arcname="model")
        tar.close()
        experiment = client.get_experiment()
        experiment.set_model(open(model_filename, "rb").read())
        try:
            experiment.emit()
        finally:
            os.remove(model_filename)
    if method_name not in patched_methods:
        patch = gorilla.Patch(module, method_name, _save_model, settings=settings)
        gorilla.apply(patch)
        patched_methods.add(method_name)


def _patch_save(module):
    method_name = 'save'
    model_filename = "model.tar.gz"
    @gorilla.patch(module)
    def _save(self, *args, **kwargs):
        original = gorilla.get_original_attribute(module, method_name)
        original(self, *args, **kwargs)
        tar = tarfile.open(model_filename, "w:gz")
        tar.add(args[0], arcname="model")
        tar.close()
        experiment = client.get_experiment()
        experiment.set_model(open(model_filename, "rb").read())
        try:
            experiment.emit()
        finally:
            os.remove(model_filename)
    if method_name not in patched_methods:
        patch = gorilla.Patch(module, method_name, _save, settings=settings)
        gorilla.apply(patch)
        patched_methods.add(method_name)


def _patch_evaluate(module):
    method_name = 'evaluate'
    @gorilla.patch(module)
    def _evaluate(self, *args, return_dict=False, **kwargs):
        original = gorilla.get_original_attribute(module, method_name)
        evaluation = original(self, *args, **kwargs, return_dict=True)
        experiment = client.get_experiment()
        experiment.set_metrics(evaluation)
        if return_dict:
            return evaluation
        return flatten_metrics_in_order(evaluation, self.metrics_names)
    if method_name not in patched_methods:
        patch = gorilla.Patch(module, method_name, _evaluate, settings=settings)
        gorilla.apply(patch)
        patched_methods.add(method_name)


def _patch_fit(module):
    method_name = 'fit'
    @gorilla.patch(module)
    def _fit(self, *args, **kwargs):
        original = gorilla.get_original_attribute(module, method_name)
        original(self, *args, **kwargs)
        unlogged_params = ["self", "x", "y", "callbacks", "validation_data", "verbose"]
        params_to_log = get_mlflow_run_params_for_fn_args(original, args, kwargs, unlogged_params)
        experiment = client.get_experiment()
        experiment.set_parameters(params_to_log)
        experiment.set_runtime(get_runtime_version())
        experiment.set_framework(FRAMEWORK)
    if method_name not in patched_methods:
        patch = gorilla.Patch(module, method_name, _fit, settings=settings)
        gorilla.apply(patch)
        patched_methods.add(method_name)


def _patch_fit_generator(module):
    method_name = 'fit_generator'
    @gorilla.patch(module)
    def _fit(self, *args, **kwargs):
        original = gorilla.get_original_attribute(module, method_name)
        original(self, *args, **kwargs)
        unlogged_params = ["self", "x", "y", "callbacks", "validation_data", "verbose"]
        params_to_log = get_mlflow_run_params_for_fn_args(original, args, kwargs, unlogged_params)
        experiment = client.get_experiment()
        experiment.set_parameters(params_to_log)
        experiment.set_runtime(get_runtime_version())
        experiment.set_framework(FRAMEWORK)
    if method_name not in patched_methods:
        patch = gorilla.Patch(module, method_name, _fit, settings=settings)
        gorilla.apply(patch)
        patched_methods.add(method_name)


def _patch_train(module):
    method_name = 'train'
    @gorilla.patch(module)
    def _train(self, *args, **kwargs):
        original = gorilla.get_original_attribute(module, method_name)
        original(self, *args, **kwargs)

        # Checking step and max_step parameters for logging
        params = {}
        if len(args) >= 3:
            params["steps"] = args[2]
            if len(args) >= 4:
                params["max_steps"] = args[3]
        if "steps" in kwargs:
            params["steps"] = kwargs["steps"]
        if "max_steps" in kwargs:
            params["max_steps"] = kwargs["max_steps"]

        experiment = client.get_experiment()
        experiment.set_parameters(params)
        experiment.set_runtime(get_runtime_version())
        experiment.set_framework(FRAMEWORK)
    if method_name not in patched_methods:
        patch = gorilla.Patch(module, method_name, _train, settings=settings)
        gorilla.apply(patch)
        patched_methods.add(method_name)


def patch():
    """
    Patch tensorflow methods to intercept training params and metrics
    """
    _patch_evaluate(Model)
    _patch_save(Model)
    _patch_fit(Model)
    _patch_train(estimator.Estimator)
    _patch_save_model(estimator.Estimator, 'export_saved_model')
    _patch_save_model(estimator.Estimator, 'export_savedmodel')

    if version.parse(tensorflow.__version__) < version.parse("2.1.0"):
        _patch_fit_generator(Model)