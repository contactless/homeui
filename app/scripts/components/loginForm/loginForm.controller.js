class LoginFormCtrl {
  //...........................................................................
  constructor ($window, $rootScope, $state, $location,rolesFactory) {
    'ngInject';

    this.rootScope = $rootScope;
    this.localStorage = $window.localStorage;
    this.state = $state;
    this.rolesFactory = rolesFactory;
    this.currentHost = $location.host();

    // this.errors = errors;
    // this.mqttClient = mqttClient;
    // this.whenMqttReady = whenMqttReady;
    // this.ConfigEditorProxy = ConfigEditorProxy;
    // this.uiConfig = uiConfig;
    // this.webuiConfigPath = webuiConfigPath;

    this.loginSettings = {};
    this.loginSettings.host = this.localStorage['host'];
    this.loginSettings.port = this.localStorage['port'];
    this.loginSettings.user = this.localStorage['user'];
    this.loginSettings.password = this.localStorage['password'];
    this.loginSettings.prefix = this.localStorage['prefix'];
    if (this.loginSettings.user || this.loginSettings.password) {
      this.loginSettings.useCredentials = true;
    } else {
      this.loginSettings.useCredentials = false;
    }
  }

  //...........................................................................
  $postLink() {
    let host = this.loginSettings.host;
    let port = this.loginSettings.port;
    let useCredentials = this.loginSettings.useCredentials;
    let user = this.loginSettings.user;
    let password = this.loginSettings.password;
    let prefix = this.loginSettings.prefix;

    if (host) {
      this.host = host;
    } else {
      this.host = this.currentHost;
    }
    if (port) {
      this.port = port;
    } else {
      this.port = '18883';
    }
    if (useCredentials) {
      this.useCredentials = useCredentials;
    } else {
      this.useCredentials = false;
    }
    if (user) {
      this.user = user;
    } else {
      this.user = '';
    }
    if (password) {
      this.password = password;
    } else {
      this.password = '';
    }
    if (prefix) {
      this.prefix = prefix;
    } else {
      this.prefix = '';
    }
  }

  //...........................................................................
  updateLoginSettings() {
    // Update settings in Local Storage
    this.localStorage.setItem('host', this.host);
    this.localStorage.setItem('port', this.port);

    this.localStorage.setItem('prefix', this.prefix);

    if (this.useCredentials) {
      this.localStorage.setItem('user', this.user);
      this.localStorage.setItem('password', this.password);
    } else {
      this.localStorage.setItem('user', '');
      this.localStorage.setItem('password', '');
    }

    // Try to fetch UI config this new settings
    let loginData = {
      host: this.host,
      port: this.port,
      user: this.user,
      password: this.password,
      prefix: this.prefix
    };

    this.rolesFactory.setRole(1);
    this.rootScope.requestConfig(loginData);
    location.reload();
  }
}

//-----------------------------------------------------------------------------
export default LoginFormCtrl;
