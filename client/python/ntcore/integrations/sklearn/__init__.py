# -*- coding: utf-8 -*-
"""
scikit-learn dynamic patch that automates logging to NTCore during training.

This patch adds a ``run`` parameter to the ``fit()`` methods of most scikit-learn models, and logs
the model's hyperparameters.

See our `GitHub repository
<https://github.com/VertaAI/modeldb/blob/master/client/workflows/examples/sklearn-integration.ipynb>`__
for an example of this intergation in action.

.. versionadded:: 0.13.20

Examples
--------
.. code-block:: python

    import verta.integrations.sklearn
    run = client.set_experiment_run()
    model = sklearn.linear_model.LogisticRegression()
    model.fit(X, y, run=run)

    import ntcore.integrations.sklearn
    client = Client('http://localhost:8180')
    model = sklearn.linear_model.LogisticRegression()
    with client.start_run() as run:
        model.fit(X, y)
"""

import platform
import os
import pickle
import gorilla
import numpy as np
import inspect
import sklearn
from sklearn import (  # pylint: disable=import-error
    linear_model,
    tree,
    svm,
    ensemble,
    neural_network,
    isotonic,
    kernel_ridge,
)

classes = [
    linear_model.ARDRegression,
    linear_model.BayesianRidge,
    linear_model.ElasticNet, linear_model.ElasticNetCV,
    linear_model.HuberRegressor,
    linear_model.Lars, linear_model.LarsCV,
    linear_model.Lasso, linear_model.LassoCV,
    linear_model.LassoLars, linear_model.LassoLarsCV, linear_model.LassoLarsIC,
    linear_model.LinearRegression,
    linear_model.LogisticRegression, linear_model.LogisticRegressionCV,
    linear_model.MultiTaskLasso, linear_model.MultiTaskLassoCV,
    linear_model.MultiTaskElasticNet, linear_model.MultiTaskElasticNetCV,
    linear_model.OrthogonalMatchingPursuit, linear_model.OrthogonalMatchingPursuitCV,
    linear_model.PassiveAggressiveClassifier, linear_model.PassiveAggressiveRegressor,
    linear_model.Perceptron,
    linear_model.RANSACRegressor,
    linear_model.Ridge, linear_model.RidgeCV,
    linear_model.RidgeClassifier, linear_model.RidgeClassifierCV,
    linear_model.SGDClassifier, linear_model.SGDRegressor,
    linear_model.TheilSenRegressor,
    tree.DecisionTreeClassifier, tree.DecisionTreeRegressor,
    tree.ExtraTreeClassifier, tree.ExtraTreeRegressor,
    svm.LinearSVC, svm.LinearSVR,
    svm.NuSVC, svm.NuSVR,
    svm.OneClassSVM,
    svm.SVC, svm.SVR,
    ensemble.AdaBoostClassifier, ensemble.AdaBoostRegressor,
    ensemble.BaggingClassifier, ensemble.BaggingRegressor,
    ensemble.ExtraTreesClassifier, ensemble.ExtraTreesRegressor,
    ensemble.GradientBoostingClassifier, ensemble.GradientBoostingRegressor,
    ensemble.IsolationForest,
    ensemble.RandomForestClassifier, ensemble.RandomForestRegressor, ensemble.RandomTreesEmbedding,
    neural_network.BernoulliRBM,
    neural_network.MLPClassifier, neural_network.MLPRegressor,
    isotonic.IsotonicRegression,
    kernel_ridge.KernelRidge,
]

NTCORE_WORKSPACE_ID = 'NTCORE_WORKSPACE_ID'
settings = gorilla.Settings(allow_hit=True)


def _fit_and_log(self, cls, *args, **kwargs):
    run = kwargs.pop('run', None)
    if run is None:
        return

    original_fit = gorilla.get_original_attribute(cls, 'fit')
    fitted_estimator = original_fit(self, *args, **kwargs)

    (X, y_true, sample_weight) = _get_args_for_metrics(fitted_estimator.fit, args, kwargs)

    if sklearn.base.is_classifier(fitted_estimator):
        metrics = _get_classifier_metrics(fitted_estimator, "training_", X, y_true, sample_weight)
    elif sklearn.base.is_regressor(fitted_estimator):
        metrics = _get_regressor_metrics(fitted_estimator, "training_", X, y_true, sample_weight)

    experiment = dict(
        workspace_id=os.environ[NTCORE_WORKSPACE_ID],
        runtime="python-" + ".".join(platform.python_version().split('.')[0:2]), 
        framework="sklearn",
        metrics=metrics,
        parameters=_get_params(self),
        model=pickle.dumps(self)
    )

    try:
        run.log_experiment(experiment)
    except Exception as e:
        print(e)

    return fitted_estimator


def _get_params(estimator):
    return {k: str(v) if isinstance(v, bool) else v for k, v in estimator.get_params().items()}


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

    :param fitted_estimator: The fitted classifier
    :param fit_args: Positional arguments given to fit_func.
    :param fit_kwargs: Keyword arguments given to fit_func.
    :return: dictionary of (function name, computed value)
    """
    y_pred = fitted_estimator.predict(X)

    metrics_values = {
        prefix + "precision_score": _get_metric_val(sklearn.metrics.precision_score, y_true, y_pred, sample_weight, average="weighted"),
        prefix + "recall_score"   : _get_metric_val(sklearn.metrics.recall_score, y_true, y_pred, sample_weight, average="weighted"),
        prefix + "f1_score"       : _get_metric_val(sklearn.metrics.f1_score, y_true, y_pred, sample_weight, average="weighted"),
        prefix + "accuracy_score" : _get_metric_val(sklearn.metrics.accuracy_score, y_true, y_pred, sample_weight, normalize=True)
    }

    if not hasattr(fitted_estimator, "predict_proba"):
        return metrics_values

    y_pred_proba = fitted_estimator.predict_proba(X)
    metrics_values[prefix + "log_loss"] = _get_metric_val(sklearn.metrics.log_loss, y_true, y_pred_proba, sample_weight)

    # roc_auc_score is only supported after version 0.22.2
    if not hasattr(sklearn.metrics, "roc_auc_score"):
        return metrics_values

    # For binary case, the parameter `y_score` expect scores must be
    # the scores of the class with the greater label.
    if len(y_pred_proba[0]) == 2:
        y_pred_proba = y_pred_proba[:, 1]

    metrics_values[prefix + "roc_auc_score"] = _get_metric_val(sklearn.metrics.roc_auc_score, y_true, y_pred_proba, sample_weight, 
        average="weighted", multi_class="ovo")

    return metrics_values


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

    :param fitted_estimator: The fitted regressor
    :param fit_args: Positional arguments given to fit_func.
    :param fit_kwargs: Keyword arguments given to fit_func.
    :return: dictionary of (function name, computed value)
    """
    y_pred = fitted_estimator.predict(X)

    metrics_values = {
        prefix + "mse": _get_metric_val(sklearn.metrics.mean_squared_error, y_true, y_pred, sample_weight, multioutput="uniform_average"),
        prefix + "mae": _get_metric_val(sklearn.metrics.mean_absolute_error, y_true, y_pred, sample_weight, multioutput="uniform_average"),
        prefix + "r2_score": _get_metric_val(sklearn.metrics.r2_score, y_true, y_pred, sample_weight, multioutput="uniform_average")
    }

    # To be compatible with older versions of scikit-learn (below 0.22.2), where
    # `sklearn.metrics.mean_squared_error` does not have "squared" parameter to calculate `rmse`,
    # we compute it through np.sqrt(<value of mse>)
    metrics_values[prefix + "rmse"] = np.sqrt(metrics_values[prefix + "mse"])

    return metrics_values


def _get_args_for_metrics(fit_func, fit_args, fit_kwargs):
    """
    Get arguments to pass to metric computations in the following steps.

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

    fit_arg_names = list(inspect.signature(fit_func).parameters.keys())

    # In most cases, X_var_name and y_var_name become "X" and "y", respectively.
    # However, certain sklearn models use different variable names for X and y.
    # E.g., see: https://scikit-learn.org/stable/modules/generated/sklearn.multioutput.MultiOutputClassifier.html#sklearn.multioutput.MultiOutputClassifier.fit # noqa: E501
    X_var_name, y_var_name = fit_arg_names[:2]
    if len(fit_args) >= 2:
        # corresponds to: model.fit(X, y)
        Xy = fit_args[:2]
    elif len(fit_args) == 1:
        # corresponds to: model.fit(X, <y_var_name>=y)
        Xy = fit_args[0], fit_kwargs.get(y_var_name)
    else:
        # corresponds to: model.fit(<X_var_name>=X, <y_var_name>=y)
        Xy = fit_kwargs[X_var_name], fit_kwargs.get(y_var_name)

    if _SAMPLE_WEIGHT not in fit_arg_names:
        return (*Xy, None)

    sample_weight_index = fit_arg_names.index(_SAMPLE_WEIGHT)
    if len(fit_args) > sample_weight_index:
        # corresponds to: model.fit(X, y, ..., sample_weight)
        sample_weight = fit_args[sample_weight_index]
    elif _SAMPLE_WEIGHT in fit_kwargs:
        # corresponds to: model.fit(X, y, ..., sample_weight=sample_weight)
        sample_weight = fit_kwargs[_SAMPLE_WEIGHT]
    else:
        sample_weight = None

    return (*Xy, sample_weight)


def _get_metric_val(function, y_true, y_pred, sample_weight, **kwargs):
    try:
        arguments = dict(y_true=y_true, y_pred=y_pred, sample_weight=sample_weight, **kwargs)
        metric_value = function(**arguments)
    except Exception:
        return None
    else:
        return metric_value


def _patch_fit(cls):
    @gorilla.patch(cls)
    def fit(self, *args, **kwargs):
        return _fit_and_log(self, cls, *args, **kwargs)
    patch = gorilla.Patch(cls, 'fit', fit, settings=settings)
    gorilla.apply(patch)


for cls in classes:
    _patch_fit(cls)