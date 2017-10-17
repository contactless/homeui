class FirmwareCtrl {
  constructor($scope, $timeout, Upload, mqttClient, whenMqttReady) {
    'ngInject';

    $scope.canUpload = false;
    $scope.done = false;
    $scope.uploading = false;
    $scope.running = false;
    $scope.error = null;

    var log = $('#firmwareLog');

    var showState = function(type, msg) {
      if ($scope.progress == 0) {
        $scope.progress = 100;
      }
      $scope.stateType = type;
      $scope.stateMsg = msg;
    };

    var showDoneButton = function(msg) {
      $scope.doneLabel = msg;
      $scope.done = true;
    };

    var timeout = undefined;

    var setTimeout = function(seconds, msg) {
      $scope.running = true;
      if (timeout) {
        $timeout.cancel(timeout)
      }
      timeout = $timeout(function() {
        timeout = undefined;
        showState('danger', msg);
        showDoneButton('Dismiss');
      }, seconds * 1000);
    };

    var setProgressTimeout = function() {
      setTimeout(60, 'Firmware update stalled, something gone wrong')
    };

    mqttClient.addStickySubscription('/firmware/status', function(msg) {
      var p = msg.payload.indexOf(' ');
      var type = (p < 0) ? msg.payload : msg.payload.substr(0, p);
      var payload = (p < 0) ? msg.payload : msg.payload.substr(p+1, msg.payload.length);
      if (type == 'IDLE') {
        $scope.canUpload = true;
        if ($scope.running) {
          $timeout.cancel(timeout);
          if (!$scope.error) {
            showState('success', 'Firmware update complete');
          }
          showDoneButton('Hide');
        }
      } else if (type == 'INFO') {
        showState('info', payload);
        setProgressTimeout();
      } else if (type == 'ERROR') {
        $scope.error = payload;
        showState('danger', payload);
        setProgressTimeout();
      } else if (type == 'REBOOT') {
        showState('warning', 'Rebooting, please wait');
        setTimeout(300, 'It tooks too long to reboot');
      }
    });

    mqttClient.addStickySubscription('/firmware/log', function(msg) {
      log.append(msg.payload + "\n");
      if (log.length) {
        log.scrollTop(log[0].scrollHeight - log.height());
      }
      setProgressTimeout();
    });

    mqttClient.addStickySubscription('/firmware/progress', function(msg) {
      $scope.progress = parseInt(msg.payload);
      setProgressTimeout();
    });

    $scope.upload = function(file) {
      if (file && !file.$error) {
        $scope.uploading = true;
        log.text('');
        showState('info', 'Uploading firmware file');
        file.upload = Upload.upload({
          url: '/fwupdate/upload',
          file: file
        }).progress(function (evt) {
          $scope.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
        })
        .success(function (data, status, headers, config) {
          $scope.uploading = false;
          setProgressTimeout();
          showState('info', 'Upload complete')
        })
        .error(function (data, status, headers, config) {
          $scope.uploading = false;
          showState('error', status + ': ' + data);
          showDoneButton();
        });
      }
    };

    $scope.doneClick = function() {
      $scope.done = $scope.running = $scope.uploading = false;
      $scope.error = null;
    }
  }
}

export default FirmwareCtrl;
