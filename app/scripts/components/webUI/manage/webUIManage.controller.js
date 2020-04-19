'use strict';

class WebUIManageController {
    
    constructor ($scope, $window, $state, $translate, $ngBootbox, rolesFactory, webUIService) {
        'ngInject';

        this.$scope = $scope;
        this.$window = $window;
        this.$state = $state;
        this.$translate = $translate;
        this.$ngBootbox = $ngBootbox;
        this.rolesFactory = rolesFactory;
        this.service = webUIService;
        
        this.accounts = webUIService.accounts;
        this.current = webUIService.current;
        this.editable = null;

        this.isMultiple = process.env.WEBUI_MULTIPLE === 'true';
        if (!this.isMultiple) {
            this.editable = this.current;
        }
        else if ($state.current.name === 'webUIAdd') {
            this.create();
        }

        $scope.$watch('$ctrl.service.getCurrent()', (newValue, oldValue) => {
            if (newValue !== oldValue) {
                this.current = newValue;
            }
        });
    }

    create() {
        this.editable = this.service.create();
    }

    update(account) {
        this.editable = account;
    }

    remove(account) {
        this.$translate('webUI.manager.prompt.remove', { name: account.name }).then((translation) => {
            this.$ngBootbox.confirm(translation).then(() => {
                this.service.remove(account);
            });
        });
    }

    save() {
        this.service.save(this.editable);

        if (this.editable === this.current) {
            this.login(this.current);
        }

        if (this.isMultiple) {
            this.cancel();
        }
    }

    cancel() {
        this.editable = null;

        if (this.$state.current.name === 'webUIAdd') {
            this.$state.go('webUI');
        }
    }

    login(account) {
        this.service.login(account);
    }
}

export default WebUIManageController;