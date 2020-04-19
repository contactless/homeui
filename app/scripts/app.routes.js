'use strict';

import uiRouter from 'angular-ui-router';

import homeTemplateUrl from 'ngtemplate-loader?relativeTo=/app!../views/home.html';
import helpTemplateUrl from 'ngtemplate-loader?relativeTo=/app!../views/help.html';
import webUITemplateUrl from 'ngtemplate-loader?relativeTo=/app!../views/web-ui.html';
import systemTemplateUrl from 'ngtemplate-loader?relativeTo=/app!../views/system.html';
import MQTTChannelsTemplateUrl from 'ngtemplate-loader?relativeTo=/app!../views/MQTTChannels.html';
import accessLevelTemplateUrl from 'ngtemplate-loader?relativeTo=/app!../views/access-level.html';
import devicesTemplateUrl from 'ngtemplate-loader?relativeTo=/app!../views/devices.html';
import widgetsTemplateUrl from 'ngtemplate-loader?relativeTo=/app!../views/widgets.html';
import dashboardsTemplateUrl from 'ngtemplate-loader?relativeTo=/app!../views/dashboards.html';
import dashboardTemplateUrl from 'ngtemplate-loader?relativeTo=/app!../views/dashboard.html';
import dashboardSvgTemplateUrl from 'ngtemplate-loader?relativeTo=/app!../views/dashboard-svg.html';
import dashboardSvgEditTemplateUrl from 'ngtemplate-loader?relativeTo=/app!../views/dashboard-svg-edit.html';
import settingsTemplateUrl from 'ngtemplate-loader?relativeTo=/app!../views/settings.html';
import loginTemplateUrl from 'ngtemplate-loader?relativeTo=/app!../views/login.html';
import scriptsTemplateUrl from 'ngtemplate-loader?relativeTo=/app!../views/scripts.html';
import scriptTemplateUrl from 'ngtemplate-loader?relativeTo=/app!../views/script.html';
import historyTemplateUrl from 'ngtemplate-loader?relativeTo=/app!../views/history.html';
import configsTemplateUrl from 'ngtemplate-loader?relativeTo=/app!../views/configs.html';
import configTemplateUrl from 'ngtemplate-loader?relativeTo=/app!../views/config.html';

function routing($stateProvider,  $locationProvider, $urlRouterProvider) {
  'ngInject';

  // use the HTML5 History API
  $locationProvider.html5Mode(false);
  $locationProvider.hashPrefix('!');
  $urlRouterProvider.otherwise('/');

  $stateProvider
  //...........................................................................
    .state('home', {
      url: '/',
      templateUrl: homeTemplateUrl,
      controller: 'HomeCtrl as $ctrl'
    })
      .state('help', {
          url: '/help',
          templateUrl: helpTemplateUrl,
          controller: 'HelpCtrl as $ctrl'
      })
      .state('webUI', {
          url: '/web-ui',
          templateUrl: webUITemplateUrl,
          controller: 'WebUICtrl as $ctrl'
      })
      .state('webUIAdd', {
        url: '/web-ui/add',
        templateUrl: webUITemplateUrl,
        controller: 'WebUICtrl as $ctrl'
      })
      .state('system', {
          url: '/system',
          templateUrl: systemTemplateUrl,
          controller: 'SystemCtrl as $ctrl'
      })
      .state('MQTTChannels', {
          url: '/MQTTChannels',
          templateUrl: MQTTChannelsTemplateUrl,
          controller: 'MQTTCtrl as $ctrl'
      })
      .state('accessLevel', {
          url: '/access-level',
          templateUrl: accessLevelTemplateUrl,
          controller: 'AccessLevelCtrl as $ctrl'
      })
  //...........................................................................
    .state('devices', {
      url: '/devices',
      controller: 'DevicesCtrl as $ctrl',
      templateUrl: devicesTemplateUrl,
      resolve: {
        ctrl: ($q, $ocLazyLoad) => {
          'ngInject';
          let deferred = $q.defer();
          require.ensure(
            [], 
            (require) => {
              let module = require('./controllers/devicesController.js');
              $ocLazyLoad.load({
                name: module.default.name
              })
              .then(() => {
                deferred.resolve(module);
              });
            },
            'devices'
          );
          return deferred.promise;
        }
      }
    })
  //...........................................................................
  .state('currentDevices', {
    url: '/devices/{deviceId}',
    controller: 'DevicesCtrl as $ctrl',
    templateUrl: devicesTemplateUrl,
    resolve: {
      ctrl: ($q, $ocLazyLoad) => {
        'ngInject';
        let deferred = $q.defer();
        require.ensure(
          [], 
          (require) => {
            let module = require('./controllers/devicesController.js');
            $ocLazyLoad.load({
              name: module.default.name
            })
            .then(() => {
              deferred.resolve(module);
            });
          },
          'devices'
        );
        return deferred.promise;
      }
    }
  })
//...........................................................................
    .state('widgets', {
      url: '/widgets',
      controller: 'WidgetsCtrl as $ctrl',
      templateUrl: widgetsTemplateUrl,
      resolve: {
        ctrl: ($q, $ocLazyLoad) => {
          'ngInject';
          let deferred = $q.defer();
          require.ensure(
            [], 
            (require) => {
              let module = require('./controllers/widgetsController.js');
              $ocLazyLoad.load({
                name: module.default.name
              })
              .then(() => {
                deferred.resolve(module);
              });
            },
            'widgets'
          );
          return deferred.promise;
        }
      }
    })
  //...........................................................................
    .state('dashboards', {
      url: '/dashboards',
      controller: 'DashboardsCtrl as $ctrl',
      templateUrl: dashboardsTemplateUrl,
      resolve: {
        ctrl: ($q, $ocLazyLoad) => {
          'ngInject';
          let deferred = $q.defer();
          require.ensure(
            [], 
            (require) => {
              let module = require('./controllers/dashboardsController.js');
              $ocLazyLoad.load({
                name: module.default.name
              })
              .then(() => {
                deferred.resolve(module);
              });
            },
            'dashboards'
          );
          return deferred.promise;
        }
      }
    })
  //...........................................................................
    .state('dashboard', {
      url: '/dashboards/{id}',
      controller: 'DashboardCtrl as $ctrl',
      templateUrl: dashboardTemplateUrl,
      resolve: {
        ctrl: ($q, $ocLazyLoad) => {
          'ngInject';
          let deferred = $q.defer();
          require.ensure(
            [], 
            (require) => {
              let module = require('./controllers/dashboardController.js');
              $ocLazyLoad.load({
                name: module.default.name
              })
              .then(() => {
                deferred.resolve(module);
              });
            },
            'dashboard'
          );
          return deferred.promise;
        }
      }
    })
  //...........................................................................
  .state('dashboard-svg', {
    url: '/dashboards/svg/view/{id}',
    controller: 'DashboardSvgCtrl as $ctrl',
    templateUrl: dashboardSvgTemplateUrl,
    resolve: {
      ctrl: ($q, $ocLazyLoad) => {
        'ngInject';
        let deferred = $q.defer();
        require.ensure(
          [], 
          (require) => {
            let module = require('./controllers/dashboardSvgController.js');
            $ocLazyLoad.load({
              name: module.default.name
            })
            .then(() => {
              deferred.resolve(module);
            });
          },
          'dashboard-svg'
        );
        return deferred.promise;
      }
    }
  })    
  //...........................................................................
    .state('dashboard-svg-add', {
      url: '/dashboards/svg/add',
      controller: 'DashboardSvgEditCtrl as $ctrl',
      templateUrl: dashboardSvgEditTemplateUrl,
      resolve: {
        ctrl: ($q, $ocLazyLoad) => {
          'ngInject';
          let deferred = $q.defer();
          require.ensure(
            [], 
            (require) => {
              let module = require('./controllers/dashboardSvgEditController.js');
              $ocLazyLoad.load({
                name: module.default.name
              })
              .then(() => {
                deferred.resolve(module);
              });
            },
            'dashboard-svg-add'
          );
          return deferred.promise;
        }
      }
    })  
  //...........................................................................
    .state('dashboard-svg-edit', {
      url: '/dashboards/svg/edit/{id}',
      controller: 'DashboardSvgEditCtrl as $ctrl',
      templateUrl: dashboardSvgEditTemplateUrl,
      resolve: {
        ctrl: ($q, $ocLazyLoad) => {
          'ngInject';
          let deferred = $q.defer();
          require.ensure(
            [], 
            (require) => {
              let module = require('./controllers/dashboardSvgEditController.js');
              $ocLazyLoad.load({
                name: module.default.name
              })
              .then(() => {
                deferred.resolve(module);
              });
            },
            'dashboard-svg-edit'
          );
          return deferred.promise;
        }
      }
    })  
  //...........................................................................
    .state('settings', {
      url: '/settings',
      controller: 'SettingCtrl as $ctrl',
      templateUrl: settingsTemplateUrl,
      resolve: {
        ctrl: ($q, $ocLazyLoad) => {
          'ngInject';
          let deferred = $q.defer();
          require.ensure(
            [], 
            (require) => {
              let module = require('./controllers/settingController.js');
              $ocLazyLoad.load({
                name: module.default.name
              })
              .then(() => {
                deferred.resolve(module);
              });
            },
            'settings'
          );
          return deferred.promise;
        }
      }
    })
  //...........................................................................
    .state('login', {
      url: '/login/{id}',
      templateUrl: loginTemplateUrl,
      controller: 'LoginCtrl as $ctrl'
    })
  //...........................................................................
    .state('rules', {
      url: '/rules',
      controller: 'ScriptsCtrl as $ctrl',
      templateUrl: scriptsTemplateUrl,
      resolve: {
        ctrl: ($q, $ocLazyLoad) => {
          'ngInject';
          let deferred = $q.defer();
          require.ensure(
            [], 
            (require) => {
              let module = require('./controllers/scriptsController.js');
              $ocLazyLoad.load({
                name: module.default.name
              })
              .then(() => {
                deferred.resolve(module);
              });
            },
            'rules'
          );
          return deferred.promise;
        }
      }
    })
  //...........................................................................
    .state('rules.edit', {
      url: '/edit/{path:.*}',
      templateUrl: scriptTemplateUrl,
      controller: 'ScriptCtrl as $ctrl',
      resolve: {
        ctrl: ($q, $ocLazyLoad) => {
          'ngInject';
          let deferred_1 = $q.defer();
          let deferred_2 = $q.defer();
          require.ensure(
            [], 
            (require) => {
              let module_1 = require('./controllers/scriptController.js');
              $ocLazyLoad.load({
                name: module_1.default.name
              })
              .then(() => {
                deferred_1.resolve(module_1);
              });

              let module_2 = require('../lib/angular-ui-codemirror/src/ui-codemirror.js');
              $ocLazyLoad.load({
                name: 'ui.codemirror'
              })
              .then(() => {
                deferred_2.resolve(module_2);
              });
            },
            'rules-edit'
          );
          return $q.all([deferred_1.promise, deferred_2.promise]);
        }
      }
    })
  //...........................................................................
    .state('rules.new', {
      url: '/new',
      templateUrl: scriptTemplateUrl,
      controller: 'ScriptCtrl as $ctrl',
      resolve: {
        ctrl: ($q, $ocLazyLoad) => {
          'ngInject';
          let deferred_1 = $q.defer();
          let deferred_2 = $q.defer();
          require.ensure(
            [], 
            (require) => {
              let module_1 = require('./controllers/scriptController.js');
              $ocLazyLoad.load({
                name: module_1.default.name
              })
              .then(() => {
                deferred_1.resolve(module_1);
              });

              let module_2 = require('../lib/angular-ui-codemirror/src/ui-codemirror.js');
              $ocLazyLoad.load({
                name: 'ui.codemirror'
              })
              .then(() => {
                deferred_2.resolve(module_2);
              });
            },
            'rules-new'
          );
          return $q.all([deferred_1.promise, deferred_2.promise]);
        }
      }
    })
  //...........................................................................
    .state('history', {
      url: '/history',
      controller: 'HistoryCtrl as $ctrl',
      templateUrl: historyTemplateUrl,
      resolve: {
        ctrl: ($q, $ocLazyLoad) => {
          'ngInject';
          let deferred_1 = $q.defer();
          require.ensure(
            [],
            (require) => {
              let module_1 = require('./controllers/historyController.js');
              $ocLazyLoad.load({
                name: module_1.default.name,
              })
              .then(() => {
                deferred_1.resolve(module_1);
              });


            }, 
            'history'
          );
         return deferred_1.promise
      }}
    })
  //...........................................................................
    .state('history.sample', {
      url: '/{device}/{control}/{start}/{end}',
      templateUrl: historyTemplateUrl,
      controller: 'HistoryCtrl as $ctrl',
      resolve: {
          /*load: ['$ocLazyLoad', function($ocLazyLoad) {
              return $ocLazyLoad.load(['plotly','historyController'])
          }],*/
        ctrl: ($q, $ocLazyLoad) => {
            'ngInject';
            let deferred_1 = $q.defer();
            require.ensure(
                [],
                (require) => {
                    let module_1 = require('./controllers/historyController.js');
                    $ocLazyLoad.load({
                            name: module_1.default.name,
                        })
                        .then(() => {
                            deferred_1.resolve(module_1);
                        });


                },
                'history'
            );
            return deferred_1.promise
        }
      }
    })
  //...........................................................................
    .state('configs', {
      url: '/configs',
      controller: 'ConfigsCtrl as $ctrl',
      templateUrl: configsTemplateUrl,
      resolve: {
        ctrl: ($q, $ocLazyLoad) => {
          'ngInject';
          let deferred = $q.defer();
          require.ensure(
            [], 
            (require) => {
              let module = require('./controllers/configsController.js');
              $ocLazyLoad.load({
                name: module.default.name
              })
              .then(() => {
                deferred.resolve(module);
              });
            },
            'configs'
          );
          return deferred.promise;
        }
      }
    })

  //...........................................................................
    .state('configEdit', {
      url: '/configs/edit/{path:.*}',
      controller: 'ConfigCtrl as $ctrl',
      templateUrl: configTemplateUrl,
      resolve: {
        ctrl: ($q, $ocLazyLoad) => {
          'ngInject';
          let deferred = $q.defer();
          require.ensure(
            [], 
            (require) => {
              let module = require('./controllers/configController.js');
              $ocLazyLoad.load({
                name: module.default.name
              })
              .then(() => {
                deferred.resolve(module);
                });
            },
            'config-edit'
          );
          return deferred.promise;
        }
      }
    });
};

//-----------------------------------------------------------------------------
export default angular
  .module('homeuiApp.routing', [uiRouter])
  .config(routing)
  .name;
