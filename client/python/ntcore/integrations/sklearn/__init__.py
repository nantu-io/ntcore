from mlflow.sklearn import SERIALIZATION_FORMAT_CLOUDPICKLE
from mlflow.sklearn import DEFAULT_AWAIT_MAX_SLEEP_SECONDS
from mlflow.sklearn import ModelSignature
from mlflow.sklearn import ModelInputExample
from mlflow.sklearn import utils
from mlflow.sklearn.utils import _is_parameter_search_estimator
from ntcore import client
import mlflow.sklearn as sklearn
import numpy as np
import gorilla
import platform
import pickle

settings = gorilla.Settings(allow_hit=True)


def _get_runtime_version():
    return "python-" + ".".join(platform.python_version().split('.')[0:2])


def _get_estimator_params(estimator):
    should_log_params_deeply = not _is_parameter_search_estimator(estimator)
    params = estimator.get_params(deep=should_log_params_deeply)
    return {k: str(v) if isinstance(v, bool) else v for k, v in params.items() if v}


def _patch_log_params(module):
    method_name = '_get_estimator_info_tags'
    @gorilla.patch(module)
    def _log_params(estimator):
        original = gorilla.get_original_attribute(module, method_name)
        info_tags = original(estimator)
        params = _get_estimator_params(estimator)
        experiment = client.get_experiment()
        experiment.set_parameters({**info_tags, **params})
        experiment.set_runtime(_get_runtime_version())
        experiment.set_framework('sklearn')
        return info_tags
    patch = gorilla.Patch(module, method_name, _log_params, settings=settings)
    gorilla.apply(patch)


def _patch_log_metrics(module):
    method_name = '_log_estimator_content'
    @gorilla.patch(module)
    def _log_metrics(autologging_client, estimator, run_id, prefix, X, y_true=None, sample_weight=None):
        original = gorilla.get_original_attribute(module, method_name)
        metrics = original(autologging_client, estimator, run_id, prefix, X, y_true, sample_weight)
        rounded_metrics = {k: round(v, 8) if isinstance(v, (np.floating, float)) else v for k, v in metrics.items()}
        experiment = client.get_experiment()
        experiment.set_metrics(rounded_metrics)
        return metrics
    patch = gorilla.Patch(module, method_name, _log_metrics, settings=settings)
    gorilla.apply(patch)


def _patch_log_model(module):
    method_name = 'log_model'
    @gorilla.patch(module)
    def _log_model(sk_model, 
            artifact_path,
            conda_env=None,
            serialization_format=SERIALIZATION_FORMAT_CLOUDPICKLE,
            registered_model_name=None,
            signature: ModelSignature = None,
            input_example: ModelInputExample = None,
            await_registration_for=DEFAULT_AWAIT_MAX_SLEEP_SECONDS,
            pip_requirements=None,
            extra_pip_requirements=None):
        original = gorilla.get_original_attribute(module, method_name)
        model = original(
            sk_model, 
            artifact_path, 
            conda_env, 
            serialization_format, 
            registered_model_name,
            signature,
            input_example,
            await_registration_for,
            pip_requirements,
            extra_pip_requirements)
        experiment = client.get_experiment()
        experiment.set_model(pickle.dumps(sk_model))
        experiment.emit()
        return model
    patch = gorilla.Patch(module, method_name, _log_model, settings=settings)
    gorilla.apply(patch)


_patch_log_params(utils)
_patch_log_metrics(utils)
_patch_log_model(sklearn)