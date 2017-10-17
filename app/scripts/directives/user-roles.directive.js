/*
* more then one -> mto
* more then two -> mtt
* more then three -> mtth
*
* пример
* user-role="mto" current-role="$ctrl.roles.current.role"
*/
export default function userRolesDirective(rolesFactory) {
    'ngInject';
    return {
        restrict: 'A',
        scope : {
            currentRole: '<'
        },
        link: (scope, element, attr) => {

            var f = () => {
                element.hide();
                // >= ROLE_TWO
                if (attr.userRole === 'mto' && scope.currentRole >= rolesFactory.ROLE_TWO) {
                    element.show();
                // >= ROLE_THREE
                } else if (attr.userRole === 'mtt' && scope.currentRole >= rolesFactory.ROLE_THREE){
                    element.show();
                }
            };

            // слушаем изменения роли
            var watch = scope.$watch('currentRole', f);
            scope.$on('$destroy', ()=> {
                watch()
            })

        }
    };
}