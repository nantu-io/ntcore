###############################################################################################
## Below codes are derived from MLFlow.
## Github: https://github.com/mlflow/mlflow
###############################################################################################
from packaging.version import Version
import logging, inspect, collections

# _SklearnMetric represents a metric (e.g, precision_score) that will be computed and
# logged during the autologging routine for a particular model type (eg, classifier, regressor).
_SklearnMetric = collections.namedtuple("_SklearnMetric", ["name", "function", "arguments"])

def get_estimators_to_patch():
    """
    :return: A list of meta estimator class definitions
             (e.g., `sklearn.model_selection.GridSearchCV`) that should be included
             when patching training functions for autologging
    """
    from sklearn.utils import all_estimators
    _, estimators_to_patch = zip(*all_estimators())
    # Ensure that relevant meta estimators (e.g. GridSearchCV, Pipeline) are selected
    # for patching if they are not already included in the output of `all_estimators()`
    estimators_to_patch = set(estimators_to_patch).union(
        set(_get_meta_estimators_for_autologging())
    )
    # Exclude certain preprocessing & feature manipulation estimators from patching. These
    # estimators represent data manipulation routines (e.g., normalization, label encoding)
    # rather than ML algorithms. Accordingly, we should not create runs and log parameters
    # or metrics for these routines, unless they are captured as part of an ML pipeline
    # (via `sklearn.pipeline.Pipeline`)
    excluded_module_names = [
        "sklearn.preprocessing",
        "sklearn.impute",
        "sklearn.feature_extraction",
        "sklearn.feature_selection",
    ]

    excluded_class_names = [
        "sklearn.compose._column_transformer.ColumnTransformer",
    ]

    return [
        estimator
        for estimator in estimators_to_patch
        if not any(
            estimator.__module__.startswith(excluded_module_name)
            or (estimator.__module__ + "." + estimator.__name__) in excluded_class_names
            for excluded_module_name in excluded_module_names
        )
    ]

def _get_meta_estimators_for_autologging():
    """
    :return: A list of meta estimator class definitions
             (e.g., `sklearn.model_selection.GridSearchCV`) that should be included
             when patching training functions for autologging
    """
    from sklearn.model_selection import GridSearchCV, RandomizedSearchCV
    from sklearn.pipeline import Pipeline

    return [ GridSearchCV, RandomizedSearchCV, Pipeline ]

def get_pretraining_metadata(estimator, *args, **kwargs):
    """
    :return: A merged dictionary of estimator params and tag keys / values.
    """
    should_log_params_deeply = not _is_parameter_search_estimator(estimator)
    params = estimator.get_params(deep=should_log_params_deeply)
    params = {k: str(v) if isinstance(v, bool) else v for k, v in params.items() if v}

    tags = {
        "estimator_name": estimator.__class__.__name__,
        "estimator_class": (estimator.__class__.__module__ + "." + estimator.__class__.__name__),
    }
    return { **params, **tags }

def _is_parameter_search_estimator(estimator):
    """
    :return: `True` if the specified scikit-learn estimator is a parameter search estimator,
             such as `GridSearchCV`. `False` otherwise.
    """
    from sklearn.model_selection import GridSearchCV, RandomizedSearchCV
    parameter_search_estimators = [ GridSearchCV, RandomizedSearchCV ]

    return any(
        [
            isinstance(estimator, param_search_estimator)
            for param_search_estimator in parameter_search_estimators
        ]
    )

def _get_metrics_value_dict(metrics_list):
    metric_value_dict = {}
    for metric in metrics_list:
        try:
            metric_value = metric.function(**metric.arguments)
        except Exception:
            pass
        else:
            metric_value_dict[metric.name] = metric_value
    return metric_value_dict

def _is_metric_supported(metric_name):
    import sklearn

    # This dict can be extended to store special metrics' specific supported versions
    _metric_supported_version = {"roc_auc_score": "0.22.2"}

    return Version(sklearn.__version__) >= Version(_metric_supported_version[metric_name])

def _get_classifier_metrics(fitted_estimator, prefix, X, y_true, sample_weight):
    """
    Compute and record various common metrics for classifiers
    For (1) precision score:
    https://scikit-learn.org/stable/modules/generated/sklearn.metrics.precision_score.html
    (2) recall score:
    https://scikit-learn.org/stable/modules/generated/sklearn.metrics.recall_score.html
    (3) f1_score:
    https://scikit-learn.org/stable/modules/generated/sklearn.metrics.f1_score.html
    By default, we choose the parameter `labels` to be `None`, `pos_label` to be `1`,
    `average` to be `weighted` to compute the weighted precision score.
    For (4) accuracy score:
    https://scikit-learn.org/stable/modules/generated/sklearn.metrics.accuracy_score.html
    we choose the parameter `normalize` to be `True` to output the percentage of accuracy,
    as opposed to `False` that outputs the absolute correct number of sample prediction
    We log additional metrics if certain classifier has method `predict_proba`
    (5) log loss:
    https://scikit-learn.org/stable/modules/generated/sklearn.metrics.log_loss.html
    (6) roc_auc_score:
    https://scikit-learn.org/stable/modules/generated/sklearn.metrics.roc_auc_score.html
    By default, for roc_auc_score, we pick `average` to be `weighted`, `multi_class` to be `ovo`,
    to make the output more insensitive to dataset imbalance.
    Steps:
    1. Extract X and y_true from fit_args and fit_kwargs, and compute y_pred.
    2. If the sample_weight argument exists in fit_func (accuracy_score by default
    has sample_weight), extract it from fit_args or fit_kwargs as
    (y_true, y_pred, ...... sample_weight), otherwise as (y_true, y_pred, ......)
    3. return a dictionary of metric(name, value)
    :param fitted_estimator: The already fitted classifier
    :param fit_args: Positional arguments given to fit_func.
    :param fit_kwargs: Keyword arguments given to fit_func.
    :return: dictionary of (function name, computed value)
    """
    import sklearn

    y_pred = fitted_estimator.predict(X)

    classifier_metrics = [
        _SklearnMetric(
            name=prefix + "precision_score",
            function=sklearn.metrics.precision_score,
            arguments=dict(
                y_true=y_true, y_pred=y_pred, average="weighted", sample_weight=sample_weight
            ),
        ),
        _SklearnMetric(
            name=prefix + "recall_score",
            function=sklearn.metrics.recall_score,
            arguments=dict(
                y_true=y_true, y_pred=y_pred, average="weighted", sample_weight=sample_weight
            ),
        ),
        _SklearnMetric(
            name=prefix + "f1_score",
            function=sklearn.metrics.f1_score,
            arguments=dict(
                y_true=y_true, y_pred=y_pred, average="weighted", sample_weight=sample_weight
            ),
        ),
        _SklearnMetric(
            name=prefix + "accuracy_score",
            function=sklearn.metrics.accuracy_score,
            arguments=dict(
                y_true=y_true, y_pred=y_pred, normalize=True, sample_weight=sample_weight
            ),
        ),
    ]

    if hasattr(fitted_estimator, "predict_proba"):
        y_pred_proba = fitted_estimator.predict_proba(X)
        classifier_metrics.extend(
            [
                _SklearnMetric(
                    name=prefix + "log_loss",
                    function=sklearn.metrics.log_loss,
                    arguments=dict(y_true=y_true, y_pred=y_pred_proba, sample_weight=sample_weight),
                ),
            ]
        )

        if _is_metric_supported("roc_auc_score"):
            # For binary case, the parameter `y_score` expect scores must be
            # the scores of the class with the greater label.
            if len(y_pred_proba[0]) == 2:
                y_pred_proba = y_pred_proba[:, 1]

            classifier_metrics.extend(
                [
                    _SklearnMetric(
                        name=prefix + "roc_auc_score",
                        function=sklearn.metrics.roc_auc_score,
                        arguments=dict(
                            y_true=y_true,
                            y_score=y_pred_proba,
                            average="weighted",
                            sample_weight=sample_weight,
                            multi_class="ovo",
                        ),
                    ),
                ]
            )

    return _get_metrics_value_dict(classifier_metrics)

def _get_regressor_metrics(fitted_estimator, prefix, X, y_true, sample_weight):
    """
    Compute and record various common metrics for regressors
    For (1) (root) mean squared error:
    https://scikit-learn.org/stable/modules/generated/sklearn.metrics.mean_squared_error.html
    (2) mean absolute error:
    https://scikit-learn.org/stable/modules/generated/sklearn.metrics.mean_absolute_error.html
    (3) r2 score:
    https://scikit-learn.org/stable/modules/generated/sklearn.metrics.r2_score.html
    By default, we choose the parameter `multioutput` to be `uniform_average`
    to average outputs with uniform weight.
    Steps:
    1. Extract X and y_true from fit_args and fit_kwargs, and compute y_pred.
    2. If the sample_weight argument exists in fit_func (accuracy_score by default
    has sample_weight), extract it from fit_args or fit_kwargs as
    (y_true, y_pred, sample_weight, multioutput), otherwise as (y_true, y_pred, multioutput)
    3. return a dictionary of metric(name, value)
    :param fitted_estimator: The already fitted regressor
    :param fit_args: Positional arguments given to fit_func.
    :param fit_kwargs: Keyword arguments given to fit_func.
    :return: dictionary of (function name, computed value)
    """
    import sklearn
    import numpy as np

    y_pred = fitted_estimator.predict(X)

    regressor_metrics = [
        _SklearnMetric(
            name=prefix + "mse",
            function=sklearn.metrics.mean_squared_error,
            arguments=dict(
                y_true=y_true,
                y_pred=y_pred,
                sample_weight=sample_weight,
                multioutput="uniform_average",
            ),
        ),
        _SklearnMetric(
            name=prefix + "mae",
            function=sklearn.metrics.mean_absolute_error,
            arguments=dict(
                y_true=y_true,
                y_pred=y_pred,
                sample_weight=sample_weight,
                multioutput="uniform_average",
            ),
        ),
        _SklearnMetric(
            name=prefix + "r2_score",
            function=sklearn.metrics.r2_score,
            arguments=dict(
                y_true=y_true,
                y_pred=y_pred,
                sample_weight=sample_weight,
                multioutput="uniform_average",
            ),
        ),
    ]

    # To be compatible with older versions of scikit-learn (below 0.22.2), where
    # `sklearn.metrics.mean_squared_error` does not have "squared" parameter to calculate `rmse`,
    # we compute it through np.sqrt(<value of mse>)
    metrics_value_dict = _get_metrics_value_dict(regressor_metrics)
    metrics_value_dict[prefix + "rmse"] = np.sqrt(metrics_value_dict[prefix + "mse"])

    return metrics_value_dict

def _get_specialized_estimator_content(fitted_estimator, prefix, X, y_true=None, sample_weight=None):
    import sklearn

    metrics = dict()

    if y_true is not None:
        try:
            if sklearn.base.is_classifier(fitted_estimator):
                metrics = _get_classifier_metrics(
                    fitted_estimator, prefix, X, y_true, sample_weight
                )
            elif sklearn.base.is_regressor(fitted_estimator):
                metrics = _get_regressor_metrics(fitted_estimator, prefix, X, y_true, sample_weight)
        except Exception as err:
            msg = (
                "Failed to autolog metrics for "
                + fitted_estimator.__class__.__name__
                + ". Logging error: "
                + str(err)
            )
            logging.warning(msg)

    return metrics

def _get_estimator_content(estimator, prefix, X, y_true=None, sample_weight=None):
    """
    Logs content for the given estimator, which includes metrics and artifacts that might be
    tailored to the estimator's type (e.g., regression vs classification). Training labels
    are required for metric computation; metrics will be omitted if labels are not available.
    :return: A dict of the computed metrics.
    """
    metrics = _get_specialized_estimator_content(
        fitted_estimator=estimator,
        prefix=prefix,
        X=X,
        y_true=y_true,
        sample_weight=sample_weight,
    )

    if hasattr(estimator, "score") and y_true is not None:
        try:
            # Use the sample weight only if it is present in the score args
            score_arg_names = list(inspect.signature(estimator.score).parameters.keys())
            score_args = (
                (X, y_true, sample_weight) if "sample_weight" in score_arg_names else (X, y_true)
            )
            score = estimator.score(*score_args)
        except Exception as e:
            msg = (
                estimator.score.__qualname__
                + " failed. The 'training_score' metric will not be recorded. Scoring error: "
                + str(e)
            )
            logging.warning(msg)
        else:
            score_key = prefix + "score"
            metrics[score_key] = score

    return metrics

def _get_X_y_and_sample_weight(fit_func, fit_args, fit_kwargs):
    """
    Get a tuple of (X, y, sample_weight) in the following steps.
    1. Extract X and y from fit_args and fit_kwargs.
    2. If the sample_weight argument exists in fit_func,
       extract it from fit_args or fit_kwargs and return (X, y, sample_weight),
       otherwise return (X, y)
    :param fit_func: A fit function object.
    :param fit_args: Positional arguments given to fit_func.
    :param fit_kwargs: Keyword arguments given to fit_func.
    :returns: A tuple of either (X, y, sample_weight), where `y` and `sample_weight` may be
              `None` if the specified `fit_args` and `fit_kwargs` do not specify labels or
              a sample weighting.
    """
    _SAMPLE_WEIGHT = "sample_weight"

    def _get_Xy(args, kwargs, X_var_name, y_var_name):
        # corresponds to: model.fit(X, y)
        if len(args) >= 2:
            return args[:2]

        # corresponds to: model.fit(X, <y_var_name>=y)
        if len(args) == 1:
            return args[0], kwargs.get(y_var_name)

        # corresponds to: model.fit(<X_var_name>=X, <y_var_name>=y)
        return kwargs[X_var_name], kwargs.get(y_var_name)

    def _get_sample_weight(arg_names, args, kwargs):
        sample_weight_index = arg_names.index(_SAMPLE_WEIGHT)

        # corresponds to: model.fit(X, y, ..., sample_weight)
        if len(args) > sample_weight_index:
            return args[sample_weight_index]

        # corresponds to: model.fit(X, y, ..., sample_weight=sample_weight)
        if _SAMPLE_WEIGHT in kwargs:
            return kwargs[_SAMPLE_WEIGHT]

        return None

    fit_arg_names = list(inspect.signature(fit_func).parameters.keys())
    # In most cases, X_var_name and y_var_name become "X" and "y", respectively.
    # However, certain sklearn models use different variable names for X and y.
    # E.g., see: https://scikit-learn.org/stable/modules/generated/sklearn.multioutput.MultiOutputClassifier.html#sklearn.multioutput.MultiOutputClassifier.fit
    X_var_name, y_var_name = fit_arg_names[:2]
    Xy = _get_Xy(fit_args, fit_kwargs, X_var_name, y_var_name)
    sample_weight = (
        _get_sample_weight(fit_arg_names, fit_args, fit_kwargs)
        if (_SAMPLE_WEIGHT in fit_arg_names)
        else None
    )

    return (*Xy, sample_weight)

def get_posttraining_metadata(estimator, *args, **kwargs):
    """
    :return: Metadata for a scikit-learn estimator after training has completed. 
            This is intended to be invoked within a patched scikit-learn training routine.
    """
    (X, y_true, sample_weight) = _get_X_y_and_sample_weight(estimator.fit, args, kwargs)

    # log common metrics and artifacts for estimators (classifier, regressor)
    posttraining_metadata = _get_estimator_content(
        estimator=estimator,
        prefix="training_",
        X=X,
        y_true=y_true,
        sample_weight=sample_weight,
    )
    if y_true is None and not posttraining_metadata:
        logging.warning(
            "Training metrics will not be recorded because training labels were not specified."
            " To automatically record training metrics, provide training labels as inputs to"
            " the model training function.")
    
    if not _is_parameter_search_estimator(estimator):
        return posttraining_metadata

    if hasattr(estimator, "best_score_"):
        posttraining_metadata.update({"best_cv_score": estimator.best_score_})

    if hasattr(estimator, "best_params_"):
        best_params = {
            "best_{param_name}".format(param_name=param_name): param_value
            for param_name, param_value in estimator.best_params_.items()
        }
        posttraining_metadata.update(best_params)

    return posttraining_metadata
