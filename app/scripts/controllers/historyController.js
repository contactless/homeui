

class HistoryCtrl {
    //...........................................................................
    constructor($scope, $injector, handleData) {
        'ngInject';

        // 1. Self-reference
        var vm = this;
        // интервал загрузки частей графика
        this.CHUNK_INTERVAL = 1;
        // 2. requirements
        var $stateParams = $injector.get('$stateParams');
        this.$stateParams = $stateParams;
        var $location = $injector.get('$location');
        var HistoryProxy = $injector.get('HistoryProxy');
        var whenMqttReady = $injector.get('whenMqttReady');
        var errors = $injector.get('errors');
        var historyMaxPoints = $injector.get('historyMaxPoints');
        var dateFilter = $injector.get('dateFilter');
        var uiConfig = $injector.get('uiConfig');
        var orderByFilter = $injector.get('orderByFilter');
        this.$timeout = $injector.get('$timeout');
        this.$state = $injector.get('$state');

        angular.extend(this, {
            scope: $scope,
            location: $location,
            historyMaxPoints: historyMaxPoints,
            HistoryProxy: HistoryProxy,
            dateFilter: dateFilter,
            errors: errors,
            controls: []
        });

        this.handleData = handleData;

        // читаем из урла даты
        this.readDatesFromUrl();

        this.topics = [];// все топики из урла
        this.chartConfig = [];// данные графика
        this.controlIds = [];// контролы из урла
        this.devices = [];// девайсы из урла
        this.channelShortNames = [];
        this.channelNames = [];
        this.dataPoints = [];
        this.hasStrings = [];
        this.progreses = [];
        this.progresMax = 100;
        this.layoutConfig = {
            // yaxis: {title: "7777"},       // set the y axis title
            xaxis: {
                //showgrid: false, // remove the x-axis grid lines
                //tickformat: "%B, %Y"  // customize the date format to "month, day"
            },
            margin: {// update the left, bottom, right, top margin
                l: 40, b: 40, r: 10, t: 20
            },
            legend: {//https://plot.ly/javascript/legend/
                x: 0,
                y: 100
            }
        };

        // ищу в урле контролы
        if($stateParams.device && $stateParams.control) {
            this.devices = $stateParams.device.split(';');
            this.controlIds = $stateParams.control.split(';');
            // только если количество параметров сходится
            if(this.devices.length === this.controlIds.length) {
                for (var i = 0; i < this.devices.length; i++) {
                    this.topics.push("/devices/" + this.devices[i] + "/controls/" + this.controlIds[i]);
                    // инициализирую все прогрес бары
                    this.progreses[i] = {value: 0, isLoaded: false};
                }
            }
        }
        // если массив пустой то создаю первый элемент
        this.topics = this.topics.length? this.topics : [null];
        this.selectedTopics = this.topics;

        this.ready = false;
        this.loadPending = !!this.topics.length;
        this.originalUrl = this.getUrl();
        // 4. Setup
        uiConfig.whenReady().then((data) => {
            updateControls(data.widgets);
        });

        whenMqttReady().then(() => {
            vm.ready = true;
            if (vm.loadPending) {
                vm.beforeLoadChunkedHistory();
            }
        });

        this.plotlyEvents = (graph) => {
            // !!!!! метод обязтельно должен быть в конструкторе иначе контекст будет непонятно чей
            graph.on('plotly_relayout', (event) => {
                if(event['xaxis.range[0]']) {
                    this.timeChange();

                    // порядок не менять!!!
                    this.selectedStartDate = new Date(event['xaxis.range[0]']);
                    this.selectedEndDate = new Date(event['xaxis.range[1]']);
                    this.setDefaultTime(this.selectedStartDate,this.selectedEndDate);
                    //обнуляю время чтобы не прогрессировало
                    this.resetTime();
                }
            })
        };

        // 5. Clean up
        $scope.$on('$destroy', () => {
            // Do whatever cleanup might be necessary
            vm = null; // MEMLEAK FIX
            $scope = null; // MEMLEAK FIX
        });

        // 6. All the actual implementations go here

        //...........................................................................
        function updateControls(widgets) {
            vm.controls = orderByFilter(
                Array.prototype.concat.apply(
                    [], widgets.map(widget =>
                        widget.cells.map(cell =>
                            ({
                                topic: vm.topicFromCellId(cell.id),
                                name: widget.name + " / " + (cell.name || cell.id)
                            })))),
                "name");

        }

    } // constructor

    // Class methods
    //...........................................................................

    // опции ограничивающие выбор. пока отключено
    setDateOptions() {
        /*this.dateOptionsEnd = {minDate:this.selectedStartDate, maxDate: new Date()};
        this.dateOptionsStart = {maxDate:this.selectedEndDate || new Date()};*/
    }
    // читает из урла даты
    readDatesFromUrl() {
        this.startDate = this.convDate(this.$stateParams.start);
        this.endDate = this.convDate(this.$stateParams.end);
        this.setDefaultTime(this.startDate,this.endDate);
        // по умолчанию дата равна сегодня минус один день
        this.selectedStartDate = this.startDate? this.startDate : new Date( + (new Date()) - 24*60*60*1000 );
        this.selectedEndDate = this.endDate? this.endDate : new Date();
        this.setDateOptions();
    };

    // смена урла
    updateUrl(index=0,deleteOne=false,onlyTimeUpdate=false) {
        //  если удаляется селект
        if(deleteOne) {
            this.devices.splice(index,1);
            this.controlIds.splice(index,1);
        } else if (!onlyTimeUpdate) {
            // если меняется или добавляется контрол
            var parsedTopic = this.parseTopic(this.selectedTopics[index]);
            // если этот контрол уже загружен в другой селект или нет такого топика
            if (!parsedTopic ||
                (this.controlIds.indexOf(parsedTopic.controlId)>=0 && this.devices.indexOf(parsedTopic.deviceId)>=0))
                return;
            // перезаписываю существующие
            this.devices[index] = parsedTopic.deviceId;
            this.controlIds[index] = parsedTopic.controlId;
        } else if (onlyTimeUpdate) {

        }

        this.resetTime();
        var url = this.getUrl();
        // изза остановки и возможного возобновления загрузки графика ввожу доп проверку
        // изменился ли урл или нет
        if(this.originalUrl === url || location.href.indexOf(url)>=0 || this.isRequestTimeout) {
            if (this.isRequestTimeout) {
                this.isRequestTimeout = false;
                this.errors.hideError();
            }
            this.$state.reload();
        } else {
            this.location.path(url);
        }
        //перезаписываю
        this.originalUrl = url;
    }

    // считаю часы + минуты в мсек
    addHoursAndMinutes(date) {
        var num = 0;
        num += date.getHours()*60*60*1000;
        num += date.getMinutes()*60*1000;
        return num
    }

    getUrl() {
        return [
            "/history",
            this.devices.join(';'),
            this.controlIds.join(';'),
            this.selectedStartDate ? this.selectedStartDate.getTime() + this.addHoursAndMinutes(this.selectedStartDateMinute) : "-",
            this.selectedEndDate ? this.selectedEndDate.getTime() + this.addHoursAndMinutes(this.selectedEndDateMinute) : "-"
        ].join("/")
    }

    resetTime() {
        // обнуляю время чтобы не прогрессировало
        if(this.selectedStartDate) {
            this.selectedStartDate.setHours(0);
            this.selectedStartDate.setMinutes(0)
        }
        if(this.selectedEndDate) {
            this.selectedEndDate.setHours(0);
            this.selectedEndDate.setMinutes(0)
        }
    }

    addTopic() {
        this.selectedTopics.push(null)
    }

    deleteTopic(i) {
        this.updateUrl(i,true)
    }

    timeChange(type) {
        this.setDateOptions();
        this.timeChanged = true;
    }

    updateDateRange() {
        if(this.isValidDatesRange()) {
            // доп проверки на минуты можно не ставить. если менять минуты например старта когда дата старта
            // не определена то урл не сменится так как все равно подставится "-" вместо даты старта
            if(this.selectedStartDate || this.selectedEndDate) this.updateUrl(false,false,true)
        } else {
            alert('Date range is invalid. Change one of dates')
        }
    }

    isValidDatesRange() {
        if(!this.selectedStartDate) return true;

        var sMin, sHour,
            // копирую
            s = new Date(this.selectedStartDate),
            e = this.selectedEndDate ? new Date( this.selectedEndDate) : new Date();
        if(this.selectedStartDateMinute) {
            sMin = this.selectedStartDateMinute.getMinutes();
            sHour = this.selectedStartDateMinute.getHours();
        } else {
            sMin = 0;
            sHour = 0;
        }
        s.setMinutes(sMin);
        s.setHours(sHour);

        // назначаю только если есть конечная дата(а не время) иначе берутся текущие
        if(this.selectedEndDate) {
            e.setMinutes(this.selectedEndDateMinute.getMinutes());
            e.setHours(this.selectedEndDateMinute.getHours());
        }

        // сравниваю и разницу дат и то чтобы старт не был в будущем
        return this.handleData.diffDatesInMinutes(s, new Date()) > 0 && this.handleData.diffDatesInMinutes(s, e) > 0
    }

    //...........................................................................
    convDate(ts) {
        if (ts == null || ts == "-") {
            return null;
        }
        var d = new Date();
        d.setTime(ts - 0);
        return d;
    }

    // проставляет только время
    setDefaultTime(start,end) {
        // вычитываю из урла или ставлю дефолтное
        var s = start || new Date();
        var _s = new Date();
        _s.setHours(s.getHours());
        _s.setMinutes(s.getMinutes());
        this.selectedStartDateMinute = _s;

        var e = end || new Date();
        var _e = new Date();
        _e.setHours(e.getHours());
        _e.setMinutes(e.getMinutes());
        this.selectedEndDateMinute = _e;
    }

    //...........................................................................
    topicFromCellId(cellId) {
        return "/devices/" + cellId.replace("/", "/controls/");
    }

    //...........................................................................
    parseTopic(topic) {
        if (!topic) {
            return null;
        }

        var m = topic.match(/^\/devices\/([^\/]+)\/controls\/([^\/]+)/);
        if (!m) {
            console.warn("bad topic: %s", topic);
            return null;
        }
        return {
            deviceId: m[1],
            controlId: m[2]
        };
    } // parseTopic

    beforeLoadChunkedHistory(indexOfControl=0) {
        if (!this.ready) {
            this.loadPending = true;
            return
        }
        this.loadPending = false;
        if (!this.topics[indexOfControl]) {
            // если это последний контрол + 1 то надо
            // и посчитать таблицу данных внизу страницы
            if (this.topics[indexOfControl-1]) {
                this.calculateTable();
            } else  return
        }
        var chunks = this.handleData.splitDate(this.startDate,this.endDate,this.CHUNK_INTERVAL+1);
        this.chunksN = chunks.length - 1;
        this.loadChunkedHistory(indexOfControl,0,chunks)
    }

    calculateTable() {
        // для таблицы под графиком для одного контрола
        this.dataPoints = true;
        if(this.topics.length === 1) {
            this.dataPoints = this.xValues.map((x, i) => ({x: x, y: this.yValues[i]}));
        } else {
            // и для нескольких
            var objX = {},graph = [];
            this.chartConfig.forEach((ctrl,i) => {
                ctrl.x.forEach(x=> {
                    objX[x] = null
                })
            });

            var arrX = Object.keys(objX);
            var _arrX = arrX.sort();
            _arrX.forEach(date=> {
                graph.push({
                    date,
                    value: Array(this.chartConfig.length).fill(null)
                });
                // ищу совпадения в каждом канале
                this.chartConfig.forEach((ctrl,iCtrl)=> {
                    for (var i = 0; i < ctrl.x.length; i++) {
                        // если не нахожу то останется null
                        if(date === ctrl.x[i]) {
                            graph[graph.length-1].value[iCtrl] = ctrl.y[i];
                            break
                        }
                    }
                });
            });
            this.dataPointsMultiple = graph;
        }
    }

    loadChunkedHistory(indexOfControl,indexOfChunk, chunks) {
        var parsedTopic = this.parseTopic(this.topics[indexOfControl]);
        if (!parsedTopic) {
            return
        }

        var params = {
            channels: [
                [parsedTopic.deviceId, parsedTopic.controlId]
            ],
            limit: this.historyMaxPoints,
            ver: 1
        };

        // никаких проверок дат. есть значения по умолчанию
        const startDate = new Date(chunks[indexOfChunk]);
        const endDate = new Date(chunks[indexOfChunk + 1]);
        params.timestamp = {
            // add extra second to include 00:00:00
            // но только для первого чанка / для последущих чанков наоборот
            // прибавляю 1 чтобы не было нахлеста
            // (FIXME: maybe wb-mqtt-db should support not just gt/lt, but also gte/lte?)
            gt: indexOfChunk==0? startDate.getTime() / 1000 - 1 : startDate.getTime() / 1000 + 1,
            lt: endDate.getTime() / 1000/// + 86400;
        };
        var intervalMs = endDate - startDate; // duration of requested interval, in ms
        // we want to request  no more than "limit" data points.
        // Additional divider 1.1 is here just to be on the safe side
        params.min_interval = intervalMs / params.limit * 1.1;
        this.loadHistory(params,indexOfControl,indexOfChunk,chunks)
    }

    stopLoadingData() {
        this.$timeout( () => {
            this.timeChanged = true;
            this.stopLoadData = true;
        })
    }

    loadHistory(params,indexOfControl,indexOfChunk,chunks) {
        if(this.stopLoadData) return;
        this.channelShortNames[indexOfControl] = params.channels[0][1];
        this.channelNames[indexOfControl] = params.channels[0][0] + ' / ' + params.channels[0][1];
        this.pend = true;

        this.HistoryProxy.get_values(params).then(result => {

            this.progreses[indexOfControl].value = indexOfChunk + 1;
            if(indexOfChunk === chunks.length - 2) {
                this.$timeout( () => {this.progreses[indexOfControl].isLoaded = true}, 500)
            }

            this.pend = false;
            // проверить есть ли строковые значения
            // проверяю только если еще не нашел строки
            if(!this.hasString) {
                this.hasString = result.values.some(item => item.v != parseFloat(item.v)/*typeof item.v === 'string'*/);
            }

            if (result.has_more) this.errors.showError("Warning", "maximum number of points exceeded. Please select start date.");

            this.xValues = result.values.map(item => {
                var ts = new Date();
                ts.setTime(item.t * 1000);
                return this.dateFilter(ts, "yyyy-MM-dd HH:mm:ss");
            });
            this.yValues = result.values.map(item => item.v - 0);
            //var minValues = result.values.map(item => item.min - 0);
            //var maxValues = result.values.map(item => item.max - 0);

            // изза особенности графика типа "ОШИБКИ" отображать экстремумы надо
            // высчитывая отклонение от основных значений
            var minValuesErr = result.values.map(item => item.min && item.v? item.v-item.min : null);
            var maxValuesErr = result.values.map(item => item.max && item.v? item.max-item.v : null);
            /*var trace1 = {//простой график
                x: this.xValues,
                y: maxValues,
                type: 'scatter'
            };*/


            // если это первый чанк то создаю график
            if(indexOfChunk==0) {

                this.chartConfig[indexOfControl] = {//https://plot.ly/javascript/error-bars/
                    name: params.channels[0][0] + ' / ' + params.channels[0][1],
                    x: this.xValues,
                    y: this.yValues,
                    error_y: {//построит график  типа "ОШИБКИ"(error-bars)
                        type: 'data',
                        symmetric: false,
                        array: maxValuesErr,
                        arrayminus: minValuesErr,
                        // styling error-bars https://plot.ly/javascript/error-bars/#colored-and-styled-error-bars
                        thickness: 0.5,
                        width: 0,
                        value: 0.1,
                        //color: '#85144B',
                        opacity: 0.5
                    },
                    type: 'scatter',
                    mode: 'lines'
                }
            } else {
                // если последущие то просто добавляю дату
                this.chartConfig[indexOfControl].x = this.chartConfig[indexOfControl].x.concat(this.xValues);
                this.chartConfig[indexOfControl].y = this.chartConfig[indexOfControl].y.concat(this.yValues);
                this.chartConfig[indexOfControl].error_y.array = this.chartConfig[indexOfControl].error_y.array.concat(maxValuesErr);
                this.chartConfig[indexOfControl].error_y.arrayminus = this.chartConfig[indexOfControl].error_y.arrayminus.concat(minValuesErr);

                // для таблицы под графиком для первого контрола
                //if(indexOfControl==0) this.dataPoints = this.dataPoints.concat(this.xValues.map((x, i) => ({x: x, y: this.yValues[i]})))
            }

            if(indexOfControl==0) {
                this.firstChunkIsLoaded = true;
            }

            if(this.topics.length === 1) {
                // провериь есть ли точки в контроллах
                // ниже point.y == 0 специально выставлено не жесткое сравнение / не менять!!!
                this.hasPoints = this.chartConfig[indexOfControl].y.some(y => {
                  return  !!y || y == 0
                } )

            } else {
                this.dataPointsArr = [];
                this.chartConfig.forEach((ctrl,i) => {
                    this.dataPointsArr[i] = ctrl.y.some(point =>  !!point);
                });
                this.hasPoints = this.dataPointsArr.some(boolin => boolin);
            }


            // если еще есть части интервала
            if(indexOfChunk + 2 < chunks.length) {
                this.loadChunkedHistory(indexOfControl,indexOfChunk + 1,chunks);
            // запрашиваю следущий контол если есть
            } else if(indexOfControl < this.selectedTopics.length){
                 this.beforeLoadChunkedHistory(indexOfControl + 1);
            }
        }).catch((reason) => {
            if (angular.isObject(reason) && (reason['data'] === 'MqttTimeoutError' || reason['data'] === 'MqttPacketTimeoutError')) {
                this.stopLoadingData();
                this.isRequestTimeout = true;
            }
            this.errors.catch("Error getting history")(reason);
        });
    } // loadHistory

} // class HistoryCtrl

//-----------------------------------------------------------------------------
export default angular
    .module('homeuiApp.history', [])
    .controller('HistoryCtrl', HistoryCtrl);
