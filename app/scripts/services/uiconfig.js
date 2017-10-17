function uiConfigService($rootScope, $q, $timeout) {
  'ngInject';
  
  var DEFAULT_DASHBOARD = {
    id: "default",
    name: "Default Dashboard",
    widgets: []
  };

  var data = {
    dashboards: [DEFAULT_DASHBOARD],
    widgets: [],
    defaultDashboardId: 'default'
  };
  var deferReady = $q.defer(),
      version = 1;

  function add(prop, idBase, content) {
    var items = data[prop], n = 1,
        existingIds = Object.create(null);
    items.forEach(item => existingIds[item.id] = true);
    while (existingIds[idBase + n])
      ++n;
    var o = angular.extend({}, content, {
      id: idBase + n,
      isNew: true
    });
    $timeout(()=>items.push(o));
    return o;
  }

  function getWidget(id) {
    var r = data.widgets.find(widget => widget.id === id);
    if (!r)
      throw new Error("invalid widget id: " + id);
    return r;
  }

  function _getDashboard(id) {
    var r = data.dashboards.find(dashboard => dashboard.id === id);
    if (!r)
      throw new Error("invalid dashboard id: " + id);
    return r;
  }

  function getDashboard(id) {
    // We hold unique Dashboard models per real dashboard so it
    // can hold its own scope object that can be destroyed when
    // the dashboard is deleted. The scope is needed to track
    // changes in widgets collection
    var dash = _getDashboard(id);
    if (!dash.hasOwnProperty("_model"))
      dash._model = new Dashboard(dash);
    return dash._model;
  }

  function deleteWidget(widget) {
    var idx = data.widgets.indexOf(widget);
    if (idx < 0)
      return;
    data.widgets.splice(idx, 1);
    data.dashboards.forEach(dashboard => {
      getDashboard(dashboard.id).removeWidgetFromDashboard(widget);
    });
  }

  function filterCollection(items) {
    return items.filter(item => {
      return !item.hasOwnProperty("isNew") || !item.isNew;
    }).map(item => {
      var toCopy = angular.extend({}, item);
      delete toCopy._model;
      // для дашбордов
      // FIXME: test this
      if (toCopy.hasOwnProperty("widgets")) {
        item.isSvg = !!item.svg_url;
        var newWidgets = Object.create(null);
        data.widgets.forEach(widget => {
          if (widget.isNew)
            newWidgets[widget.id] = true;
        });
        toCopy.widgets = toCopy.widgets.filter(widgetId => !newWidgets[widgetId]);
      }
      return angular.copy(toCopy);
    });
  }
  
  //---------------------------------------------------------------------------
  class Dashboard {
    constructor(content) {
      this.scope = $rootScope.$new();
      this.content = content;
      this.widgets = this.content.widgets.map(getWidget);
      this.scope.$watchCollection(() => this.widgets, () => {
        this.content.widgets = this.widgets.map(widget => widget.id);
      });
      this.scope.$watchCollection(() => this.content.widgets, () => {
        this.widgets = this.content.widgets.map(getWidget);
      });
    }

    get id() {
      return this.content.id;
    }

    set id(newId) {
      this.content.id = newId;
    }

    get name() {
      return this.content.name;
    }

    set name(newName) {
      this.content.name = newName;
    }

    get isNew() {
      return this.content.hasOwnProperty("isNew") ? this.content.isNew : false;
    }

    remove() {
      this.scope.$destroy();
      var idx = data.dashboards.indexOf(this.content);
      if (idx >= 0)
        data.dashboards.splice(idx, 1);
    }

    removeWidgetFromDashboard(widget) {
      var idx = this.widgets.indexOf(widget);
      if (idx >= 0)
        this.widgets.splice(idx, 1);
      // don't wait for digest for the sake of consistency
      idx = this.content.widgets.indexOf(widget.id);
      if (idx >= 0)
        this.content.widgets.splice(idx, 1);
    }
  }
  
  //---------------------------------------------------------------------------
  function filtered() {
    return {
      dashboards: filterCollection(data.dashboards),
      widgets: filterCollection(data.widgets),
      defaultDashboardId: data.defaultDashboardId
    };
  }

  function setDefaultDashboard(id) {
    if (getDashboard(id)) {
      data.defaultDashboardId = id;
    } else {
      throw new Error("invalid dashboard id: " + id);
    }
  }

  $rootScope.$watch(filtered, () => { version++; }, true);

  return {
    data,

    version() {
      return version;
    },

    whenReady() {
      return deferReady.promise;
    },

    ready(changes) {
      if (changes) {
        angular.extend(data, changes);
      }
      deferReady.resolve(data);
    },

    deleteWidget,
    getDashboard,

    addDashboard: () => {
      var item = add("dashboards", "dashboard", {
        name: "",
        widgets: [],
        isSvg: false
      });
      item._model = new Dashboard(item);
      return item._model;
    },

    addDashboardWithSvg: () => {
      var item = add("dashboards", "dashboard", {
        name: "",
        isSvg: true,
        svg_url: "",
        svg_fullwidth: '',
        widgets: []
      });
      item._model = new Dashboard(item);
      
      return item._model;
    },

    addWidget: () => add("widgets", "widget", {
      name: "",
      description: "",
      compact: true,
      cells: []
    }),

    filtered,
    setDefaultDashboard
  };
}

export default uiConfigService;
