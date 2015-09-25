(function ($) {
		$(document)
		.on('input.__vl__', '[data-val="true"]', function (evt) {
			var $this = $(this);
			var validator = $this.data('validator');
			if (validator !== undefined) {
				validator.validate(evt);
			}
		})
		.on('change.__vl__', '[data-val="true"]', function (evt) {
			var $this = $(this),
				validator = $this.data('validator');

			if (validator === undefined) {
				$this.data('validator', validator = ValidatorFactory.create($this));
				validator.validate(evt);
			}
		});

	$.validators = (function () {
		var validator = function (options) {
			this.name = options.name;
			this.validationFunction = options.validate;
			this.regex = options.regex;
			this.defaultErrorMessage = options.defaultErrorMessage;
		};
		validator.prototype = {
			validate: function (value, options, evt, element) {
				var validationResult = this.validationFunction
					? this.regex.test(value) && this.validationFunction.apply(element, [value, options, evt])
					: this.regex.test(value);
				return validationResult instanceof Promise
					? validationResult
					: !!validationResult
						? Promise.resolve()
						: Promise.reject(options.message || this.defaultErrorMessage);
			}
		};
		var emptyValidator = new validator({
			validate: function () { return true; }
		});
		var validators = [emptyValidator];

		var validatorsCollection = function () {};
		validatorsCollection.prototype = {
			get: function (name) {
				var match = validators.filter(function (v) {
					return v.name === name;
				});
				return match.length === 0
					? emptyValidator

					: match[0];
			},
			register: function (validatorOptions) {
				validators.push(new validator(validatorOptions));
			}
		};
		var collection = new validatorsCollection();
		collection.register({
			name: 'required',
			regex: /.+/,
			defaultErrorMessage: 'Введите что-нибудь!'
		});

		return new validatorsCollection();
	})();

	var ValidatorFactory = (function () {
		var factory = function () {};
		factory.prototype.create = function (el) {
			return new CompositeValidator(el);
		};
		return new factory();
	})();

	var CompositeValidator = function (el) {
		var validators = {},
			data = el.data();

		for (var dataProp in data) {
			var match = dataProp.match(/^(val)[A-Z][a-z]*$/);
			if (match === null) { continue; }
			var validatorName = match[0].slice(3).toLowerCase(); // valRequired -> required
			validators[validatorName] = $.validators.get(validatorName);
		}

		var getValidationOptions = function (validatorName) {
			var result = {},
				regex = new RegExp('^val' + validatorName.slice(0, 1).toUpperCase() + validatorName.slice(1) + '[A-Z][a-z]*$');
			for (var dataProp in data) {
				if (dataProp.match(regex)) {
					result[dataProp.slice(validatorName.length + 3).toLowerCase()] = data[dataProp];
				}
			}
			return result;
		};

		this.validate = function (evt) {
			var validations = [],
				value = el.val(),
				valMsg;
			for (var validatorName in validators) {
				validations.push(validators[validatorName].validate(value, getValidationOptions(validatorName), evt, el));
			}
			Promise.all(validations)
				.then(function () {
					el.removeClass('field-validation-error');
					var valMsg = el.data('valMsg')
					if (valMsg !== undefined) {
						valMsg.remove();
						el.removeData('valMsg');
					}
				}, function (err) {
					el.addClass('field-validation-error');
					var valMsg = el.data('valMsg');
					if (valMsg === undefined) {
						var msgContainer = el.closest('form [data-val-msg-for="' + el.attr('name') + '"]');
						if (msgContainer.length === 0) {
							msgContainer = $('[data-val-msg-for="' + el.attr('name') + '"]');
						}
						el.data('valMsg', $('<span/>', {
							text: err,
							'generated': true
						}).appendTo(msgContainer));
					}
				});
		};
	};
})(jQuery);
