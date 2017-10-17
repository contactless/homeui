class ScriptsCtrl {
  constructor(EditorProxy, whenMqttReady, errors, rolesFactory) {
    'ngInject';

    this.EditorProxy = EditorProxy;
    this.errors = errors;
    this.haveRights = rolesFactory.checkRights(rolesFactory.ROLE_THREE);
    if(!this.haveRights) return;
    /*
     get list
     /rpc/v1/wbrules/Editor/List/contactless-uLo93IW6a0 {"id":1,"params":{}}
     get one
     * /rpc/v1/wbrules/Editor/Load/contactless-Usf4VuT4Ba {"id":2,"params":{"path":"rules.js"}}
     save
     /rpc/v1/wbrules/Editor/Save/contactless-Usf4VuT4Ba {"id":3,"params":{"path":"rules.js","content": ....
     */

    this.renamedScripts = [];
    this.deletedScripts = [];

    whenMqttReady().then( ()=>
        EditorProxy.List()
    ).then(scripts=> {
      // пишу каждому временное имя
      this.scripts = scripts.map(script=> {
        script.tempName = script.virtualPath;
        return script
      })
    }).catch(errors.catch("Error listing the scripts"));
  }

  renameMode(index) {
    this.renamedScripts[index] = true
  }

  undoRename(index) {
    this.renamedScripts[index] = false
  }

  save(index) {
    var path = this.scripts[index].virtualPath;
    if (path == this.scripts[index].tempName) return;
    // приходится сначала запрашивать скрипт изза отсутствия поля контент в списке скриптов
    this.EditorProxy.Load({path}).then(script=>{
      console.log("script",script);
      this.EditorProxy.Save({
            path,
            content: script.content
          })
          .then(data=> {
            // after save
            this.scripts[index].virtualPath = this.scripts[index].tempName;
            this.renamedScripts[index] = false
          })
          .catch(this.errors.catch("Error saving the file"))
    })
  }

  restart(index) {
    this.EditorProxy.Save({
      path: this.scripts[index].virtualPath,
      restart: true
    })
  }

  toggleScript(index) {//отключить/включить
    this.EditorProxy.Save({
      path: this.scripts[index].virtualPath,
      value: !this.scripts[index].value
    })

  }

  deleteScript(index) {
    if(confirm('Are you sure?')) {
      this.EditorProxy.Remove({path: this.scripts[index].virtualPath}).then(script=>{
        this.scripts.splice(index,1);
      },err=>alert("error"))
    }

  }
}

//-----------------------------------------------------------------------------
export default angular
    .module('homeuiApp.scripts', [])
    .controller('ScriptsCtrl', ScriptsCtrl);
