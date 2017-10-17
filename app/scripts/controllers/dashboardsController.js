class DashboardsCtrl {
  constructor(uiConfig,rolesFactory) {
    'ngInject';
    
    this.roles = rolesFactory;
    this.uiConfig = uiConfig;
    this.data = uiConfig.data;
    // FIXME: make better use of the model
    this.model = (dashboard) => {this.uiConfig.getDashboard(dashboard.id)};
  }

//.............................................................................
  addDashboard() {
    this.uiConfig.addDashboard();
  }

  addDashboardWithSvg() {
    this.uiConfig.addDashboardWithSvg();
  }

  deleteDashboard(dashbrd) {
  this.data.dashboards = this.data.dashboards
      .filter(dashboard => !(dashboard.name === dashbrd.name && dashboard.id === dashbrd.id));
  };

//.............................................................................
  checkNonEmpty(value, msg) {
    if (!/\S/.test(value)) return msg;
    return true;
  };

//.............................................................................
  cancel(dashboard) {
    if (dashboard.isNew)
      this.model(dashboard).remove();
  };

//.............................................................................
  checkId(value, dashboard) {
    var r = this.checkNonEmpty(value, "Empty dashboard id is not allowed");
    if (r !== true)
      return r;
    value = value.replace(/^\s+|\s+$/g, "");
    return this.data.dashboards.some(function (otherDashboard) {
      return otherDashboard !== dashboard && otherDashboard.id == value;
    }) ? "Duplicate dashboard ids are not allowed" : true;
  };

//.............................................................................
  afterSave(dashboard) {
    delete dashboard.isNew;
  };

  // TBD: add uiconfig methods to save/revert dashboards
}

//-----------------------------------------------------------------------------
export default angular
    .module('homeuiApp.dashboards', [])
    .controller('DashboardsCtrl', DashboardsCtrl);
