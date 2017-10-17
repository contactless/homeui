class NavigationCtrl {
  constructor($scope, $location, EditorProxy, ConfigEditorProxy, mqttClient, whenMqttReady, errors, uiConfig, rolesFactory) {
    'ngInject';

    $scope.roles = rolesFactory;

    $scope.isActive = function(viewLocation){
      return viewLocation === $location.path();
    };

    $scope.dashboards = () => {
      return uiConfig.data.dashboards.filter(dashboard => !dashboard.isNew);
    };

    $scope.isConnected = function () {
      return mqttClient.isConnected();
    };

    var scripts = [], rules = [], devices = [], configs = [],
        needToLoadScripts = false,
        needToLoadConfigs = false;

    whenMqttReady().then(function () {
      needToLoadScripts = needToLoadConfigs = true;
      mqttClient.subscribe("/wbrules/updates/+", function () {
        needToLoadScripts = true;
      });
    });

    $scope.getScripts = function () {
      if (needToLoadScripts) {
        needToLoadScripts = false;
        EditorProxy.List().then(function (result) {
          scripts = result;
          rules = this.collectLocs(scripts, "rules");
          devices = this.collectLocs(scripts, "devices");
        }).catch(errors.catch("Error listing the scripts"));
      }
      return scripts;
    };

    $scope.getRules = function getRules () {
      this.getScripts();
      return rules;
    };

    $scope.getVirtualDevices = function getVirtualDevices () {
      this.getScripts();
      return devices;
    };

    $scope.getConfigs = function () {
      if (needToLoadConfigs) {
        needToLoadConfigs = false;
        ConfigEditorProxy.List().then(function (result) {
          configs = result;
        }).catch(errors.catch("Error listing the configs"));
      }
      return configs;
    };
  }

//-----------------------------------------------------------------------------
  collectLocs(scripts, member) {
    var m = {};
    scripts.forEach(function (script) {
      (script[member] || []).forEach(function (loc) {
        m[loc.name] = {
          virtualPath: script.virtualPath,
          name: loc.name,
          line: loc.line
        };
      });
    });
    var r = [];
    Object.keys(m).sort().forEach(function (name) {
      r.push(m[name]);
    });
    return r;
  }
}

//-----------------------------------------------------------------------------
export default NavigationCtrl;
