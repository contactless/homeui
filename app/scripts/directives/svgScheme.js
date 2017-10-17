
export function svgSchemeDirective($compile, DeviceData) {
    'ngInject';
    return {
        restrict: 'E',
        scope : {
            svgFullWidth: "="
        },
        link: function (scope, element, attrs) {
            function getElementAttributes (elem) {
                var attr = {};
                if(elem && elem.length) {
                    $.each(elem.get(0).attributes, function(v,n) {
                        n = n.nodeName||n.name;
                        v = elem.attr(n); // relay on $.fn.attr, it makes some filtering and checks
                        if(v != undefined && v !== false) attr[n] = v
                    })
                }

                return attr;
            }
            function parseAttrs(attrStr) {
                try {
                    var el = angular.element("<div " + attrStr + " />");
                } catch (err) {
                    return {};
                }

                return getElementAttributes(el);

            }

            scope.devicedata = DeviceData;
            var elem = element[0];
            var svg = element[0].querySelector("svg");
            var w = angular.element(svg).width(),
                h = angular.element(svg).height(),
                _w = angular.element(elem).width(),
                _h = angular.element(elem).height(),
                r = _w / w;


            if (scope.svgFullWidth) {
                angular.element(svg).attr("width", w * r);
                angular.element(elem).attr("height", h * r );
                angular.element(svg).attr("height", h * r);
            }

            var regions = element[0].querySelectorAll("*");
            angular.forEach(regions, function (path, key) {
                var element = angular.element(path);
                element.attr("svg-compiled-element", "");

                var desc = element[0].querySelector("desc");
                if (desc != null) {

                    var attrs = parseAttrs(desc.innerHTML);

                    if (element[0].nodeName == 'text') {
                        if (attrs.hasOwnProperty("value")) {
                            var tspan = element[0].querySelector("tspan");
                            if (tspan != null) {
                                tspan.innerHTML = attrs.value;
                            }
                        }
                    }

                    for (var descAttr in attrs) {
                        if ((descAttr != "channel") && (descAttr != "value")) {
                            if (descAttr.indexOf("append-") == 0) {
                                var replAttr = descAttr.slice(7); //7 == length of "append-"
                                //console.log("replace %s", replAttr);
                                element.attr(replAttr,
                                    element.attr(replAttr) + attrs[descAttr]);
                            } else {
                                element.attr(descAttr, attrs[descAttr]);
                            }
                        }
                    }


                    if (attrs.hasOwnProperty("channel")) {
                        var channelStr = attrs.channel/*'wb-map12h_91/Ch 2 Pfund L3';*/;
                        var channelArr = channelStr.split("/");

                        if (channelArr.length == 2) {
                            var channelVar = `devicedata.proxy('${channelStr}')`;
                            element.attr("val", channelVar + '.value');
                            element.attr("type", channelVar + '.metaType');
                            element.attr("units", channelVar + '.metaUnits');
                            element.attr("error", channelVar + '.metaError');
                            element.attr("device", channelStr);
                            //console.log("_______", scope.devicedata.proxy(channelStr).value);
                        }
                    }
                }
                $compile(element)(scope);
            })
        }
    }
}

export  function svgCompiledElementDirective($compile) {
     'ngInject';
    return {
        restrict: 'A',
        scope: {
            val: "=",
            type: "=",
            units: "=",
            error: "="
        },
        link: function (scope, element, attrs) {
            element.removeAttr("svg-compiled-element");
            $compile(element)(scope);
            //console.log("device", attrs.device);
        }
    }
}