class WidgetsCtrl {
  constructor($scope, uiConfig, DeviceData, handleData) {
    'ngInject';

    this.handleData = handleData;
    $scope.cell = id => {
      return DeviceData.proxy(id);
    };
    function wrapWidgetCell (entry) {
      var proxy = DeviceData.proxy(entry.id);
      var splittedId = entry.id.split('/', 2);
      return {
        id: entry.id,
        device: splittedId[0],
        control: splittedId[1],
        get name() {
          return (entry.hasOwnProperty("name") && entry.name) || proxy.name;
        },
        proxy: proxy
      };
    }

    $scope.historyStartTS = () => this.handleData.historyStartTS();
    $scope.rows = [];
    $scope.$watch(uiConfig.version, () => {
      var dashboardMap = Object.create(null);
      uiConfig.data.dashboards.forEach(dashboard => {
        dashboard.widgets.forEach(widgetId => {
          (dashboardMap[widgetId] || (dashboardMap[widgetId] = [])).push(uiConfig.getDashboard(dashboard.id));
        });
      });
      // XXX: dashboards. perhaps should add config change tracking
      $scope.rows = Array.prototype.concat.apply([], uiConfig.data.widgets.map((widget,i) => {
        var primaryRow = {
          name: widget.name,
          id: widget.id,
          _id:i+1,
          widget: widget,
          get rowSpan () {
            return this.preview ? 1 : Math.max(widget.cells.length, 1);
          },
          dashboards: dashboardMap[widget.id] || [],
          cellIndex: 1,
          cell: widget.cells.length ? wrapWidgetCell(widget.cells[0]) : null,
          show: true,
          preview: false,
          deleteWidget: () => {
            if (confirm("Really delete the widget?"))
              uiConfig.deleteWidget(widget);
          }
        };
        return [ primaryRow ].concat(widget.cells.slice(1).map((cell, n) => ({
          name: widget.name,
          id: widget.id,
          _id: widget.id.slice(6),
          widget: null,
          cellIndex: n + 2,
          cell: wrapWidgetCell(cell),
          get show () { return !primaryRow.preview; },
          get preview () { return primaryRow.preview; }
        })));
      }));
    });
  }
}

//-----------------------------------------------------------------------------
export default angular
    .module('homeuiApp.widgets', [])
    .controller('WidgetsCtrl', WidgetsCtrl);
