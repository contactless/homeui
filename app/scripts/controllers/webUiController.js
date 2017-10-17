/**
 * Created by ozknemoy on 21.06.2017.
 */

export default class WebUICtrl {
    constructor(uiConfig, errors, rolesFactory) {
        'ngInject';

        this.rolesFactory = rolesFactory;
        uiConfig.whenReady()
            .then((data) => {
                this.dashboards = data.dashboards;
                this.widgets = data.widgets;
                this.defaultDashboard = uiConfig.getDashboard(data.defaultDashboardId);
            })
            .catch(errors.catch('Error loading WebUI config'));
    }

    changeDefaultDashboard() {
        let id = this.defaultDashboard ? this.defaultDashboard.id : '';
        this.uiConfig.setDefaultDashboard(id);
    };

}