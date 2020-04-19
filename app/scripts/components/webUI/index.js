'use strict';

import webUIManageComponent from './manage/webUIManage.component';
import webUISelectComponent from './select/webUISelect.component';
import webUIService from './services/webUI.service';

import './webUI.scss';

export default angular
    .module('HomeuiApp.webUI', [])
    .config(['$translatePartialLoaderProvider', ($translatePartialLoaderProvider) => {
        $translatePartialLoaderProvider.addPart('webUI');
    }])
    .component('webUiManage', webUIManageComponent)
    .component('webUiSelect', webUISelectComponent)
    .factory('webUIService', webUIService)
    .name;