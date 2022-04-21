import gorilla
from .utils import get_pretraining_metadata, get_posttraining_metadata, get_estimators_to_patch

def _patch_fit(module, method_name):
    '''
    Patches fit, fit_transform and fit_predict from sklearn estimators.
    '''
    @gorilla.patch(module)
    def __fit(self, *args, experiment=None, **kwargs):
        original = gorilla.get_original_attribute(module, method_name)
        fit_output = original(self, *args, **kwargs)
        if experiment is not None:
            pretraining_metadata = get_pretraining_metadata(self, *args, **kwargs)
            posttraining_metadata = get_posttraining_metadata(self, *args, **kwargs)
            experiment.pretraining_metadata = pretraining_metadata
            experiment.posttraining_metadata = posttraining_metadata
            experiment.serializable_model = self
            experiment.save()
        return fit_output

    patch = gorilla.Patch(module, method_name, __fit, settings=gorilla.Settings(allow_hit=True))
    gorilla.apply(patch)

for class_def in get_estimators_to_patch():
    # Patch fitting methods
    for method_name in ["fit", "fit_transform", "fit_predict"]:
        _patch_fit(class_def, method_name)