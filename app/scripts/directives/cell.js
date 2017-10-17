function cellDirective(DeviceData) {
  'ngInject';
  
  class CellController {
    constructor ($scope, $attrs) {
      'ngInject';
      // XXX should be possible to change the cell

      this.cell = $scope.cell = DeviceData.proxy($scope.$eval($attrs.cell));
      // назначаю разные id для чекбоксов
      $scope.id = Math.random() + '';
      /* this.cell =
      * id:"network/Ethernet IP"
       cell
       controlId
       deviceId
       displayType
       error
       max
       min
       name
       order
       readOnly
       step
       type
       units
       value
       valueType*/
    }
  }

  return {
    restrict: "A",
    scope: true,
    priority: 1, // take precedence over ng-model
    controller: CellController
  };
}

export default cellDirective;
