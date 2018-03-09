/**
 * Created by ozknemoy on 21.06.2017.
 */

export default class WebUICtrl {
    constructor(uiConfig, errors, rolesFactory) {
        'ngInject';

        const defaultSettings = {
            mqttTimeout: 30000
        };

        this.rolesFactory = rolesFactory;
        this.uiConfig = uiConfig;

        uiConfig.whenReady()
            .then((data) => {
                this.dashboards = data.dashboards;
                this.widgets = data.widgets;
                this.defaultDashboard = uiConfig.getDashboard(data.defaultDashboardId);
                this.settings = angular.extend(defaultSettings, angular.copy(data.settings));
            })
            .catch(errors.catch('Error loading WebUI config'));
    }

    changeDefaultDashboard() {
        let id = this.defaultDashboard ? this.defaultDashboard.id : '';
        this.uiConfig.setDefaultDashboard(id);
    };

    updateSettings() {
        this.uiConfig.updateSettings(this.settings);
    }

}
