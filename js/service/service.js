// var mpwService = angular.module("mpwService", ["ngRoute", "ngTouch"]);
mpw.factory("$module", [
	"$route",
	"$rootScope",
	"$user",
	"$location",
	function($route, $rootScope, $user, $location) {

		var currentModule = "";
		var history = [];

		var routes = {
			"login": {
				name: "login",
				url: "/login",
				// url: "/:userNickName/passage/:passageId",
				controller: "login",
				controllerJs: "./js/controller/login.js",
				templateUrl: "./view/login.html"
			},
			"intro": {
				name: "intro",
				url: "/intro",
				// url: "/:userNickName/passage/:passageId",
				controller: "intro",
				controllerJs: "./js/controller/intro.js",
				templateUrl: "./view/intro.html"
			},
			"passage": {
				name: "passage",
				url: "/passage/:passageId",
				// url: "/:userNickName/passage/:passageId",
				controller: "passage",
				controllerJs: "./js/controller/passage.js",
				templateUrl: "./view/passage.html"
			},
			"blog": {
				name: "blog",
				url: "/blog",
				//url: "/:userNickName/blog",
				controller: "blog",
				controllerJs: "./js/controller/blog.js",
				templateUrl: "./view/blog.html"
			},
			"resume": {
				name: "resume",
				url: "/resume",
				//url: "/:userNickName/resume",
				controller: "resume",
				controllerJs: "./js/controller/resume.js",
				templateUrl: "./view/resume.html"
			},
			"error": {
				name: "error",
				url: "/error",
				controller: "error",
				controllerJs: "./js/controller/error.js",
				templateUrl: "./view/error.html"
			},
			"profile": {
				name: "profile",
				url: "/profile",
				controller: "profile",
				controllerJs: "./js/controller/profile.js",
				templateUrl: "./view/profile.html"
			}
		};

		var asyncJs = function(jsPath) {
			return ["$q", "$route", "$rootScope", function($q, $route, $rootScope) {
				var deferred = $q.defer();
				$script([jsPath], function() {
					$rootScope.$apply(function() {
						deferred.resolve();
					});
				});
				return deferred.promise;
			}]
		};

		return {
			history: ["intro"],
			init: function() {
				var route, controllerJs;

				for (var prop in routes) {
					route = routes[prop];
					controllerJs = route.controllerJs;
					route.resolve = {
						delay: asyncJs(controllerJs)
					};
					mpw.routeProvider.when(route.url, route);
				}

				mpw.routeProvider.otherwise({
					redirectTo: "/error"
				});


				// var route = routes[module];

				// var controllerJs = route.controllerJs;

				// var asyncJs = (function(jsPath) {
				// 	return ["$q", "$route", "$rootScope", function($q, $route, $rootScope) {
				// 		var deferred = $q.defer();
				// 		$script([jsPath], function() {
				// 			$rootScope.$apply(function() {
				// 				deferred.resolve();
				// 			});
				// 		});
				// 		return deferred.promise;
				// 	}]
				// })(controllerJs);

				// var routeConfig = {
				// 	templateUrl: route.templateUrl,
				// 	controller: route.controller,
				// 	resolve: {
				// 		delay: asyncJs
				// 	}
				// };

			},
			// goTo: function(module) {

			// 	module = module.toLowerCase();
			// 	if (routes[module] === undefined) {
			// 		module = "error";
			// 	}

			// 	if (currentModule !== "") history.push(currentModule);
			// 	currentModule = module;

			// 	$location.path(routes[module].url);
			// },
			// goBack: function() {
			// 	var pre = history.pop() || "intro";
		// 	currentModule = pre;
		// 	$location.path(routes[pre].url);
		// },
		getRoutes: function() {
			return routes;
		}
	}
}]);

mpw.factory("$request", [
	"$http",
	"$q",
	function($http, $q) {
		var defaultConfig = {
			url: null,
			async: true,
			method: "POST"
		};
		return {
			query: function(options, success, failure, error) {
				var config = angular.extend({}, defaultConfig, options);
				var successFn = success || function() {};
				var failureFn = failure || function() {};
				var errorFn = error || function() {};

				if (config.async) {
					$http(config).success(function(data, status, headers, config) {
						if (data.success) {
							successFn(data.data, status, headers, config);
						} else {
							failureFn(data.error, status, headers, config);
						}
					}).error(errorFn);
				} else {
					var promise = (function() {
						var deferred = $q.defer();
						$http(config).success(function(data, status, headers, config) {
							deferred.resolve(data);
						}).error(function(data, status, headers, config) {
							deferred.reject(data);
						})
						return deferred.promise;
					})();
					promise.then(function(data) {
						if (data.success) {
							successFn(data.data);
						} else {
							failureFn(data.error);
						}
					}, function(data) {
						errorFn(data);
					});
				}
			}
		}
	}
])
mpw.factory("$user", [
	"$request",
	"$session",
	"$encrypt",
	"$location",
	function($request, $session, $encrypt, $location) {
		var me = this;
		var isLogged = false;
		var nickname = "";
		return {
			login: function(data) {

				$request.query({
					url: "./data/login.json",
					data: data
				}, function(data) {
					nickname = data.nickname;
					$session.set("pw", data);
					$location.path("/blog");
					isLogged = true;
				}, function() {
					isLogged = false;
					console.log("login fail");
				})
			},
			checkLogin: function() {
				if (!$session.checkSessionStorage()) {
					// $location.path("/intro");
					isLogged = false;
					$location.path("/login");
					return;
				}
				var data = $session.get("pw");
				if (!angular.isObject(data)) {
					// $location.path("/intro");
					isLogged = false;
					$location.path("/login");
					return;
				}
				$request.query({
					url: "./data/loginInfo.json",
					action: "check",
					async: false,
					data: data
				}, function(data) {
					$location.path("/blog");
					isLogged = true;
					nickname = data.nickname;
				}, function() {
					$location.path("/login");
					isLogged = false;
					console.log("false")
					// error message
				})
			},
			register: function(data) {
				$request.query({
					url: "./data/register.json",
					action: "register",
					data: data
				}, function() {
					console.log("register succeed");
				}, function() {
					console.log("register fail");
				})
			},
			logout: function() {
				$session.destroy("pw");
				$request.query({
					url: "./data/logout.json",
					action: "logout"
				}, function() {
					$location.path("/login");
					isLogged = false;
				})
			},
			getStatus: function() {
				return isLogged;
			},
			getName: function() {
				return nickname;
			},
			getId: function() {
				return $session.get("pw").uid;
			}
		};
	}
])

mpw.factory("$encrypt", ["$rootScope", function($rootScope) {
	var defaultConfig = "rsa";

	return function $encrypt(data, options) {
		var config = options || defaultConfig;
		return data;
	};
}]);

mpw.factory("$util", ["", function() {
	return function $util() {

	};
}])

mpw.factory("$message", function() {
	var isVisible = false;
	var defaultConfig = {
		title: "testing",
		titleIcon: "./img/error.png",
		text: "testing",
		hasBtn: true,
		button: [{
			text: "OK",
			cls: "",
			iconCls: "",
			fn: function() {}
		}, {
			text: "NO",
			cls: "",
			iconCls: "",
			fn: function() {}
		}]
	};
	var config = null;
	return {
		show: function() {
			if (arguments[0]) {
				config = angular.extend({}, defaultConfig, options);
			} else {
				config = defaultConfig;
			}
			isVisible = true;
		},
		hide: function() {
			isVisible = false;
			config = null;
		},
		getConfig: function() {
			if (config === null) return defaultConfig
			return config;
		},
		getStatus: function() {
			return isVisible;
		}
	};
})
mpw.factory("$session", function() {
	return {
		checkSessionStorage: function() {
			if (!localStorage) {
				return false;
			}
			return true
		},
		set: function(key, value) {
			return localStorage.setItem(key, JSON.stringify(value));
		},
		get: function(key) {
			return JSON.parse(localStorage.getItem(key));
		},
		destroy: function(key) {
			return localStorage.removeItem(key);
		}
	};
})
mpw.factory("$validation", function() {
	return {

	};
})