class HomeCtrl {
  constructor(uiConfig,rolesFactory) {
    'ngInject';

    this.roles = rolesFactory;
    uiConfig.whenReady()
    .then((data) => {
      this.dashboard = uiConfig.getDashboard(data.defaultDashboardId);
    });
  }
}

export default HomeCtrl;
