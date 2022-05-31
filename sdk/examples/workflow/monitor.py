from ntcore.monitor import Monitor, service_metrics
import time

monitor = Monitor("CAHCEWM6X6PN2HADX7TR138XB8")

@service_metrics(monitor)
def predict():
    monitor.log('This is a test.')
    time.sleep(2)
    return 1

predict()