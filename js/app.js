angular.module('virtualInputApp', [])
  .controller('VIController', function($scope, $timeout) {
    $scope.inputText = '';
    $scope.isRegister = false;
    
    var vi = new VirtualInput('#virtual-input-elem', null, 40);

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

  

