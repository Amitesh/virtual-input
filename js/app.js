(function(name, definition) {
  if (typeof define === 'function') { // AMD
    define(definition);
  } else if (typeof module !== 'undefined' && module.exports) { // Node.js
    module.exports = definition();
  } else { // Browser
    var theModule = definition(),
      global = this,
      old = global[name];
    theModule.noConflict = function() {
      global[name] = old;
      return theModule;
    };
    global[name] = theModule;
  }
})('calculateSize', function() {

  function createDummyElement(text, options) {
    var element = document.createElement('div'),
      textNode = document.createTextNode(text);

    element.appendChild(textNode);

    element.style.fontFamily = options.font;
    element.style.fontSize = options.fontSize;
    element.style.fontWeight = options.fontWeight;
    element.style.position = 'absolute';
    element.style.visibility = 'hidden';
    element.style.left = '-999px';
    element.style.top = '-999px';
    element.style.width = 'auto';
    element.style.height = 'auto';
    element.style.whiteSpace = 'nowrap';

    document.body.appendChild(element);

    return element;
  }

  function destoryElement(element) {
    element.parentNode.removeChild(element);
  }

  var cache = {}

  return function(text, options) {

    var cacheKey = JSON.stringify({ text: text, options: options });

    if (cache[cacheKey]) {
      return cache[cacheKey];
    }

    // prepare options
    options = options || {};
    options.font = options.font || 'Times';
    options.fontSize = options.fontSize || '16px';
    options.fontWeight = options.fontWeight || 'normal';

    var size = {}, element;

    element = createDummyElement(text, options);

    size.width = element.offsetWidth;
    size.height = element.offsetHeight;

    destoryElement(element);

    cache[cacheKey] = size;

    return size;
  };

});




angular.module('virtualInputApp', [])
  .controller('VIController', function($scope, $timeout) {
    $scope.inputText = '';
    $scope.isRegister = false;
    
    var vi = new VirtualInput('#virtual-input-elem', null, -1);

    $scope.register = function($event){
      vi.register(onKeyInput);
      $scope.isRegister = true;

      var placeholder = $('#virtual-input-elem').attr('placeholder');
      if(placeholder){
        vi.setText({output: placeholder, cursorPosition: vi.getCursorPosition()});
      }


      vi.setFocus();

      $event && $event.preventDefault();
    };

    $scope.deregister = function($event){
      vi.deregister();
      $scope.isRegister = false;

      $event && $event.preventDefault();
    };

    $scope.triggerKey = function($event){
      if(!$scope.isRegister){
        return;
      }

      var elem = $event.target;
      var key = $(elem).data('key');
      
      vi.getMousetrap().trigger(key);
      vi.setFocus();

      $event.preventDefault();
    }

    $scope.submit = function(){
      alert('submit your data...');
    };

    $scope.getLength = function(){
      return $('#virtual-input-elem').find('.vi-letter').size();
    }

    function onKeyInput(info){
      // console.log('in onKeyInput =>', info);
      
      if(info.key == 'backspace'){
        info.event.preventDefault();
      }

      $timeout(function(){
        vi.setText(info);
        $scope.inputText = info.output;
        if(info.key == 'enter'){
          $scope.deregister();
          $scope.submit();
        }
      });
    }

    // $scope.$on('$viewContentLoaded', function(event) {
    //   alert(2);
    //   console.log('viewContentLoaded');
    // });

    // $scope.$on('$destroy', function() {
    //   alert(3);
    //   console.log('destroy');
    //   Mousetrap.unbind('a');
    // });
  });

  

