/**
 * angular-validation - v1.1 - 2014-05-02
 * https://github.com/ghiscoding/angular-validation
 * @author: Ghislain B.
 *
 * @desc: If a field becomes invalid, the text inside the error <span> or <div> will show up because the error string gets filled
 * Though when the field becomes valid then the error message becomes an empty string, 
 * it will be transparent to the user even though the <span> still exist but becomes invisible since the text is empty.
 *
 * Version 1.1: only start validating after user inactivity, 
 * it could also be passed as an argument for more customization of the inactivity timeout (typing-limit)
 */
 angular.module('ghiscoding.validation', ['pascalprecht.translate'])
  .directive('validation', function($translate, $timeout) {
    return {
      require: "ngModel",
      link: function(scope, elm, attrs, ctrl) {
        // constant of default typing limit in ms
        var TYPING_LIMIT = 1000; 
        
        var timer;
        var typingLimit = (attrs.hasOwnProperty('typingLimit')) ? parseInt(attrs.typingLimit, 10) : TYPING_LIMIT;

        // get the validation attributes which are the list of validators  
        var validationAttr = attrs.validation;

        // define the variables we'll use 
        var regexMessage;    
        var regexPattern;
        var validations;       
        var validators = [];

        // by default we'll consider field not required if not required then no need to validate empty value..right
        // if validation attribute calls it then we'll validate
        var isFieldRequired = false; 
                
        // We first need to see if the validation holds a regex, if it does treat it first
        // So why treat it separately? Because a Regex might hold pipe '|' and so we don't want to mix it with our regular validation pipe
        // Return string will have the complete regex pattern removed but we will keep ':regex' so that we can still loop over it
        if(validationAttr.indexOf("regex:") >= 0) {
          var matches = validationAttr.match("regex:(.*?):regex");
          var regAttrs = matches[1].split(':=');
          regexMessage = regAttrs[0];    
          regexPattern = regAttrs[1];

          // rewrite the validationAttr so that it doesn't contain the regex: ... :regex ending  
          // we simply remove it so that it won't break if there's a pipe | inside the actual regex
          validationAttr = validationAttr.replace(matches[0], 'regex:');
        } 

        // at this point it's safe to split with pipe (since regex was previously stripped out)
        validations = validationAttr.split('|'); 

        if(validations) {
          for(var i = 0, ln = validations.length; i < ln; i++) {
            var params = validations[i].split(':');
            switch(params[0]) {
              case "alpha" :
                validators[i] = {
                  pattern: "^([a-zÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðòóôõöùúûüýÿ])+$",
                  message: "INVALID_ALPHA",
                  type: "regex"
                };
                break;
              case "alphaSpaces" :  
              case "alpha_spaces" :   
                validators[i] = {
                  pattern: "^([a-zÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðòóôõöùúûüýÿ\\s])+$",
                  message: "INVALID_ALPHA_SPACE",
                  type: "regex"
                };
                break;
              case "alphaNum" :  
              case "alpha_num" :
                validators[i] = {
                  pattern: "^([a-z0-9ÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðòóôõöùúûüýÿ])+$",
                  message: "INVALID_ALPHA_NUM",
                  type: "regex"
                };
                break;
              case "alphaNumSpaces" :
              case "alpha_num_spaces" :
                validators[i] = {
                  pattern: "^([a-z0-9ÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðòóôõöùúûüýÿ\\s])+$",
                  message: "INVALID_ALPHA_NUM_SPACE",
                  type: "regex"
                };
                break;
              case "alphaDash" :
              case "alpha_dash" :
                validators[i] = {
                  pattern: "^([a-z0-9ÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðòóôõöùúûüýÿ_-])+$",
                  message: "INVALID_ALPHA_DASH",
                  type: "regex"
                };
                break;
              case "alphaDashSpaces" :
              case "alpha_dash_spaces" :
                validators[i] = {
                  pattern: "^([a-z0-9ÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðòóôõöùúûüýÿ\\s_-])+$",
                  message: "INVALID_ALPHA_DASH_SPACE",
                  type: "regex"
                };
                break;
              case "betweenLen" :
              case "between_len" :
                var range = params[1].split(',');
                validators[i] = {
                  pattern: "^.{" + range[0] + "," + range[1] + "}$",
                  message: "INVALID_BETWEEN_CHAR",
                  params: [range[0], range[1]],
                  type: "regex"
                };        
                break;
              case "betweenNum" :
              case "between_num" :
                var range = params[1].split(',');
                validators[i] = {
                  condition: [">=","<="],
                  message: "INVALID_BETWEEN_NUM",
                  params: [range[0], range[1]],
                  type: "condition_num"
                };
                break;
              case "creditCard" :
              case "credit_card" :
                validators[i] = {
                  pattern: "^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\\d{3})\\d{11})$",
                  message: "INVALID_CREDIT_CARD",
                  type: "regex"
                };
                break;
              case "dateIso" :
              case "date_iso" :
                validators[i] = {
                  pattern: "^(19|20)\\d\\d([-])(0[1-9]|1[012])\\2(0[1-9]|[12][0-9]|3[01])$",
                  message: "INVALID_DATE_ISO",
                  type: "regex"
                };
                break;  
              case "dateUsLong" :
              case "date_us_long" :
                validators[i] = {
                  pattern: "^(0[1-9]|1[012])[-/](0[1-9]|[12][0-9]|3[01])[-/](19|20)\\d\\d$",
                  message: "INVALID_DATE_US_LONG",
                  type: "regex"
                };
                break;
              case "dateUsShort" :
              case "date_us_short" :
                validators[i] = {
                  pattern: "^(0[1-9]|1[012])[-/](0[1-9]|[12][0-9]|3[01])[-/]\\d\\d$",
                  message: "INVALID_DATE_US_SHORT",
                  type: "regex"
                };
                break;  
              case "dateEuroLong" :
              case "date_euro_long" :
                validators[i] = {
                  pattern: "^(0[1-9]|[12][0-9]|3[01])[-/](0[1-9]|1[012])[-/](19|20)\\d\\d$",
                  message: "INVALID_DATE_EURO_LONG",
                  type: "regex"
                };
                break;  
              case "dateEuroShort" :
              case "date_euro_short" :
                validators[i] = {
                  pattern: "^(0[1-9]|[12][0-9]|3[01])[-/](0[1-9]|1[012])[-/]\\d\\d$",
                  message: "INVALID_DATE_EURO_SHORT",
                  type: "regex"
                };
                break;  
              case "email" :
                validators[i] = {
                  pattern: "^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$",
                  message: "INVALID_EMAIL",
                  type: "regex"
                };
                break;
              case "exactLen" :
              case "exact_len" :
                validators[i] = {
                  pattern: "^.{" + params[1] + "}$",
                  message: "INVALID_EXACT_LEN",
                  params: [params[1]],
                  type: "regex"                  
                };
                break; 
              case "float" :
                validators[i] = {
                  pattern: "^\\d+[\\.]+\\d+$",
                  message: "INVALID_FLOAT",
                  type: "regex"
                };
                break;
              case "floatSigned" :
              case "float_signed" :
                validators[i] = {
                  pattern: "^[+-]?\\d+[\\.]+\\d+$",
                  message: "INVALID_FLOAT_SIGNED",
                  type: "regex"
                };
                break;
              case "iban" :
                validators[i] = {
                  pattern: "[a-zA-Z]{2}[0-9]{2}[a-zA-Z0-9]{4}[0-9]{7}([a-zA-Z0-9]?){0,16}",
                  message: "INVALID_IBAN",
                  type: "regex"
                };
                break; 
              case "integer" :
                validators[i] = {
                  pattern: "^\\d+$",
                  message: "INVALID_INTEGER",
                  type: "regex"
                };
                break;
              case "integerSigned" :
              case "integer_signed" :
                validators[i] = {
                  pattern: "^[+-]?\\d+$",
                  message: "INVALID_INTEGER_SIGNED",
                  type: "regex"
                };
                break; 
              case "ipv4" :
                validators[i] = {
                  pattern: "^(25[0-5]|2[0-4]\\d|[0-1]?\\d?\\d)(\\.(25[0-5]|2[0-4]\\d|[0-1]?\\d?\\d)){3}$",
                  message: "INVALID_IPV4",
                  type: "regex"
                };
                break; 
              case "ipv6" :
                validators[i] = {
                  pattern: "^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$",
                  message: "INVALID_IPV6",
                  type: "regex"
                };
                break; 
              case "ipv6_hex" :
                validators[i] = {
                  pattern: "^((?:[0-9A-Fa-f]{1,4}(?::[0-9A-Fa-f]{1,4})*)?)::((?:[0-9A-Fa-f]{1,4}(?::[0-9A-Fa-f]{1,4})*)?)$",
                  message: "INVALID_IPV6_HEX",
                  type: "regex"
                };
                break; 
              case "maxLen" :
              case "max_len" :
                validators[i] = {
                  pattern: "^.{0," + params[1] + "}$",
                  message: "INVALID_MAX_CHAR",
                  params: [params[1]],
                  type: "regex"
                };
                break;
              case "max_num" :
                validators[i] = {
                  condition: "<=",
                  message: "INVALID_MAX_NUM",
                  params: [params[1]],
                  type: "condition_num"
                };
                break;
              case "minLen" :
              case "min_len" :
                validators[i] = {
                  pattern: "^.{" + params[1] + ",}$",
                  message: "INVALID_MIN_CHAR",
                  params: [params[1]],
                  type: "regex"
                };
                break;
              case "min_num" :
                validators[i] = {
                  condition: ">=",
                  message: "INVALID_MIN_NUM",
                  params: [params[1]],
                  type: "condition_num"
                };
                break; 
              case "numeric" :
                validators[i] = {
                  pattern: "^\\d+[\\.]?\\d*$",
                  message: "INVALID_NUMERIC",
                  type: "regex"
                };
                break; 
              case "numeric_signed" :
                validators[i] = {
                  pattern: "^[-+]?\\d+[\\.]?\\d*$",
                  message: "INVALID_NUMERIC_SIGNED",
                  type: "regex"
                };
                break;
              case "regex" :
                // Regex is a special case, the regexMessage & regexPattern variables
                // were created and dealt separately prior to the for loop
                validators[i] = {
                  pattern: regexPattern,
                  message: "INVALID_PATTERN",
                  params: [regexMessage],
                  type: "regex"
                };
                break;
              case "required" :
                isFieldRequired = true;
                validators[i] = {
                  pattern: "\\S+",
                  message: "INVALID_REQUIRED",
                  type: "regex"
                };
                break;
              case "url" :
                validators[i] = {
                  pattern: "(http|ftp|https):\\/\\/[\\w\\-_]+(\\.[\\w\\-_]+)+([\\w\\-\\.,@?^=%&amp;:/~\\+#]*[\\w\\-\\@?^=%&amp;/~\\+#])?",
                  message: "INVALID_URL",
                  type: "regex"
                };
                break;
              case "time" :
                validators[i] = {
                  pattern: "^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$",
                  message: "INVALID_TIME",
                  type: "regex"
                };
                break;

            } // end of switch() 
          } // end of for()         
        } // end of if()
        
        /** We seem to have little problems validating a field of <input type="number"> 
          * as angular reports undefined value even though user could type invalid chars
          * Bind trigger to block alpha chars completely except these: numbers, decimal and dash
          */
        var bindBlockingCharsOnInputNumber = function() {
          // get some properties of the inspected element
          var elmTagName = elm.prop('tagName').toUpperCase();
          var elmType = elm.prop('type').toUpperCase();
          
          // block chars completely, except numbers, decimal and dash
          if(elmTagName === "INPUT" && elmType === "NUMBER") {
            elm.bind('keydown', function(evt) {              
              var charCode = (evt.which) ? evt.which : ((typeof event !== "undefined") ? event.keyCode : undefined);
              if(typeof charCode === "undefined") {
                evt.preventDefault();
                return false;
              }              
              if (charCode > 31 && (charCode != 46 && ((charCode < 48 || charCode > 57) && charCode < 96 || charCode > 105)) && (charCode != 190 && charCode != 110 && charCode != 109 && charCode != 173)) {
                evt.preventDefault();
                return false;
              }else {
                return true;
              }
            });            
          }
        }

        /** Cancel current validation test and blank any leftover error message */
        var cancelValidation = function() {
          $timeout.cancel(timer);
          updateErrorMsg("");
          ctrl.$setValidity('validation', true);             
          elm.unbind('blur'); // unbind onBlur else it will fail if input became dirty & empty
        }

        /** Test values with condition, I have created a switch case for all possible conditions.
         * @var String condition: condition to filter with
         * @var any value1: 1st value to compare, the type could be anything (number, String or even Date)
         * @var any value2: 2nd value to compare, the type could be anything (number, String or even Date)
         * @return boolean: a boolean result of the tested condition (true/false)
         */
        var testCondition = function(condition, value1, value2) {
            var resultCond = false;
      
            switch (condition) {
                case '<': resultCond = (value1 < value2) ? true : false;
                    break;
                case '<=': resultCond = (value1 <= value2) ? true : false;
                    break;
                case '>': resultCond = (value1 > value2) ? true : false;
                    break;
                case '>=': resultCond = (value1 >= value2) ? true : false;
                    break;
                case '!=':
                case '<>': resultCond = (value1 != value2) ? true : false;
                    break;
                case '=':
                case '==': resultCond = (value1 == value2) ? true : false;
                    break;
            }
            return resultCond;
        }

        /** in general we will display error message at the next element after our input
          * but in some cases user want to define which DOM id to display error (as validation attribute)
          * @param bool isFieldValid: is the field valid?
          * @param string message: error message to display
          */
        var updateErrorMsg = function(message, isFieldValid) {
          var hasValidation = (typeof isFieldValid === "undefined") ? false : true;
          var errorElm = (attrs.hasOwnProperty('validationErrorTo'))
            ? angular.element(document.querySelector('#'+attrs.validationErrorTo))
            : elm.next();

          // Re-Render Error display element inside the <span> or <div>
          if(typeof errorElm !== "undefined") {
            if(hasValidation && !isFieldValid && ctrl.$dirty) {
              // Not valid & dirty, display the message
              errorElm.text(message);
            }else {
              // element is prestine or there's no validation applied, error message has to be blank
              errorElm.text("");   
            }
          }
        }

        /** Validate function, from the input value it will go through all validators (separated by pipe)
         *  that were passed to the input element and will validate it. If field is invalid it will update
         *  the error text of the span/div element dedicated for that error display.
         * @param string value: value of the input field
         */
        var validate = function(strValue) {
          var isValid = true;
          var isFieldValid = true;
          var message = "";
          var regex;          

          // loop through all validations (could be multiple)
          for(var j = 0, jln = validators.length; j < jln; j++) {
            if(validators[j].type === "condition_num") { 
              // a condition type
              if(validators[j].params.length == 2) {
                // typically a "between" condition, a range of number >= and <= 
                var isValid1 = testCondition(validators[j].condition[0], parseFloat(strValue), parseFloat(validators[j].params[0]));
                var isValid2 = testCondition(validators[j].condition[1], parseFloat(strValue), parseFloat(validators[j].params[1]));
                isValid = (isValid1 && isValid2) ? true : false;
              }else {
                isValid = testCondition(validators[j].condition, parseFloat(strValue), parseFloat(validators[j].params[0]));
              }
            }else {
              // run the Regex test through each iteration
              regex = new RegExp(validators[j].pattern, 'i');
              isValid = (validators[j].pattern === "required" && typeof strValue === "undefined") ? false : regex.test(strValue);
            }
            if(!isValid) {
              isFieldValid = false;              
              message += $translate(validators[j].message);              

              // replace any error message params that were passed              
              if(typeof validators[j].params !== "undefined") {
                for(var k = 0, kln = validators[j].params.length; k < kln; k++) { 
                  message = message.replace((':param'), validators[j].params[k]);
                }                
              }
            } // end !isValid
          } // end for() loop

          // -- Error Display --//
          updateErrorMsg(message, isFieldValid);

          return isFieldValid;
        }

        /** Validator function to attach to the element, this will get call whenever the input field is updated
         *  and is also customizable through the (typing-limit) for which inactivity timer will trigger validation.
         * @param string value: value of the input field
         */
        var validator = function(value) { 
          // if field is not required and his value is empty, cancel validation and exit out
          if(!isFieldRequired && (value === "" || typeof value === "undefined")) {
            cancelValidation();
            return value;
          }

          // attach/bind trigger on a <input type="number"/> and only allow: numbers, decimal and dash
          bindBlockingCharsOnInputNumber();

          // invalidate field before doing any validation 
          ctrl.$setValidity('validation', false); 

          // onBlur make validation without waiting
          elm.bind('blur', function() {  
            // make the regular validation of the field value
            scope.$apply(ctrl.$setValidity('validation', validate(value) )); 
            return value;
          });

          // onKeyDown event is the default of Angular, no need to even bind it, it will fall under here anyway
          // in case the field is already pre-filled, we need to validate it without looking at the event binding
          if(value !== "" && typeof value !== "undefined") {
            // Make the validation only after the user has stopped activity on a field
            // everytime a new character is typed, it will cancel/restart the timer & we<ll erase any error mmsg
            updateErrorMsg("");
            $timeout.cancel(timer);            
            timer = $timeout(function() {  
              ctrl.$setValidity('validation', validate(value));
            }, typingLimit);
          }

          return value;        
        }; // end of validator()

        // attach the Validator object to the element
        ctrl.$parsers.unshift(validator);
        ctrl.$formatters.unshift(validator);

        // for the case of field that might be ng-disabled, we should skip validation
        // Observe the angular disabled attribute
        attrs.$observe("disabled",function(disabled) {
            if(disabled){
                // Turn off validation when disabled
                ctrl.$setValidity('validation', true);
            } else {
                // Re-Validate the input when enabled
                ctrl.$setValidity('validation', validate(ctrl.$viewValue));
            }
        });

      } // end of link: function()
    }; // end of return;
  }); // end of directive