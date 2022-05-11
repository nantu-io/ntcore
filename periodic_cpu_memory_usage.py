import threading, time, os, psutil
from sdk.python.ntcore.monitor.monitor import Monitor
from dotenv import load_dotenv

load_dotenv('./.env')
monitor = Monitor()
endpoint=os.environ["DSP_API_ENDPOINT"]
workspace_id=os.environ["DSP_WORKSPACE_ID"]
version=os.environ["DSP_MODEL_VERSION"]

template = "http://{endpoint}/dsp/api/v1/workspace/{workspaceId}/model/{version}"

url = template.format(endpoint=endpoint, workspaceId=workspace_id, version=version)

def periodic_call_volume_and_latency():
    '''
    peridically call the volume and latency
    
    '''
    
    # provide cpu usage 
    monitor.add_metric(workspace_id, name="cpu usage", value=psutil.cpu_percent(4.0))
    # provide memory usage
    monitor.add_metric(workspace_id, name="memory usage", value=psutil.virtual_memory()[2])
    thread = threading.Thread(target=periodic_call_volume_and_latency)
    thread.setDaemon(True)
    print(time.ctime())
    threading.Timer(60, periodic_call_volume_and_latency).start()
    
if __name__ == "__main__":
    periodic_call_volume_and_latency()