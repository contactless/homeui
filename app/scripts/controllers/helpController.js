/**
 * Created by ozknemoy on 21.06.2017.
 */

export default function HelpCtrl ($http,userAgentFactory) {
    'ngInject';

    this.downloadPdf = function (url,event) {
        var browser = userAgentFactory.getBrowser(),ObjectURL;
        function insertAfter(elem, refElem) {
            return refElem.parentNode.insertBefore(elem, refElem.nextSibling);
        }

        $http.get('someUrl', {responseType: 'arraybuffer'}).then(d=> {
            var file;
            try {
                file = new Blob([d.data], {type: 'application/pdf'})
            }
            catch (e) {
                window.BlobBuilder = window.BlobBuilder ||
                    window.WebKitBlobBuilder ||
                    window.MozBlobBuilder ||
                    window.MSBlobBuilder;
                if ( browser=='IE' && window.navigator.msSaveOrOpenBlob) {
                    window.navigator.msSaveOrOpenBlob(ObjectURL, 'contract.pdf');
                    return
                } else if (e.name == 'TypeError' && window.BlobBuilder) {
                    var bb = new BlobBuilder();
                    bb.append(d.data);
                    file = bb.getBlob('application/pdf')
                }
                else if (e.name == "InvalidStateError") {
                    file = new Blob([d.data], {type: 'application/pdf'})
                }
                else {
                    console.log('Ваш браузер не поддерживает загрузку файлов по этому протоколу')
                }
            }

            let a = document.createElement('a');
            ObjectURL = window.URL.createObjectURL(file);
            a.href = ObjectURL;
            a.download = 'contract.pdf';
            a.target = '_blank';
            a.innerHTML = ' Cкачать';
            document.body.appendChild(a);
            insertAfter(a,event.currentTarget);
            setTimeout(function () {
                a.click();
            }, 400);
        });
    };
}