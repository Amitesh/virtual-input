/**
 * A small plugin to create a virtual input
 *
 * @author Amitesh Kumar
 * @date 4th March, 2016
 *
 * @usage
 *  html markup - <div id="input-box-wt" tabindex="0" class="inputBox virtual-input" ></div>
 *  js :
 *  // Create instance of virtual input
 *  var vi = new VirtualInput('#' + inputBoxId);
 *  vi.register(callbackFunction);
 *  vi.deregister()
 *
 *  // To trigget key event
 *  vi.getMousetrap().trigger(key);
 *
 *
 * // Preventing quick finder (links only) for firefox
 *      if(/ * check if it is firefox * /){
 *           var event = info && info.event;
 *       
 *           if(event && info.key == "'"){
 *               event.preventDefault();
 *               event.stopPropagation();
 *           }
 *      }
 */

// import bowser from 'bowser';

;(function($){
  'use strict';

  function VirtualInput(elem, keysList, maxLength){ // maxLength => no of max chars
    this.mousetrap = null;
    this.isKeysBound = false;
    this.cursorPosition = 0;
    this.elem = $(elem);

    this.maxLength = maxLength || 20 || -1;

    this.keysList = keysList || [
          // Special keys
          'backspace', 'del', 'enter', 'left', 'right', 'up', 'down', 'home', 'end', 'pageup', 'pagedown',

          '\'', '-',

          'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l',
          'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
          'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N',
          'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
        ];

    this.keyProcessor = new KeyProcessor(this.keysList, this.maxLength);
    this.letterPlacer = new LetterPlacer(this.elem);
    this.callback = function(){};
  }

  VirtualInput.prototype.getMousetrap = function() {
    return this.mousetrap;
  };

  VirtualInput.prototype.clearInput = function() {
    this.setText({output: '', cursorPosition: this.getCursorPosition()});
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
    this.clearInput();
  };

  VirtualInput.prototype.deregister = function() {
    // There is issue to call blur function on trigger.
    if(bowser.msie){
      this.onBlur();
    }else{
      $(this.elem).trigger('blur');  
    }

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
    return $(this.elem).find('.vi-letter').not('.vi-cursor').not('.dummy-elem-ie-hack').text();
  };

  VirtualInput.prototype.setText = function(info) {
    var htmlText = this.textFormatter(info.output, info.cursorPosition);
    $(this.elem).html(htmlText);
    this.letterPlacer.setLettersPosition();
    // return $(this.elem);
  };

  VirtualInput.prototype.getCursorPosition = function() {
    return $('.vi-cursor', $(this.elem)).index();
  };


  VirtualInput.prototype.textFormatter = function(text, cursorPosition){
    var letters = text.split('');
    for(var i=0, len=letters.length; i<len; i++){
      letters[i] = '<span class="vi-letter">' + letters[i] + '</span>';
    }

    // There is cursor position issue for empty text in input box
    if(bowser.msie && letters.length == 0 ){
      var lettersSpan = '<span class="vi-letter dummy-elem-ie-hack">&nbsp;</span><span class="vi-cursor">|</span>';
      letters.splice(cursorPosition, 0, lettersSpan);
    }else{
      letters.splice(cursorPosition, 0, '<span class="vi-cursor">|</span>');
    }
    
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
      info.event = e;
      self.callback(info);
    });

    self.isKeysBound = true;
  };

  VirtualInput.prototype.unbindKeys = function() {
    try{
      var inputElem = $(this.elem).get(0);

      this.mousetrap.unbind(this.keysList);
      this.isKeysBound = false;
    }catch(e){
      //console.log('Error in Virtual input in unbindKeys')
    }
  };

  VirtualInput.prototype.setFocus = function() {
    $(this.elem).get(0).focus();

    if(!this.isKeysBound){
      this.register();
    }
  };


  function KeyProcessor(keysList, maxLength){
    this.keyList = keysList || [];
    var maxLength = maxLength || -1;

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

          default:
            isSpecialKey = false;
            if(!(maxLength > -1 && text.length >= maxLength )){
              output = insertChar(output, key, cursorPosition);
              cursorPosition = cursorPosition + 1;
            }
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

  function LetterPlacer(inputBox){
    var box = $(inputBox);

    return {
      getInputBoxWidth: function(){
        return box.width() - 0 /* padding */;
      },

      getLettersWidth: function(){
        var lettersWidth = 0;

        box.find('.vi-letter').each(function(i, l){
          lettersWidth += $(l).width();
        });
        return lettersWidth;
      },

      isLettersWidthGreaterThanInputBox: function(){
        var boxWidth = this.getInputBoxWidth();
        var lettersWidth = this.getLettersWidth();

        console.log('boxWidth =>', boxWidth, '   letter width =>', lettersWidth,  ' difference =>', lettersWidth - boxWidth);
        return lettersWidth > boxWidth;
      },

      setLettersPosition: function(){
        if(this.isLettersWidthGreaterThanInputBox()){
          console.log('set position...');
          var extraLen = this.getLettersWidth() - this.getInputBoxWidth(); // cache the width
          box.find('.vi-letter:first').css({'margin-left': -1 * extraLen});
        }
      }

    }
  }
  window.VirtualInput = VirtualInput;

})(jQuery);