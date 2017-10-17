import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/javascript/javascript';

class ScriptCtrl {
  constructor($scope, $stateParams, $timeout, EditorProxy, whenMqttReady, gotoDefStart, $location, PageState, errors, rolesFactory) {
    'ngInject';

    this.haveRights = rolesFactory.checkRights(rolesFactory.ROLE_THREE);
    if(!this.haveRights) return;

    var cm, pos = null;
    $scope.canSave = function () {
      return PageState.isDirty();
    };
    $scope.file = {
      isNew: !$stateParams.hasOwnProperty("path"),
      path: $stateParams.path,
      loaded: false,
      content: ""
    };

    if (!$scope.file.isNew) {
      var m = $scope.file.path.match(/\/D(\d+):(\d+)$/);
      if (m) {
        $scope.file.path = $scope.file.path.substring(0, m.index);
        pos = CodeMirror.Pos(m[1] - 0, m[2] - 0);
      }
    }

    $scope.codeMirrorLoaded = function(_cm){
      cm = _cm;
      cm.focus();
    };

    function showError (message, traceback, setCursor) {
      var errorLine = null;
      errors.showError("Script error", message);

      if (!traceback || !traceback.length)
        return;

      for (var i = 0; i < traceback.length; i++) {
        if (traceback[i].name == $scope.file.path) {
          errorLine = traceback[i].line - 1;
          break;
        }
      }
      if (errorLine != null)
        $timeout(function () {
          cm.addLineClass(errorLine, "wrap", "script-error-line");
          cm.markText({ line: errorLine, ch: 0 },
                      { line: errorLine + 1, ch: 0 },
                      { title: message.replace(/\n.*/g, "") });
          if (setCursor) {
            // FIXME: this scrollIntoView() doesn't seem to work here
            // cm.scrollIntoView({ line: errorLine, ch: 0 });
            cm.setCursor(errorLine, 0);
            $(".script-error-line").get(0).scrollIntoView();
          }
        });
    }

    // AngularJS expression parser seemingly chokes on Infinity,
    // thinks its a variable name (?)
    $scope.vpMargin = Infinity;
    $scope.save = function save () {
      if (!$scope.file.isNew && !$scope.file.loaded)
        return;
      EditorProxy.Save({ path: $scope.file.path, content: $scope.file.content })
        .then(function (reply) {
          if ($scope.file.isNew || pos !== null) {
            // clear pos in the url after saving to be able
            // to navigate to errors
            $location.path("/scripts/edit/" + reply.path);
          } else {
            cm.focus();
            cm.setValue(cm.getValue()); // clear line classes / marks
            if (reply.error)
              showError(reply.error, reply.traceback);
            else
              errors.hideError();
          }
        })
        .catch(errors.catch("Error saving the file"));
    };

    if (!$scope.file.isNew) {
      whenMqttReady().then(function () {
        return EditorProxy.Load({ path: $scope.file.path });
      }).then(function (r) {
        $scope.file.content = r.content;
        $scope.file.loaded = true;
        if (pos !== null) {
          $timeout(function () {
            cm.setCursor(pos.line, pos.ch);
            // FIXME: this scrollIntoView() doesn't seem to work here
            // cm.scrollIntoView(pos);
            cm.addLineClass(pos.line, "wrap", "script-target-line");
            $(".script-target-line").get(0).scrollIntoView();
            gotoDefStart(cm);
          });
        }
        if (r.error)
          showError(
            r.error.message,
            r.error.traceback,
            // only jump to error location if postition wasn't specified
            pos === null);
      }).catch(errors.catch("Error loading the file"));
    }
  }
}

//-----------------------------------------------------------------------------
export default angular
    .module('homeuiApp.script', [])
    .controller('ScriptCtrl', ScriptCtrl);
