const mqttServiceModule = angular
  .module('homeuiApp.mqttServiceModule', [])
  .factory('whenMqttReady', whenMqttReady)
  .factory('topicMatches', topicMatches)
  .value("mqttConnectTimeout", 15000)
  .value("mqttReconnectDelay", 1500)
  .value("mqttDigestInterval", 250)
  .factory('mqttClient', mqttClient)
  .name;

//-----------------------------------------------------------------------------
function whenMqttReady($q, $rootScope, mqttClient) {
  'ngInject';
  return () => {
    var deferred = $q.defer();
    if (mqttClient.isConnected())
      deferred.resolve();
    else {
      var unwatch = $rootScope.$watch(
        () => mqttClient.isConnected(),
        newValue => {
          if (!newValue) { // Resolve only when connection is established
            return;
          }
          deferred.resolve();
          unwatch();
        });
    }
    return deferred.promise;
  };
}

//-----------------------------------------------------------------------------
function topicMatches() {
  return (pattern, topic) => {
    function match (patternParts, topicParts) {
      if (!patternParts.length)
        return !topicParts.length;
      if (patternParts[0] == "#") {
        if (patternParts.length != 1)
          throw new Error("invalid pattern");
        return true;
      }
      if (!topicParts.length)
        return false;
      if (patternParts[0] != "+" && topicParts[0] != patternParts[0])
        return false;
      return match(patternParts.slice(1), topicParts.slice(1));
    }
    return match(pattern.split("/"), topic.split("/"));
  };
}

//-----------------------------------------------------------------------------
function mqttClient($window, $rootScope, $timeout, topicMatches,mqttConnectTimeout, 
                    mqttReconnectDelay, mqttDigestInterval, errors) {
  'ngInject';
  var globalPrefix = '',
      service = {},
      client = {},
      id = '',
      connected = false,
      showConnectError = false,
      connectOptions,
      reconnectTimeout = null,
      callbackMap = Object.create(null),
      stickySubscriptions = [],
      messageDigestTimer = null;

  if($window.localStorage['prefix'] === 'true')
    globalPrefix = '/client/' + $window.localStorage['user'];

  //...........................................................................
  function reconnectAfterTimeout() {
    if (reconnectTimeout) { // debounce
      $timeout.cancel(reconnectTimeout);
    }
    reconnectTimeout = $timeout(() => {
      console.log("reconnect timer fired");
      reconnectTimeout = null;
      client.connect(angular.copy(connectOptions));
    }, mqttReconnectDelay);
  }

  //...........................................................................
  function clearReconnectTimeout() {
    if (reconnectTimeout !== null)
      $timeout.cancel(reconnectTimeout);
  }

  //...........................................................................
  service.connect = function(host, port, clientid, user, password) {
    clearReconnectTimeout();

    connectOptions = {
      onSuccess: service.onConnect.bind(service),
      onFailure: service.onFailure.bind(service),
      timeout: mqttConnectTimeout / 1000
    };

    if(user && password) {
      connectOptions.userName = user;
      connectOptions.password = password;
    }

    id = clientid;
    console.log("Try to connect to MQTT Broker on " + host + ":" + port + " with username " + user + " and clientid " + clientid);

    client = new Paho.MQTT.Client(host, parseInt(port), '/mqtt', clientid);
    client.onConnectionLost = service.onConnectionLost;
    client.onMessageDelivered = service.onMessageDelivered;
    client.onMessageArrived = service.onMessageArrived;

    client.connect(angular.copy(connectOptions));
  };

  //...........................................................................
  service.getID = function getID () {
    return id;
  };

  //...........................................................................
  service.onConnect = function() {
    // если была показана ошибка соединения то очищаю
    if(showConnectError) errors.hideError();
    if (connected) {
      return;
    }
    connected = true;

    console.log("Connected to " + client.host + ":" + client.port + " as '" + client.clientId + "'");
    if(globalPrefix != '') console.log('With globalPrefix: ' + globalPrefix);

    client.subscribe(globalPrefix + "/devices/#");
    client.subscribe(globalPrefix + "/config/widgets/#");
    client.subscribe(globalPrefix + "/config/dashboards/#");

    stickySubscriptions.forEach(function (item) {
      this.subscribe(item.topic, item.callback);
    }, this);
  };

  //...........................................................................
  service.onFailure = function(context) {
    connected = false;
    // ставлю флаг что ошибка показана чтобы позже при коннекте
    // почистить именно ее а не другую ошику
    showConnectError = true;
    var m = "Failure to connect to " + client.host + ":" + client.port +
        " as " + client.clientId + ". error code " + context.errorCode +
        ", error message \"" + context.errorMessage + "\"";
    errors.showError(m);
    reconnectAfterTimeout();
  };

  //...........................................................................
  service.publish = function(topic, payload) {
    if (!connected) {
      // FIXME: should fail hard here
      console.error("can't publish(): disconnected");
      return;
    }
    client.publish(topic, payload, {retain: true});
    console.log('publish-Event sent '+ payload + ' with topic: ' + topic + ' ' + client);
  };

  //...........................................................................
  service.subscribe = function (topic, callback) {
    if (!connected) {
      // FIXME: should fail hard here
      console.error("can't subscribe(): disconnected");
      return;
    }
    // !!! XXX: FIXME !!!
    // { qos: 2 } subscribe option was triggering some bug inside
    // mosquitto that caused MQTT RPC reply subscriptions to be
    // skipped when there were any retained messages to receive.
    // Verified for the case of mosquitto's own MQTT WS bridge.
    client.subscribe(globalPrefix + topic);
    callbackMap[topic] = (callbackMap[topic] || []).concat([callback]);
  };

  //...........................................................................
  service.addStickySubscription = function (topic, callback) {
    stickySubscriptions.push({ topic: topic, callback: callback });
    if (connected)
      this.subscribe(topic, callback);
  };

  // TBD: unsubcribe

  //...........................................................................
  service.onConnectionLost = function (responseObject) {
    connected = false;

    callbackMap = Object.create(null);
    if (responseObject.errorCode != 0) { // not intentionally disconnected
      console.log("Server connection lost: %o", responseObject);
      reconnectAfterTimeout();
    } else {
      console.log("Successfully disconnected");
    }
  };

  //...........................................................................
  service.onMessageDelivered = function(message) {
    console.log("Delivered message: ", JSON.stringify(message));
  };

  //...........................................................................
  service.onMessageArrived = function(message) {
    // console.log("Arrived message: " + message.destinationName + " with " + message.payloadBytes.length + " bytes of payload");
    // console.log("Message: " + String.fromCharCode.apply(null, message.payloadBytes));
    var topic = message.destinationName;
    if (topic.substring(0, globalPrefix.length) == globalPrefix)
      topic = topic.substring(globalPrefix.length);

    Object.keys(callbackMap).sort().forEach(function (pattern) {
      if (!topicMatches(pattern, topic)) {
        return;
      }
      callbackMap[pattern].forEach(function (callback) {
        callback({
          topic: topic,
          payload: message.payloadString,
          qos: message.qos,
          retained: message.retained
        });
      });
    });
    if (!messageDigestTimer)
      messageDigestTimer = $timeout(() => { messageDigestTimer = null; }, mqttDigestInterval);
  };

  //...........................................................................
  service.send = function(destination, payload, retained, qos) {
    //console.log("service.send",destination, payload, retained, qos);

    if (!connected) {
      // FIXME: should fail hard here
      console.error("can't send(): disconnected");
      return;
    }
    var topic = globalPrefix + destination;
    if (payload == null) {
      payload = new ArrayBuffer();
    }
    var message = new Paho.MQTT.Message(payload);
    message.destinationName = topic;
    message.qos = qos === undefined ? 1 : qos;
    if (retained != undefined) {
      message.retained = retained;
    } else {
      message.retained = true;
    }

    client.send(message);
  };

  //...........................................................................
  service.disconnect = function() {
    clearReconnectTimeout();
    callbackMap = Object.create(null);
    if (connected) {
      client.disconnect();
    }
  };

  //...........................................................................
  service.isConnected = () => {
    return connected;
  };

  return service;
}

//-----------------------------------------------------------------------------
export default mqttServiceModule;

