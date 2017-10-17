/**
 * Created by ozknemoy on 21.06.2017.
 */

export default class MQTTChannelsCtrl {

    constructor(DeviceData,uiConfig) {
        'ngInject';

        this.DeviceData = DeviceData;

        uiConfig.whenReady().then(data => {
            this.keys = Object.keys(DeviceData.devices).sort();
        })
    }

    getRows() {
        if(!this.DeviceData || !this.keys) return [];
        this.rows = [];
        this.keys.forEach(key=> {
            if(this.DeviceData.devices[key].cellIds.length) {
                this.DeviceData.devices[key].cellIds.forEach(id=> {
                    this.rows.push(this.DeviceData.cell(id))
                })
            }
        });
        return this.rows
    }

}
