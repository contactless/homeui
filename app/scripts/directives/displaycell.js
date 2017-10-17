import template from './displaycell.html';

function displayCellDirective(displayCellConfig, $compile) {
  'ngInject';

  class DisplayCellController {
    constructor ($scope, $element, $attrs, handleData) {
      'ngInject';
      //this.$scope = $scope;
      this.cell = $scope.cell;
      //console.log("+++++++++this.cell",this.cell);

      //this.handleData = handleData;
    }

    /*copy() {
      console.log("this.parentName && this.cell.id",this.$scope.parentName , this.$scope.cell.id);

      if(this.parentName && this.cell.id) this.handleData.copyToClipboard(this.$scope.parentName + '/' + this.$scope.cell.id)
    }*/

    shouldDisplayCellName () {
      return !this.compact() &&
        !(displayCellConfig.displayTypes.hasOwnProperty(this.cell.displayType) &&
          displayCellConfig.displayTypes[this.cell.displayType].noSeparateName);
    }
  }

  return {
    restrict: 'EA',
    require: '^cell',
    scope: false,// нельзя изолировать
    replace: true,
    bindToController: {
      compact: '&',
      overrideName: '&'
    },
    controller: DisplayCellController,
    // XXX: note that the property usually appears on the scope
    // created by 'cell' directive, so don't use two <display-cell>
    // directives within single 'cell' directive scope
    controllerAs: 'displayCellCtrl',
    template,
    link: (scope, element, attrs) => {

      scope.$watch(() => scope.cell.displayType, displayType => {
        var directive = (displayCellConfig.displayTypes.hasOwnProperty(displayType) ?
                         displayCellConfig.displayTypes[displayType] :
                         displayCellConfig.displayTypes['text']).directive;
        element.find('> *:not(h4)').remove();
        $compile('<' + directive + '></' + directive + '>')(scope, (clonedElement) => {
          element.append(clonedElement);
        });
      });
    }
  };
}

//-----------------------------------------------------------------------------
function displayCellConfig() {
  'ngInject';
  angular.extend(this, {
    displayTypes: {},
    addDisplayType (displayType, directive, noSeparateName) {
      this.displayTypes[displayType] = {
        directive: directive,
        noSeparateName: noSeparateName || false
      };
    },
    $get () {
      return this;
    }
  });
}

//-----------------------------------------------------------------------------
export {displayCellDirective, displayCellConfig};
