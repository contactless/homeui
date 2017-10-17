function deviceDataService(mqttClient) {
  'ngInject';
  
  var devices = {}, cells = {};

  var cellTypeMap = {
    "text": {
      valueType: "string",
      units: "",
      readOnly: true,
      displayType: "text"
    },
    "switch": {
      valueType: "boolean",
      units: "",
      readOnly: false,
      displayType: "switch"
    },
    "wo-switch": {
      valueType: "boolean",
      units: "",
      readOnly: false,
      displayType: "switch"
    },
    "alarm": {
      valueType: "boolean",
      units: "",
      readOnly: true,
      displayType: "alarm"
    },
    "pushbutton": {
      valueType: "pushbutton",
      units: "",
      readOnly: false,
      displayType: "button"
    },
    "temperature": {
      valueType: "number",
      units: "°C",
      readOnly: true,
      displayType: "value"
    },
    "rel_humidity": {
      valueType: "number",
      units: "%, RH",
      readOnly: true,
      displayType: "value"
    },
    "atmospheric_pressure": {
      valueType: "number",
      units: "millibar (100 Pa)",
      readOnly: true,
      displayType: "value"
    },
    "rainfall": {
      valueType: "number",
      units: "mm/h",
      readOnly: true,
      displayType: "value"
    },
    "wind_speed": {
      valueType: "number",
      units: "m/s",
      readOnly: true,
      displayType: "value"
    },
    "power": {
      valueType: "number",
      units: "W",
      readOnly: true,
      displayType: "value"
    },
    "power_consumption": {
      valueType: "number",
      units: "kWh",
      readOnly: true,
      displayType: "value"
    },
    "voltage": {
      valueType: "number",
      units: "V",
      readOnly: true,
      displayType: "value"
    },
    "water_flow": {
      valueType: "number",
      units: "m³/h",
      readOnly: true,
      displayType: "value"
    },
    "water_consumption": {
      valueType: "number",
      units: "m³",
      readOnly: true,
      displayType: "value"
    },
    "heat_power": {
      valueType: "number",
      units: "Gcal/h",
      readOnly: true,
      displayType: "value"
    },
    "heat_energy": {
      valueType: "number",
      units: "Gcal",
      readOnly: true,
      displayType: "value"
    },
    "resistance": {
      valueType: "number",
      units: "Ohm",
      readOnly: true,
      displayType: "value"
    },
    "concentration": {
      valueType: "number",
      units: "ppm",
      readOnly: true,
      displayType: "value"
    },
    "pressure": {
      valueType: "number",
      units: "bar",
      readOnly: true,
      displayType: "value"
    },
    "range": {
      valueType: "number",
      units: "",
      readOnly: false,
      displayType: "range"
    },
    "value": {
      valueType: "number",
      units: "",
      readOnly: true,
      displayType: "value"
    },
    "rgb": {
      valueType: "rgb",
      units: "",
      readOnly: false,
      displayType: "rgb"
    }
  };

  function splitTopic (topic) {
    return topic.substring(1).split("/");
  }

  function ensureDevice (id) {
    if (!devices.hasOwnProperty(id))
      devices[id] = { name: id, explicit: false, cellIds: [] };
    return devices[id];
  }

  function maybeRemoveDevice (id) {
    if (!devices.hasOwnProperty(id))
      return;
    if (!devices[id].explicit && !devices[id].cellIds.length)
      delete devices[id];
  }

  function parseCellTopic (topic) {
    var parts = splitTopic(topic);
    ensureDevice(parts[1]);
    return parts[1] + "/" + parts[3];
  }

  function internCell (id) {
    if (cells.hasOwnProperty(id))
      return cells[id];
    var cell = new Cell(id);
    cells[id] = cell;
    return cell;
  }

  function cellFromTopic (topic) {
    return internCell(parseCellTopic(topic));
  }

  function colorChannel(value) {
    value -= 0;
    return !(value >= 0 && value <= 255) ? 0 : value;
  }

  function parseRgb (value) {
    var m = ("" + value).match(/(\d+);(\d+);(\d+)/);
    if (!m)
      return{ r: 0, g: 0, b: 0 };
    return {
      r: colorChannel(m[1]),
      g: colorChannel(m[2]),
      b: colorChannel(m[3])
    };
  }

  function formatRgb (value) {
    return [value.r, value.g, value.b].join(";");
  }

  function isRgb (value) {
    return angular.isObject(value) && ["r", "g", "b"].every(c => value.hasOwnProperty(c));
  }

  function compareCellIds (idA, idB) {
    if (!cells.hasOwnProperty(idA) || !cells.hasOwnProperty(idB))
      return 0;

    var cellA = cells[idA], cellB = cells[idB], r;
    if (cellA.order !== null)
      return cellB.order === null ? -1 : cellA.order - cellB.order;
    return cellB.order === null ? cellA._seq - cellB._seq : 1;
  }

  var nextCellSeq = 1;

  class Cell {
    constructor (id) {
      this.id = id;
      var parts = this.id.split("/");
      if (parts.length != 2)
        throw new Error("invalid cell id: " + this.id);
      this.deviceId = parts[0];
      this.controlId = parts[1];
      this.name = this.controlId;
      this.type = "incomplete";
      this._value = null;
      this._explicitUnits = "";
      this._explicitReadOnly = false;
      this._writable = false;
      this.error = false;
      this.min = null;
      this.max = null;
      this.step = null;
      this.order = null;
      this._seq = nextCellSeq++;
    }

    get value () {
      return this._value;
    }

    set value (newValue) {
      this.sendValue(newValue);
    }

    get valueType () {
      return this._typeEntry().valueType;
    }

    get displayType () {
      return this._typeEntry().displayType;
    }

    _addToDevice () {
      var devCellIds = ensureDevice(this.deviceId).cellIds;
      if (devCellIds.indexOf(this.id) < 0) {
        devCellIds.push(this.id);
        devCellIds.sort(compareCellIds);
      }
    }

    _removeFromDevice () {
      if (!devices.hasOwnProperty(this.deviceId))
        return;
      devices[this.deviceId].cellIds = devices[this.deviceId].cellIds.filter(id => id != this.id);
    }

    _setCellValue (value) {
      switch (this.valueType) {
      case "number":
        this._value = value - 0;
        break;
      case "boolean":
        this._value = typeof value == "bool" ? value : value == "1";
        break;
      case "pushbutton":
        // unsettable
        break;
      case "rgb":
        this._value = isRgb(value) ? value : parseRgb(value);
        break;
      case "string":
      default:
        this._value = "" + value;
        break;
      }
    }

    stringValue () {
      switch (this.valueType) {
      case "boolean":
        return this._value ? "1" : "0";
      case "pushbutton":
        return null;
      case "rgb":
        return isRgb(this._value) ? formatRgb(this._value) : "";
      case "number":
      case "string":
      default:
        return "" + this._value;
      }
    }

    _sendValueTopic () {
      return ["", "devices", this.deviceId, "controls", this.controlId, "on"].join("/");
    }

    _isButton () {
      return this.type == "pushbutton";
    }

    _isString () {
      return this.isComplete() && this.valueType == "string";
    }

    _typeEntry () {
      return cellTypeMap.hasOwnProperty(this.type) ? cellTypeMap[this.type] : cellTypeMap["text"];
    }

    receiveValue (newValue) {
      if (!newValue) /// ozk замена null на  '-' тут и в 342 строке
        this._value = this._isString() ? "" : '-' /*null*/; // value removed, non-pushbutton/text cell becomes incomplete
      else
        this._setCellValue(newValue);
      this._updateCompleteness();
    }

    sendValue (newValue) {
      if (!this.isComplete() || this.readOnly)
        return;
      if (newValue === "" && !this._isString())
        newValue = this._value;
      this._setCellValue(newValue);
      mqttClient.send(
        this._sendValueTopic(),
        this._isButton() ? "1" : this.stringValue(), false);
    }

    isComplete () {
      return this.type != "incomplete" && (this._isButton() || this._value !== '-' /*null*/);/// ozk замена null на  '-'
    }

    _updateCompleteness () {
      if (this.isComplete()) {
        this._addToDevice();
        return;
      }
      this._removeFromDevice();
      maybeRemoveDevice(this.deviceId);
      if (this.type == "incomplete" && this._value === null)
        delete cells[this.id];
    }

    setType (type) {
      this.type = type || "incomplete";
      if (this._value !== null)
        this._setCellValue(this._value);
      else if (this._isString())
        this._setCellValue("");
      this._updateCompleteness();
    }

    setName (name) {
      this.name = name;
    }

    setUnits (units) {
      this._explicitUnits = units;
    }

    get units () {
      return this._explicitUnits || this._typeEntry().units || "";
    }

    get readOnly () {
      return this._explicitReadOnly || (!this._writable && this._typeEntry().readOnly);
    }

    setReadOnly (readOnly) {
      this._explicitReadOnly = !!readOnly;
    }

    setError (error) {
      this.error = error;
    }

    setMin (min) {
      this.min = min == "" ? null: min - 0;
    }

    setMax (max) {
      this.max = max == "" ? null : max - 0;
    }

    setStep (step) {
      this.step = step == "" ? null: step - 0;
    }

    setWritable (writable) {
      this._writable = !!writable;
    }

    setOrder (order) {
      this.order = order - 0;
      if (!this.isComplete())
        return;
      ensureDevice(this.deviceId).cellIds.sort(compareCellIds);
    }
  }

  mqttClient.addStickySubscription("/devices/+/meta/name", msg => {
    var deviceId = splitTopic(msg.topic)[1];
    if (msg.payload == "") {
      if (!devices.hasOwnProperty(deviceId))
        return;
      devices[deviceId].name = deviceId;
      devices[deviceId].explicit = false;
      maybeRemoveDevice(deviceId);
      return;
    }
    var dev = ensureDevice(deviceId);
    dev.name = msg.payload;
    dev.explicit = true;
  });

  function addCellSubscription(suffix, handler) {
    mqttClient.addStickySubscription("/devices/+/controls/+" + suffix, msg => {
      // console.debug("%s: %s: %s: %s", suffix || "<empty>", msg.topic, cellFromTopic(msg.topic).id, msg.payload);
      handler(cellFromTopic(msg.topic), msg.payload);
    });
  }

  addCellSubscription("",               (cell, payload) => { cell.receiveValue(payload);       });
  addCellSubscription("/meta/type",     (cell, payload) => { cell.setType(payload);            });
  addCellSubscription("/meta/name",     (cell, payload) => { cell.setName(payload);            });
  addCellSubscription("/meta/units",    (cell, payload) => { cell.setUnits(payload);           });
  addCellSubscription("/meta/readonly", (cell, payload) => { cell.setReadOnly(payload == "1"); });
  addCellSubscription("/meta/writable", (cell, payload) => { cell.setWritable(payload == "1"); });
  addCellSubscription("/meta/error",    (cell, payload) => { cell.setError(payload);         });
  addCellSubscription("/meta/min",      (cell, payload) => { cell.setMin(payload);             });
  addCellSubscription("/meta/max",      (cell, payload) => { cell.setMax(payload);             });
  addCellSubscription("/meta/step",     (cell, payload) => { cell.setStep(payload);            });
  addCellSubscription("/meta/order",    (cell, payload) => { cell.setOrder(payload);           });
  // STEP --> precision (округление) ?

  function filterCellIds (func) {
    var result = [];
    Object.keys(devices).sort().forEach(devId => {
      var devCellIds = devices[devId].cellIds;
      if (func)
        devCellIds = devCellIds.filter(id => func(cells[id]));
      result = result.concat(devCellIds);
    });
    return result;
  }

  var fakeCell = new Cell("nosuchdev/nosuchcell");

  class CellProxy {
    constructor (id) {
      this.id = id;
    }

    gotCell () {
      return cells.hasOwnProperty(this.id);
    }

    get cell () {
      return this.gotCell () ? cells[this.id] : fakeCell;
    }

    isComplete () {
      return this.gotCell() && this.cell.isComplete();
    }

    sendValue (newValue) {
      if (this.gotCell())
        this.cell.sendValue(newValue);
    }

    get value () { return this.cell.value; }
    set value (newValue) {
      // undefined comes from control values that didn't pass validation
      if (newValue !== undefined)
        this.cell.value = newValue;
    }

    get type () { return this.cell.type; }
    get name () { return this.cell.name; }
    get units () { return this.cell.units; }
    get readOnly () { return this.cell.readOnly; }
    get error () { return this.cell.error; }
    get min () { return this.cell.min; }
    get max () { return this.cell.max; }
    get step () { return this.cell.step; }
    get valueType () { return this.cell.valueType; }
    get displayType () { return this.cell.displayType; }
    get order () { return this.cell.order; }
    get deviceId () { return this.id.split("/")[0]; }
    get controlId () { return this.id.split("/")[1]; }
  }

  return {
    devices: devices,
    cells: cells,

    getCellIds () {
      return filterCellIds();
    },

    getCellIdsByType (type) {
      return filterCellIds(cell => cell.type == type);
    },

    getCellIdsByDisplayType (displayType) {
      return filterCellIds(cell => cell.displayType == displayType);
    },

    cell (id) {
      if (!cells.hasOwnProperty(id))
        throw new Error("cell not found: " + id);
      return cells[id];
    },

    proxy (id) {
      return new CellProxy(id);
    },

    cellTypeNames () {
      return Object.keys(cellTypeMap).sort();
    },

    cellTypesUsed () {
      var types = {};
      filterCellIds().forEach(cellId => {
        types[cells[cellId].type] = true;
      });
      return Object.keys(types).sort();
    }
  };
}

export default deviceDataService;
