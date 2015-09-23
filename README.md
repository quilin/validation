# validation
Another clientside validation library

TODOs:
  1. Optimise generating the nodes for validation messages.
  2. Allow multiple validation messages to be displayed at once.
  3. Do the thing with formatted validation message output.
  4. Add input event handling strategies management.
  5. Validators priority

So far the library doesn't do much. It is written in order to work with ASP.NET MVC mostly, but can be user wherever.
  1. You need to create the html code and insert the input, with data-val attribute of "true". Only events from those input nodes will be caught.
   <input type="text" name="myField" data-val="true" />
  2. You need to select what validation rule will this input work with.
   <input type="text" name="myField" data-val="true" data-val-required="true" />
  3. When the input will throw "change" event library will initiate the validation with instructions of:
   - element must have data-val attribute of "true"
   - element must have some data-val-{validatorName} attributes of "true"
   - element may contain any number of data-val-{validatorName}-{validatorOption} attributes of any value
   - element may contain data-val-{validatorName}-message attribute of string value, which will be displayed if the element validation is violated
  4. After initiation of the input library will catch any "input" event from that input. You can stop it manually by calling $(input).removeData('validator'), although it's highly non-recommended.
  5. You can use default validators or create your own;

# default validators
## Required
```html
<input data-val-required="true" data-val-required-message="Field should not be empty!" />
```

# custom validators

$.validators.register(validatorOptions); // everything you need to call to register custom validator

## validatorOptions

It's simple object with following fields:

  1. name (String) - validator's name. It's required for it will be used in the markup.
  2. regex (RegExp) - if the validator's rule is so simple it can be described with only regex or the input must match regex before we do any further checks, you can pass it as a param.
  3. validate (Function) - this is the validation function.
```javascript
   function (value, options, evt) {
     // value is current input value
     // options is object that is generated from data-val-{validatorName}-{validatorOption} attributes (yes, -message is present here as well)
     // evt is original event that caused validation to start

     return new Promise(function (resolve, reject) {});
     // or!
     // return { whatever: 'you', want: '!' };
     // but care to return something that will be clearly converted to Boolean
   };
```
  4. defaultErrorMessage (String) - error message that will be displayed by default (if input has no -message attribute for current validator)
   
## example

Let's create two validators of common use:
```javascript
$.validators.register({
  name: 'number',
  regex: /^\d+((\.|\,)\d+)?$/,
  validate: function (value, options) {
    var number = parseInt(value),
        maxValue, minValue;
    if (Number.isNaN(number)) { return Promise.reject(); }
    if (options.maxValue && !Number.isNaN(maxValue = parseInt(options.maxValue)) && number > maxValue) {
      return Promise.reject(options.maxValueMessage);
    }
    if (options.minValue && !Number.isNaN(minValue = parseInt(options.minValue)) && number < minValue) {
      return Promise.reject(options.minValueMessage);
    }
    return Promise.resolve();
  },
  defaultErrorMessage: 'Enter any number!'
});
```
```html
<input type="text" data-val="true" data-val-number="true" data-val-number-message="Needs to be a number!" />
or
<input type="text" data-val="true" data-val-number="true" data-val-number-max-value="20" data-val-number-max-value-message="Number must be less or equal to 20" />
```

```javascript
$.validators.register({
  name: 'server',
  validate: $.debounce(function (value, options) {
    if (value.length < 2) { return Promise.resolve(); }
    return new Promise(function (resolve, reject) {
      $.ajax({
        url: options.url,
        type: options.type || "get",
        success: resolve,
        error: reject
      });
    });
  }, 1000),
  defaultErrorMessage: 'Something went wrong'
});
```

```html
<input type="text" data-val="true" data-val-server="true" data-val-server-url="/someApiMethod" data-val-server-type="get" data-val-server-message="Invalid input" />
```

Will become invalid if server answers with failed response or valid otherwize. Server can even send some error message as plain text and it will be displayed next to input.
