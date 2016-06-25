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
			// "intro": {
			// 	name: "intro",
			// 	url: "/intro",
			// 	// url: "/:userNickName/passage/:passageId",
			// 	controller: "intro",
			// 	controllerJs: "./js/controller/intro.js",
			// 	templateUrl: "./view/intro.html"
			// },
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
			},
			"edit": {
				name: "edit",
				url: "/edit/:passageId",
				controller: "edit",
				controllerJs: "./js/controller/edit.js",
				templateUrl: "./view/edit.html"
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
	}
]);

mpw.factory("$request", [
	"$http",
	"$q",
	"$message",
	function($http, $q, $message) {
		var defaultConfig = {
			url: null,
			async: true,
			method: "POST"
		};
		return {
			query: function(options, success, failure, error) {
				$message.showLoading();
				var config = angular.extend({}, defaultConfig, options);
				var successFn = success || function() {};
				var failureFn = failure || function() {};
				var errorFn = error || function() {};

				if (config.async) {
					$http(config).success(function(data, status, headers, config) {
						if (data.success) {
							$message.hideLoading();
							successFn(data.data, status, headers, config);
						} else {
							failureFn(data.error, status, headers, config);
						}
					}).error(function(){
						errorFn(arguments)
					});
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
							$message.hideLoading();
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
	"$formatData",
	"$location",
	function($request, $session, $formatData, $location) {
		var me = this;
		var isLogged = false;
		var nickname = "";
		return {
			login: function(formData, success, failure) {
				var successFn = success || function() {};
				var failureFn = failure || function() {};
				$request.query({
					url: "./data/login.json",
					data: $formatData(formData, "login")
				}, function(data) {
					nickname = data.nickname;
					$session.set("pw", data);
					isLogged = true;
					successFn(data);
					$location.path("/blog");
				}, function(data) {
					isLogged = false;
					failureFn(data);
				})

			},
			checkLogin: function(success, failure) {
				var successFn = success || function() {};
				var failureFn = failure || function() {};
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
				data.action = "checkLogin";
				$request.query({
					url: "./data/loginInfo.json",
					async: false,
					data: data
				}, function(data) {
					isLogged = true;
					nickname = data.nickname;
					$session.set("pw", data);
					successFn(data);
					$location.path("/blog");
				}, function() {
					isLogged = false;
					failureFn(data);
					$location.path("/login");
				})
			},
			register: function(formData) {
				$request.query({
					url: "./data/register.json",
					data: $formatData(formData, "register")
				}, function(data) {
					nickname = data.nickname;
					$session.set("pw", data);
					isLogged = true;
					$location.path("/blog");
				}, function(data) {
					isLogged = false;
				})
			},
			logout: function() {
				var uid = $session.get("pw").uid;
				$session.destroy("pw");
				$request.query({
					url: "./data/logout.json",
					data: {
						uid: uid,
						action: "logout"
					}
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
				return "" || $session.get("pw").uid;
			}
		};
	}
])

mpw.factory("$encrypt", function() {
	var defaultConfig = "MD5";

	return function $encrypt(data, options) {
		var config = options || defaultConfig;
		return CryptoJS.MD5(data).toString();
	};
});

mpw.factory("$util", ["", function() {
	return function $util() {

	};
}])

mpw.factory("$message", ["$timeout", function($timeout) {
	var isVisible = false;
	var isLoading = false;
	var defaultConfig = {
		title: "title",
		titleIcon: "./img/error.png",
		text: "content",
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
	var mask = angular.element(document.getElementById("mask-layer"));
	var loading = angular.element(document.getElementById("loading"));
	var msg = angular.element(document.getElementById("message"));
	return {
		show: function() {
			if (arguments[0]) {
				config = angular.extend({}, defaultConfig, arguments[0]);
			} else {
				config = defaultConfig;
			}
			if (isLoading) {
				setTimeout(function() {
					loading.addClass("hide");
				}, 1000)
				$timeout(function() {
					isVisible = true;
				}, 1500)
			}else {
				mask.addClass("show");
				isVisible = true;
			}
		},
		hide: function() {
			mask.removeClass("show");
			isVisible = false;
			config = null;
		},
		getConfig: function() {
			if (config === null) return defaultConfig
			return config;
		},
		getStatus: function() {
			return isVisible;
		},
		showLoading: function() {
			isLoading = true;
			mask.addClass("show");
			loading.removeClass("hide");
			// loading.addClass("show");
		},
		hideLoading: function() {
			isLoading = false;
			// loading.removeClass("show");
			loading.addClass("hide");
			setTimeout(function() {
				mask.removeClass("show");
			}, 500);
		}
	};
}])
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
mpw.factory("$formatData", ["$encrypt", function($encrypt) {
	return function $formatData(form, action) {
		var formData = {
			action: action || ""
		}
		var formInput = {};
		for (prop in form) {
			var obj = form[prop];
			if (obj.data === undefined) continue;
			if (obj.type !== undefined && obj.type === "password") {
				formInput[obj.name] = $encrypt(obj.data);
			} else {
				formInput[obj.name] = obj.data;
			}
		}
		if (arguments[2] !== undefined) {
			if (angular.isObject(arguments[2])) {
				angular.extend(formInput, arguments[2]);
			}
		}
		formData.data = formInput;

		return formData;
	};
}])

mpw.factory("$codeFormat", function() {
	return function $codeFormat(code) {
		var t = code;
		var newCode = "";
		if (code !== "") {
			var codes = t.replace(/</g, "&lt").replace(/>/g, "&gt").replace(/\r/g, "").replace(/\n/g, "<br/>").replace(/    /g, "<div class=\"tab\"></div>").split("<br/>");
			for (var i = 0; i < codes.length; i++) {
				var line = codes[i].split(" ");
				newCode += "<div class=\"code-line\">" + codes[i] + "</div>";
			}
		}
		return newCode;
		// for (var i = 0; i < codes.length; i++) {
		// 	newCode += "<p>"+codes[i]+"</p>";
		// }

		// newCode = "<div>" + newCode + "</div>";
		// return newCode;
	};
})
mpw.decorator('taOptions', ['taRegisterTool', '$delegate', 'taSelection', '$compile', function(taRegisterTool, taOptions, taSelection, $compile) {
	// $delegate is the taOptions we are decorating
	// register the tool with textAngular
	taRegisterTool('insertCode', {
		iconclass: "code",
		buttontext: "insertCode",
		action: function() {
			// console.log(this.$editor().getSelection())

			var editor = this.$editor().$parent;

			editor.isCode = true;
			editor.insertCode.isVisible = true;

			var id = "code-area-" + editor.codeIndex;

			// var html = "<code id=\"" + id + "\" class=\"code-area\">{{codes[" + editor.codeIndex + "]}}</code>";
			var html = "<code id=\"" + id + "\" class=\"code-area\">Click to Edit Code</code>";
			taSelection.insertHtml("<p><br></p>" + html + "<p><br></p>");
			var code = angular.element(document.getElementById(id));

			$compile(code)(editor);
			// code.on("click", function(event) {

			// 	event.bubbles = false;
			// 	event.preventDefault();
			// 	event.stopPropagation();
			// 	event.stopImmediatePropagation();
			// 	editor.isCode = true;
			// 	editor.insertCode.isVisible = true;
			// 	editor.current = parseInt(code[0].id.split("-")[2]);
			// 	editor.config.code.data = editor.codes[editor.current];
			// 	editor.$apply();
			// })
			// code.on("mouseover", function() {
			// 	editor.isPreview = true;
			// 	editor.current = parseInt(code[0].id.split("-")[2]);
			// 	editor.config.code.data = editor.codes[editor.current];
			// 	editor.$apply();
			// })

		}
	});
	// add the button to the default toolbar definition
	taOptions.toolbar[1].push('insertCode');
	return taOptions;
}]);