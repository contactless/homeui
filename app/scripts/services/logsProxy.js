function logsProxyService(MqttRpc) {
  'ngInject';

  return MqttRpc.getProxy("wb_logs/logs", [
    "Load",
    "List"
  ], "logsProxy");
}

export default logsProxyService;
