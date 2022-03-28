from tensorflow.python.keras.engine.training import flatten_metrics_in_order
from tensorflow.keras.models import Model
from tensorflow import estimator
from packaging import version
import tensorflow
import gorilla
import inspect

patched_methods = set()

def safe_patch(module, method_name, patch_func):
    '''
    Safely patches the given method to avoid recursive invocatoin.
    '''
    if method_name in patched_methods:
        return
    patch = gorilla.Patch(module, method_name, patch_func, settings=gorilla.Settings(allow_hit=True))
    gorilla.apply(patch)
    patched_methods.add(method_name)

def set_attributes(experiment, pretraining_metadata=None, posttraining_metadata=None, serializable_model=None):
    '''
    Safely sets the experiment attributes.
    '''
    if not experiment:
        return
    if pretraining_metadata:
        experiment.pretraining_metadata = pretraining_metadata
    if posttraining_metadata:
        experiment.posttraining_metadata = posttraining_metadata
    if serializable_model:
        experiment.serializable_model = serializable_model

@gorilla.patch(estimator.Estimator)
def __export_saved_model(self, *args, experiment=None, **kwargs):
    '''
    Patches export_saved_model() model.
    '''
    original = gorilla.get_original_attribute(estimator.Estimator, 'export_saved_model')
    original(self, *args, **kwargs)
    set_attributes(experiment, serializable_model=self)
    if experiment is not None:
        experiment.save()

@gorilla.patch(estimator.Estimator)
def __export_savedmodel(self, *args, experiment=None, **kwargs):
    '''
    Patches export_savedmodel() method.
    '''
    original = gorilla.get_original_attribute(estimator.Estimator, 'export_savedmodel')
    original(self, *args, **kwargs)
    set_attributes(experiment, serializable_model=self)
    if experiment is not None:
        experiment.save()

@gorilla.patch(Model)
def __save(self, *args, experiment=None, **kwargs):
    '''
    Patches save() method.
    '''
    original = gorilla.get_original_attribute(Model, 'save')
    original(self, *args, **kwargs)
    set_attributes(experiment, serializable_model=self)
    if experiment is not None:
        experiment.save()

@gorilla.patch(Model)
def __evaluate(self, *args, experiment=None, return_dict=False, **kwargs):
    '''
    Patches evaluate() method.
    '''
    original = gorilla.get_original_attribute(Model, 'evaluate')
    evaluation = original(self, *args, **kwargs, return_dict=True)
    set_attributes(experiment, posttraining_metadata=evaluation)
    if return_dict:
        return evaluation
    return flatten_metrics_in_order(evaluation, self.metrics_names)

@gorilla.patch(Model)
def __fit(self, *args, experiment=None, **kwargs):
    '''
    Patches the fit() method
    '''
    original = gorilla.get_original_attribute(Model, 'fit')
    original(self, *args, **kwargs)
    unlogged_params = ["self", "x", "y", "callbacks", "validation_data", "verbose"]
    params_to_log = __get_run_params_for_fn_args(original, args, kwargs, unlogged_params)
    set_attributes(experiment, pretraining_metadata=params_to_log)

@gorilla.patch(Model)
def __fit_generator(self, *args, experiment=None, **kwargs):
    '''
    Patches the fit_generator() method
    '''
    original = gorilla.get_original_attribute(Model, 'fit_generator')
    original(self, *args, **kwargs)
    unlogged_params = ["self", "x", "y", "callbacks", "validation_data", "verbose"]
    params_to_log = __get_run_params_for_fn_args(original, args, kwargs, unlogged_params)
    set_attributes(experiment, pretraining_metadata=params_to_log)

@gorilla.patch(estimator.Estimator)
def __train(self, *args, experiment=None, **kwargs):
    '''
    Patches the train() method
    '''
    original = gorilla.get_original_attribute(estimator.Estimator, 'train')
    original(self, *args, **kwargs)
    params = {}
    if len(args) >= 3:
        params["steps"] = args[2]
        if len(args) >= 4:
            params["max_steps"] = args[3]
    if "steps" in kwargs:
        params["steps"] = kwargs["steps"]
    if "max_steps" in kwargs:
        params["max_steps"] = kwargs["max_steps"]
    set_attributes(experiment, pretraining_metadata=params)

def __get_run_params_for_fn_args(fn, args, kwargs, unlogged=None):
    """
    This method is derived from MLFlow.
    GitHub: https://github.com/mlflow/mlflow.

    Given arguments explicitly passed to a function, generate a dictionary of MLflow Run
    parameter key / value pairs.
    :param fn: function whose parameters are to be logged
    :param args: arguments explicitly passed into fn. If `fn` is defined on a class,
                 `self` should not be part of `args`; the caller is responsible for
                 filtering out `self` before calling this function.
    :param kwargs: kwargs explicitly passed into fn
    :param unlogged: parameters not to be logged
    :return: A dictionary of MLflow Run parameter key / value pairs.
    """
    unlogged = unlogged or []
    param_spec = inspect.signature(fn).parameters
    # Filter out `self` from the signature under the assumption that it is not contained
    # within the specified `args`, as stipulated by the documentation
    relevant_params = [param for param in param_spec.values() if param.name != "self"]

    # Fetch the parameter names for specified positional arguments from the function
    # signature & create a mapping from positional argument name to specified value
    params_to_log = {
        param_info.name: param_val
        for param_info, param_val in zip(list(relevant_params)[: len(args)], args)
    }
    # Add all user-specified keyword arguments to the set of parameters to log
    params_to_log.update(kwargs)
    # Add parameters that were not explicitly specified by the caller to the mapping,
    # using their default values
    params_to_log.update(
        {
            param.name: param.default
            for param in list(relevant_params)[len(args) :]
            if param.name not in kwargs
        }
    )
    # Filter out any parameters that should not be logged, as specified by the `unlogged` parameter
    params_to_log = {key: value for key, value in params_to_log.items() if key not in unlogged}
    return params_to_log


safe_patch(estimator.Estimator, 'export_saved_model', __export_saved_model)
safe_patch(estimator.Estimator, 'export_savedmodel', __export_savedmodel)
safe_patch(estimator.Estimator, 'train', __train)
safe_patch(Model, 'save', __save)
safe_patch(Model, 'evaluate', __evaluate)
safe_patch(Model, 'fit', __fit)
if version.parse(tensorflow.__version__) < version.parse("2.1.0"):
    safe_patch(Model, 'fit_generator', __fit_generator)