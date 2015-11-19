(function (P, A) {
	A.prototype.pushRange = function (arr) {
		for (var i = 0; i < arr.length; ++i) {
			this.push(arr[i]);
		}

		return this.length;
	};

	P.waitAll = function (promises) {
		return new P(function (resolve, reject) {
			var errors = [];
			var successes = [];
			var counter = promises.length;

			var handle = function (results) {
				return function (data) {
					results.push(data);
					if (--counter === 0) {
						(errors.length ? reject : resolve)(successes, errors);
					}
				};
			};

			promises.forEach(function (p) {
				p
					.then(handle(successes))
				 	.catch(handle(errors));
			});
		});
	};

	P.tree = function (tree) {
		var errors = [];
		var successes = [];

		var handleResult = function (results, callback) {
			return function (data) {
				data && results.pushRange(data);
				callback && callback(data);
			};
		};


		var promiseSubtree = function (subtree) {
			if (!(subtree instanceof A)) {
				return new P(function (resolve, reject) {
					subtree
						.then(handleResult(successes, resolve))
						.catch(handleResult(errors, reject));
				});
			}

			var root = subtree.splice(0, 1)[0];

			var branches = subtree.map(promiseSubtree);
			return new P(function (resolve, reject) {
				root
					.then(handleResult(successes, function () {
						P.all(branches)
							.then(handleResult(successes, resolve))
							.catch(reject);
					}))
					.catch(handleResult(errors, reject));
			});
		};

		return new P(function (resolve, reject) {
			P.waitAll(tree.map(promiseSubtree))
				.then(resolve)
				.catch(function () { reject(errors, successes); });
		});
	};
})(Promise, Array);