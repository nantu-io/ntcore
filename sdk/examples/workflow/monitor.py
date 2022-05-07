from ntcore.monitor import Monitor

monitor = Monitor(server="http://localhost:8180")
future = monitor.add_metric('CAHCEWM6X6PN2HADX7TR138XB8', 'test', 1.0)
# Wait for the request.
print(future.result())