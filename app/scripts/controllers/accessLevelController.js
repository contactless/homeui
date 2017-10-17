/**
 * Created by ozknemoy on 21.06.2017.
 */

export default class accessLevelController {
    constructor($timeout,rolesFactory) {
        'ngInject';

        this.$timeout = $timeout;

        this.isLevelUp = false;
        this.one = rolesFactory.ROLES[0];
        this.two = rolesFactory.ROLES[1];
        this.three = rolesFactory.ROLES[2];
        this.rolesFactory = rolesFactory;
        this.activeRole = rolesFactory.current.role;
        this.level = '' + rolesFactory.getRole();
        this.type = {id: +this.level};
    }

    select(newType) {
        this.ok = false;
        if(newType.id > this.type.id) {
            this.isLevelUp = true;
        } else {
            this.isLevelUp = false;
            this.type = newType;
        }
    }

    apply() {
        this.rolesFactory.setRole(this.level);
        this.activeRole = this.level;
    }
}