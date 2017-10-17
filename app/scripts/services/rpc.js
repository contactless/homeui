import mqttServiceModule from './mqttService';

//-----------------------------------------------------------------------------
const mqttRpcServiceModule = angular
  .module('homeuiApp.MqttRpc', [mqttServiceModule])
  .value("mqttRpcTimeout", 30000)
  .factory("MqttRpc", mqttRpc)
  .name;

//-----------------------------------------------------------------------------
function mqttRpc($q, $rootScope, $timeout, mqttClient, mqttRpcTimeout, Spinner) {
  'ngInject';

  var disconnectedError = {
    data: "MqttConnectionError",
    message: "MQTT client is not connected"
  };

  var timeoutError = {
    data: "MqttTimeoutError",
    message: "MQTT RPC request timed out"
  };

  var nextId = 1,
      inflight = {},
      watchStopper = null,
      subs = Object.create(null);

//.............................................................................
  function invokeResponseHandler (id, topic, reply) {
    try {
      inflight[id](topic, reply);
    } finally {
      delete inflight[id];
      maybeStopWatching();
    }
  };

//.............................................................................
  function handleDisconnection () {
    Object.keys(inflight).sort().forEach(callId => {
      invokeResponseHandler(callId, null, {
        error: disconnectedError
      });
    });
    if (Object.keys(inflight).length)
      throw new Error("Proxy._handleDisconnection(): pending requests remained");
    maybeStopWatching();
  };

//.............................................................................
  function maybeStartWatching () {
    if (watchStopper !== null)
      return;
    watchStopper = $rootScope.$watch(
      () => mqttClient.isConnected(),
      connected => {
        if (!connected)
          handleDisconnection();
      });
  };

//.............................................................................
  function maybeStopWatching () {
    if (Object.keys(inflight).length || !watchStopper)
      return;
    watchStopper();
    watchStopper = null;
  };

//.............................................................................
  function handleMessage (msg) {
    try {
      var parsed = JSON.parse(msg.payload);
    } catch (e) {
      console.error("cannot parse MQTT RPC response: %o", msg);
      return;
    }
    if (!parsed.hasOwnProperty("id")) {
      console.error("MQTT response without id: %o", msg);
      return;
    }
    if (!inflight.hasOwnProperty(parsed.id)) {
      console.error("MQTT response with unexpected id: %o", msg);
      return;
    }
    invokeResponseHandler(parsed.id, msg.topic, parsed);
  }

//.............................................................................
  function ensureSubscription (topic) {
    if (subs[topic])
      return;
    subs[topic] = true;
    mqttClient.addStickySubscription(topic, handleMessage);
  }

//-----------------------------------------------------------------------------
  class Proxy {
//.............................................................................
    constructor (target, spinnerIdPrefix) {
      this._prefix = "/rpc/v1/" + target + "/";
      this._watchStopper = null;
      this._spinnerIdPrefix = spinnerIdPrefix || "mqttRpc";
    }

//.............................................................................
    _init () {
      ensureSubscription(this._prefix + "+/" + mqttClient.getID() + "/reply");
    }

//.............................................................................
    _call (method, params) {
      this._init();
      maybeStartWatching();
      return $q((resolve, reject) => {
        if (!mqttClient.isConnected()) {
          reject(disconnectedError);
          return;
        }
        var callId = nextId++;
        var topic = this._prefix + method + "/" + mqttClient.getID();
        mqttClient.send(
          topic,
          JSON.stringify({
            id: callId,
            params: params || {}
          }),
          false);
        var timeout = $timeout(invokeResponseHandler.bind(null, callId, null, {
          error: timeoutError
        }), mqttRpcTimeout);

        Spinner.start(this._spinnerIdPrefix, callId);
        inflight[callId] = (actualTopic, reply) => {
          Spinner.stop(this._spinnerIdPrefix, callId);
          $timeout.cancel(timeout);
          if (actualTopic !== null && actualTopic != topic + "/reply")
            reject("unexpected response topic " + actualTopic);
          else if (reply.hasOwnProperty("error") && reply.error !== null)
            reject(reply.error);
          else
            resolve(reply.result);
        };
      });
    }
  }

//-----------------------------------------------------------------------------
  return {
    getProxy (target, methods, spinnerIdPrefix) {
      var proxy = new Proxy(target, spinnerIdPrefix),
          outer = Object.create(proxy);
      methods.forEach(method => {
        outer[method] = proxy._call.bind(proxy, method);
      });
      return outer;
    }
  };
}

//-----------------------------------------------------------------------------
export default mqttRpcServiceModule;

