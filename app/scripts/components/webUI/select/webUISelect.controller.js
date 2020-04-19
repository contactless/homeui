'use strict';

class AccountSelectController {
    
    constructor ($scope, $element, $state, $location, $translate, rolesFactory, webUIService) {
        'ngInject';

        this.$scope = $scope;
        this.$element = $element;
        this.$translate = $translate;
        this.$state = $state;
        this.rolesFactory = rolesFactory;
        this.service = webUIService;
        
        this.accounts = webUIService.accounts;
        this.current = webUIService.current;
        
        this.accountAdd = {
            'name': 'Add service'
        };

        this.isMultiple = process.env.WEBUI_MULTIPLE === 'true';

        $scope.$watch('$ctrl.current', (newValue, oldValue) => {
            if (newValue !== oldValue) {
                if (oldValue === this.accountAdd) {
                    return;
                }
                else if (newValue === this.accountAdd) {
                    this.current = webUIService.current;
                    $state.go('webUIAdd');
                }
                else {
                    this.login(newValue);
                }
            }
        });
        
        this.$translate('webUI.select.button.add').then((translation) => {
            this.accountAdd.name = translation;
        });
    }

    items() {
        return this.accounts.concat(this.accountAdd);
    }

    login(account) {
        this.service.login(account);
    }

    tagHelper(tag) {
        return null;
    }
}

export default AccountSelectController;