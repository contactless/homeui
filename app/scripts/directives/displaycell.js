"use strict";

angular.module("homeuiApp")
  .directive("displayCell", () => {
    return {
      restrict: "EA",
      scope: false,
      require: "^cell",
      replace: true,
      template: "<div class='display-cell cell-type-{{ cell.type }}' ng-switch on='cell.displayType'>" +

        "<div ng-switch-when='text' class='display-cell-text'>" +
        "<cell-name></cell-name><text-cell></text-cell>" +
        "</div>" +

        "<div ng-switch-when='value' class='display-cell-value'>" +
        "<cell-name></cell-name><value-cell></value-cell>" +
        "</div>" +

        "<div ng-switch-when='button' class='display-cell-button'>" +
        "<button-cell></button-cell>" +
        "</div>" +

        "<div ng-switch-when='alarm' class='display-cell-alarm'>" +
        "<alarm-cell></alarm-cell>" +
        "</div>" +

        "<div ng-switch-when='range' class='display-cell-range'>" +
        "<cell-name></cell-name><range-cell></range-cell>" +
        "</div>" +

        "<div ng-switch-when='switch' class='display-cell-switch'>" +
        "<cell-name></cell-name><switch-cell></switch-cell>" +
        "</div>" +

        "<div ng-switch-when='rgb' class='display-cell-rgb'>" +
        "<cell-name></cell-name><rgb-cell></rgb-cell>" +
        "</div>" +

        "</div>"
    };
  });
