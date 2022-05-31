import time
from functools import wraps

def service_metrics(monitor):
    """
    Decorator for publishing service metrics.
    """
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            start_time = round(time.time() * 1000)
            res = None
            try:
                res = fn(*args, **kwargs), 200
                monitor.add_metric("Success", 1.0)
            except Exception as e:
                monitor.add_metric("Error", 1.0)
                res = {"error": str(e)}, 403
            finally:
                monitor.add_metric("Latency", round(time.time() * 1000) - start_time)
            return res
        return decorator
    
    return wrapper