;(function($){
   'use strict';
  /**
   * A small plugin to create a virtual input
   * 
   * @author Amitesh Kumar
   * @date 4th March, 2016
   *
   * @usage
   * 
   */
  function VirtualInput(elem, keysList){
    this.mousetrap = null;
    this.isKeysBound = false;
    this.cursorPosition = 0;
    this.elem = $(elem);

    this.keysList = keysList || [
      // Special keys
      'backspace', 'del', 'enter', 'left', 'right', 'up', 'down', 'home', 'end', 'pageup', 'pagedown', 'capslock',

      '\'', '-', 

      
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N',
      'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
      'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 
      'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'
    ];

    this.keyProcessor = new KeyProcessor(this.keysList);
    this.callback = function(){};
  }

  VirtualInput.prototype.getMousetrap = function() {
    return this.mousetrap;
  };

  VirtualInput.prototype.register = function(callback) {
    var self = this;
    
    this.mousetrap = new Mousetrap($(this.elem).get(0));

    $(this.elem).on('focus', $.proxy( self.onFocus, self))
    .on('blur', $.proxy( self.onBlur, self))
    .on('click', $.proxy( self.onClick, self))
    .on('click', '.vi-letter', $.proxy( self.onSetCursorOnClick, self));

    this.callback = callback;
    this.bindKeys();
    this.setText({output: '', cursorPosition: this.getCursorPosition()});
  };

  VirtualInput.prototype.deregister = function() {
    $(this.elem).trigger('blur');

    $(this.elem).off('focus', this.onFocus)
    .off('blur', this.onBlur)
    .off('click', this.onClick)
    .off('click', '.vi-letter', self.onSetCursorOnClick);
    
    this.unbindKeys();
    this.mousetrap && this.mousetrap.destroy();

    delete this.mousetrap;
  }; 

  /**
   * TODO: Set the cursor at end on focus
   */
  VirtualInput.prototype.onFocus = function() {
    var self = this;
    $(this.elem).addClass('virtual-input-focus');
    $(this.elem).find('.vi-cursor').css({visibility: 'visible'});
  };

  VirtualInput.prototype.onBlur = function() {
    $(this.elem).removeClass('virtual-input-focus');
    $(this.elem).find('.vi-cursor').css({visibility: 'hidden'});
  };

  VirtualInput.prototype.onClick = function() {
    this.setFocus();
  };

  /**
   * TODO:
   * Set the cursor position on calculation of letter position. 
   * If clicked on left haft of letter then put it left of that 
   * letter else put on right
   */
  VirtualInput.prototype.onSetCursorOnClick = function(event){
    var clickedPos = $(event.target).index();
        clickedPos = this.getCursorPosition() > clickedPos ? clickedPos+1 : clickedPos;
    
    this.setText({
      output: this.getText(), 
      cursorPosition: clickedPos
    });
    return false
  };

  VirtualInput.prototype.getText = function() {
    return $(this.elem).find('.vi-letter').not('.vi-cursor').text();
  };

  VirtualInput.prototype.setText = function(info) {
    var htmlText = this.textFormatter(info.output, info.cursorPosition);
    return $(this.elem).html(htmlText);
  };

  VirtualInput.prototype.getCursorPosition = function() {
    return $('.vi-cursor', $(this.elem)).index();
  };


  VirtualInput.prototype.textFormatter = function(text, cursorPosition){
    var letters = text.split('');
    for(var i=0, len=letters.length; i<len; i++){
      letters[i] = '<span class="vi-letter">' + letters[i] + '</span>';
    }
    letters.splice(cursorPosition, 0, '<span class="vi-cursor">|</span>');
    
    return letters.join('');
  }

  VirtualInput.prototype.bindKeys = function() {
    if(this.isKeysBound){
      this.unbindKeys();
    }

    var self = this;
    var inputElem = $(self.elem).get(0);

      self.mousetrap.bind(self.keysList, function(e, char) {
        var info = self.keyProcessor.getProcessedInputInfo(self.getText(), char, self.getCursorPosition());
        self.cursorPosition = info.cursorPosition;
        self.callback(info);
      });

    self.isKeysBound = true;
  };

  VirtualInput.prototype.unbindKeys = function() {
    var inputElem = $(this.elem).get(0);
      
    this.mousetrap.unbind(this.keysList);
    this.isKeysBound = false;
  };

  VirtualInput.prototype.setFocus = function() {
    $(this.elem).get(0).focus();

    if(!this.isKeysBound){
      this.register();
    }
  };


  function KeyProcessor(keysList){
    this.keyList = keysList || [];

    var removeChar = function(text, cursorPosition){
      var cursorPosition = cursorPosition || 0;

      var b1 = text.slice(0, cursorPosition - 1),
          b2 = text.slice(cursorPosition, text.length),
          d  = text.charAt(cursorPosition-1);

      return b1 + b2;
    }

    var insertChar = function(text, char, cursorPosition){
      var cursorPosition = cursorPosition || 0;
      var letters = text.split('');
          letters.splice(cursorPosition, 0, char);

      return letters.join('');
    }

    return {
      getProcessedInputInfo: function(text, key, cursorPosition){
        cursorPosition = cursorPosition == null ? output.length : cursorPosition;

        var output = text,
          prevCursorPosition = cursorPosition,
          isSpecialKey = true;

          switch(key){
            case 'backspace':
              if(cursorPosition > 0 && output.length > 0){
                output = removeChar(output, cursorPosition);
                cursorPosition = cursorPosition - 1;
              }

              break;
            case 'del':
              if(cursorPosition >= 0 && output.length > 0){
                output = removeChar(output, cursorPosition + 1);
              }

              break;
            case 'left':
              cursorPosition = cursorPosition - 1;

              if(cursorPosition < 0){
                cursorPosition = 0;
              }
              break;
            case 'right':
              cursorPosition = cursorPosition + 1;
              
              if(cursorPosition > output.length){
                cursorPosition = output.length;
              }
              break;
            case 'up':
              cursorPosition = 0;
              break;
            case 'down':
              cursorPosition = output.length;
              break;
            case 'home':
              cursorPosition = 0;
              break;
            case 'end':
              cursorPosition = output.length;
              break;
             case 'pageup':
              cursorPosition = 0;
              break;
            case 'pagedown':
              cursorPosition = output.length;
              break;
            case 'enter':
              break;
            case 'capslock':
              break;
            default:
              isSpecialKey = false;
              output = insertChar(output, key, cursorPosition);
              cursorPosition = cursorPosition + 1;
          }

        return {
          key: key,
          input: text,
          output: output,
          prevCursorPosition: prevCursorPosition,
          cursorPosition: cursorPosition,
          isSpecialKey: isSpecialKey
        }
      }

    }
  }

  window.VirtualInput = VirtualInput;

})(jQuery);