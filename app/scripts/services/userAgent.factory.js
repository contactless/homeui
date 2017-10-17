/**
 * Created by ozknemoy on 17.11.2016.
 */
export default function userAgentFactory () {
    var userAgentF = {};
    userAgentF.isMobile = {
        Android: function () {
            return navigator.userAgent.match(/Android/i);
        },
        BlackBerry: function () {
            return navigator.userAgent.match(/BlackBerry/i);
        },
        iOS: function () {
            return navigator.userAgent.match(/iPhone|iPad|iPod/i);
        },
        Opera: function () {
            return navigator.userAgent.match(/Opera Mini/i);
        },
        Windows: function () {
            return navigator.userAgent.match(/IEMobile/i);
        },
        any: function () {
            return (userAgentF.isMobile.Android() || userAgentF.isMobile.BlackBerry() || userAgentF.isMobile.iOS() || userAgentF.isMobile.Opera() || userAgentF.isMobile.Windows());
        }
    };

    userAgentF.getBrowser = function () {
         // Firefox 1.0+
        var isFirefox = typeof InstallTrigger !== 'undefined';
        // Safari 3.0+ "[object HTMLElementConstructor]"
        var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0 || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || safari.pushNotification);
        // Internet Explorer 6-11
        var isIE = /*@cc_on!@*/false || !!document.documentMode;
        // Edge 20+
        var isEdge = !isIE && !!window.StyleMedia;
        // Chrome 1+
        var isChrome = !!window.chrome && !!window.chrome.webstore;
        // Opera 8.0+
        var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
        // Blink engine detection
        var isBlink = (isChrome || isOpera) && !!window.CSS;// new opera

        let arr = [isFirefox,isSafari,isIE,isEdge,isChrome,isBlink,isOpera];
        let arrString = ['Firefox','Safari','IE','Edge','Chrome','Blink','Opera'];

        // вернет это
        for (let i = 0; i < arr.length; i++) {
            if (arr[i]) return arrString[i]
        }
        // или это
        return 'unknown'
    };

    userAgentF.mobileBrowser = {
        isChrome: function () {
            // for Android
            //Phone pattern: 'Android' + 'Chrome/[.0-9]* Mobile'
            //Tablet pattern: 'Android' + 'Chrome/[.0-9]* (?!Mobile)'
            var isMobileChrome = /Chrome\/[.0-9]* Mobile/i;
            return isMobileChrome.test(navigator.userAgent)
        }
    };

    // из vk
    userAgentF.vk = function () {
        var _ua = navigator.userAgent.toLowerCase();
        var browser = {
            version: (_ua.match( /.+(?:me|ox|on|rv|it|era|opr|ie|edge)[\/: ]([\d.]+)/ ) || [0,'0'])[1],
            opera: (/opera/i.test(_ua) || /opr/i.test(_ua)),
            vivaldi: /vivaldi/i.test(_ua),
            msie: (/msie/i.test(_ua) && !/opera/i.test(_ua) || /trident\//i.test(_ua)) || /edge/i.test(_ua),
            msie6: (/msie 6/i.test(_ua) && !/opera/i.test(_ua)),
            msie7: (/msie 7/i.test(_ua) && !/opera/i.test(_ua)),
            msie8: (/msie 8/i.test(_ua) && !/opera/i.test(_ua)),
            msie9: (/msie 9/i.test(_ua) && !/opera/i.test(_ua)),
            msie_edge: (/edge/i.test(_ua) && !/opera/i.test(_ua)),
            mozilla: /firefox/i.test(_ua),
            chrome: /chrome/i.test(_ua) && !/edge/i.test(_ua),
            safari: (!(/chrome/i.test(_ua)) && /webkit|safari|khtml/i.test(_ua)),
            iphone: /iphone/i.test(_ua),
            ipod: /ipod/i.test(_ua),
            iphone4: /iphone.*OS 4/i.test(_ua),
            ipod4: /ipod.*OS 4/i.test(_ua),
            ipad: /ipad/i.test(_ua),
            android: /android/i.test(_ua),
            bada: /bada/i.test(_ua),
            mobile: /iphone|ipod|ipad|opera mini|opera mobi|iemobile|android/i.test(_ua),
            msie_mobile: /iemobile/i.test(_ua),
            safari_mobile: /iphone|ipod|ipad/i.test(_ua),
            opera_mobile: /opera mini|opera mobi/i.test(_ua),
            opera_mini: /opera mini/i.test(_ua),
            mac: /mac/i.test(_ua),
            search_bot: /(yandex|google|stackrambler|aport|slurp|msnbot|bingbot|twitterbot|ia_archiver|facebookexternalhit)/i.test(_ua)
        };
    };


    return userAgentF
}