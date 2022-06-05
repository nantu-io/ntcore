from ntcore.monitor import Monitor
import psutil, time, threading

class SystemMetricsPublisher:
    '''
    System metrics publisher.
    '''
    def __init__(self, monitor: Monitor):
        self._monitor = monitor
        self._workspace_id = monitor.get_workspace_id()
        self._last_bytes_sent = psutil.net_io_counters().bytes_sent
        self._last_bytes_recv = psutil.net_io_counters().bytes_recv

    def publish(self):
        '''
        Emit the system metrics to NTCore monitoring service.
        '''
        self._emit_cpu_metrics()
        self._emit_memory_metrics()
        self._emit_network_metrics()

    def _emit_cpu_metrics(self):
        '''
        Emits cpu metrics.
        '''
        self._monitor.add_metric("Cpu", psutil.cpu_percent())

    def _emit_memory_metrics(self):
        '''
        Emits memory metrics.
        '''
        memory_metrics = psutil.virtual_memory()
        self._monitor.add_metric("MemoryUsed", memory_metrics.percent)

    def _emit_network_metrics(self):
        '''
        Emits network metrics.
        '''
        io = psutil.net_io_counters()
        self._monitor.add_metric("BytesSent", io.bytes_sent - self._last_bytes_sent)
        self._monitor.add_metric("BytesRecv", io.bytes_recv - self._last_bytes_recv)
        self._last_bytes_sent = io.bytes_sent
        self._last_bytes_recv = io.bytes_recv


class SystemMetricsPublisherDaemon:
    '''
    Daemon thread to publish system metrics.
    '''
    def __init__(self, monitor: Monitor):
        '''
        Initialize the system metrics publisher.
        '''
        self._system_metrics_publisher = SystemMetricsPublisher(monitor)

    def run(self):
        '''
        Publishes the system metrics every 60 seconds.
        '''
        while True:
            self._system_metrics_publisher.publish()
            time.sleep(60)

    def start(self):
        '''
        Starts the system metrics daemon.
        '''
        thread = threading.Thread(name='publish_sys_metrics', target=self.run)
        thread.setDaemon(True)
        thread.start()