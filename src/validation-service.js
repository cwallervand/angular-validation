/**
 * Angular-Validation Service (ghiscoding)
 * https://github.com/ghiscoding/angular-validation
 *
 * @author: Ghislain B.
 * @desc: angular-validation service definition
 * Provide a way to programmatically create validators and validate a form directly from within the controller.
 * This Service is totally independant from the Directive, it could be used separately but the minimum it needs is the `validation-rules.js` file.
 */
angular
	.module('ghiscoding.validation')
	.service('validationService', ['$timeout', 'validationCommon', function ($timeout, validationCommon) {
    // global variables 
    var validationAttrs;
    var commonObj;
    var timer;

    // service constructor
    var validationService = function() {
      this.validationAttrs = {};
      this.commonObj = new validationCommon();
    }

    // attach the public functions to our service
    validationService.prototype.addValidator = addValidator;
    validationService.prototype.removeValidator = removeValidator;
    validationService.prototype.setGlobalOptions = setGlobalOptions;

    return validationService;

	  //----
		// Public Functions declaration
		//----------------------------------

		/** Add a validator on a form element 
		 * @param object attrs: validator attributes
		 */
		function addValidator(var1, var2) {
      var self = this;

      var attrs = {};
      if(typeof var1 === "string" && typeof var2 === "string") {
        attrs.elmName = var1;
        attrs.rules = var2;
      }else {
        attrs = var1;
      }
      // Make sure that we have all required attributes to function properly
      if(typeof attrs !== "object" || !attrs.hasOwnProperty('elmName') || !attrs.hasOwnProperty('rules') || (!attrs.hasOwnProperty('scope') && typeof self.validationAttrs.scope === "undefined") ) {
        throw 'Angular-Validation-Service requires at least the following 3 attributes: {elmName, rules, scope}';
      }

      // find the DOM element & make sure it's an filled object before going further
      // we will exclude disabled/ng-disabled element from being valited
      attrs.elm = angular.element(document.querySelector('[name="'+attrs.elmName+'"]:not([disabled]):not([ng-disabled]'));
      if(typeof attrs.elm !== "object" || attrs.elm.length === 0) {
        return self;
      }

      // onBlur make validation without waiting
      attrs.elm.bind('blur', function(event) { 
        // re-initialize to use current element & remove waiting time & validate
        self.commonObj.initialize(attrs.scope, attrs.elm, attrs, attrs.ctrl);   
        self.commonObj.typingLimit = 0;
        attemptToValidate(self, event.target.value);
      });

      // merge both attributes but 2nd object (attrs) as higher priority, so that for example debounce property inside `attrs` as higher priority over `validatorAttrs`
      // so the position inside the mergeObject call is very important
      attrs = mergeObjects(self.validationAttrs, attrs); 

      // watch the element for any value change, validate it once that happen
			attrs.scope.$watch(attrs.elmName, function (newVal, oldVal) {
        if(newVal === undefined && oldVal !== undefined) {
          self.commonObj.updateErrorMsg("INVALID_KEY_CHAR", false, true);
          return;
        }
        // from the DOM element, find the Angular controller of this element & add value as well to list of attribtues
        attrs.ctrl = angular.element(attrs.elm).controller('ngModel');
        attrs.value = newVal;

        self.commonObj.initialize(attrs.scope, attrs.elm, attrs, attrs.ctrl);
        attemptToValidate(self, newVal);
		  }, true); // $watch()

      return self;
		} // addValidator()

    /** Remove a watcher 
     * @param array/string of element name(s) (name attribute)
     */
    function removeValidator(attrs) {
      var self = this;

      if(attrs instanceof Array) {
        for(var i = 0, ln = attrs.length; i < ln; i++) {
          removeWatcher(self, attrs[i]);          
        }
      }else {
        removeWatcher(self, attrs);        
      }      
    }

    /** Set and initialize global options used by all validators */
    function setGlobalOptions(attrs) {
      var self = this;
      self.validationAttrs = attrs; // save in global 

      return self;
    }

    //----
    // Private functions declaration
    //----------------------------------

    /** Validator function to attach to the element, this will get call whenever the input field is updated
     *  and is also customizable through the (typing-limit) for which inactivity this.timer will trigger validation.
     * @param string value: value of the input field
     */
    function attemptToValidate(self, value) { 
      // pre-validate without any events just to pre-fill our validationSummary with all field errors
      // passing false as 2nd argument for not showing any errors on screen
      self.commonObj.validate(value, false);
      
      // if field is not required and his value is empty, cancel validation and exit out
      if(!self.commonObj.isFieldRequired() && (value === "" || value === null || typeof value === "undefined")) {
        cancelValidation(self);
        return value;
      }

      // invalidate field before doing any validation 
      if(self.commonObj.isFieldRequired() || !!value) { 
        self.commonObj.ctrl.$setValidity('validation', false);
      }

      // select(options) will be validated on the spot
      if(self.commonObj.elm.prop('tagName').toUpperCase() === "SELECT") {
        self.commonObj.ctrl.$setValidity('validation', self.commonObj.validate(value, true));
        return value;
      }

      // onKeyDown event is the default of Angular, no need to even bind it, it will fall under here anyway
      // in case the field is already pre-filled, we need to validate it without looking at the event binding
      if(typeof value !== "undefined") {
        // Make the validation only after the user has stopped activity on a field
        // everytime a new character is typed, it will cancel/restart the timer & we'll erase any error mmsg
        self.commonObj.updateErrorMsg('');
        $timeout.cancel(self.timer);            
        self.timer = $timeout(function() {  
          self.commonObj.scope.$evalAsync(self.commonObj.ctrl.$setValidity('validation', self.commonObj.validate(value, true) ));
        }, self.commonObj.typingLimit);
      }

      return value;        
    } // attemptToValidate()

    /** Cancel current validation test and blank any leftover error message */
    function cancelValidation(obj) {
      $timeout.cancel(self.timer);
      obj.commonObj.updateErrorMsg('');
      obj.commonObj.ctrl.$setValidity('validation', true);             
      obj.commonObj.elm.unbind('blur'); // unbind onBlur event, if not it will fail when input become dirty & empty
    }

    /**
     * Overwrites obj1's values with obj2's and adds obj2's if non existent in obj1
     * @param obj1
     * @param obj2
     * @returns obj3 a new object based on obj1 and obj2
     */
    function mergeObjects(obj1,obj2) {
      var obj3 = {};
      for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
      for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
      return obj3;
    }

    /** Remove a watcher 
     * @param string elmName: element name (name attribute)
     */
    function removeWatcher(self, elmName) {
      if(typeof self.commonObj.scope === "undefined") {
        return;
      }
      // unbind the $watch
      var unbindWatcher = self.commonObj.scope.$watch(elmName, function (newVal, oldVal) {}); // $watch()
      unbindWatcher();

      // also unbind the blur directly applied on element
      var elm = angular.element(document.querySelector('[name="'+elmName+'"]'));
      elm.unbind('blur');
    }
}]);