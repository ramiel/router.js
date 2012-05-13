/***
 * Router
 * v 0.0.2
 * author: Fabrizio Ruggeri
 * Based on jQuery-URL-Parser (no-jQuery version) (https://github.com/allmarkedup/jQuery-URL-Parser/tree/no-jquery)
 */
;(function(window, undefined) {
	// pUrl https://github.com/allmarkedup/jQuery-URL-Parser/tree/no-jquery
	var purl=function(c){function g(d,c){for(var a=decodeURI(d),a=h[c?"strict":"loose"].exec(a),b={attr:{},param:{},seg:{}},e=14;e--;)b.attr[i[e]]=a[e]||"";b.param.query={};b.param.fragment={};b.attr.query.replace(j,function(a,c,d){c&&(b.param.query[c]=d)});b.attr.fragment.replace(k,function(a,c,d){c&&(b.param.fragment[c]=d)});b.seg.path=b.attr.path.replace(/^\/+|\/+$/g,"").split("/");b.seg.fragment=b.attr.fragment.replace(/^\/+|\/+$/g,"").split("/");b.attr.base=b.attr.host?b.attr.protocol+"://"+b.attr.host+
	(b.attr.port?":"+b.attr.port:""):"";return b}var i="source,protocol,authority,userInfo,user,password,host,port,relative,path,directory,file,query,fragment".split(","),l={anchor:"fragment"},h={strict:/^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,loose:/^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/},
	j=/(?:^|&|;)([^&=;]*)=?([^&;]*)/g,k=/(?:^|&|;)([^&=;]*)=?([^&;]*)/g;return function(d,f){1===arguments.length&&!0===d&&(f=!0,d=c);d=d||window.location.toString();return{data:g(d,f||!1),attr:function(a){a=l[a]||a;return a!==c?this.data.attr[a]:this.data.attr},param:function(a){return a!==c?this.data.param.query[a]:this.data.param.query},fparam:function(a){return a!==c?this.data.param.fragment[a]:this.data.param.fragment},segment:function(a){if(a===c)return this.data.seg.path;a=a<0?this.data.seg.path.length+
	a:a-1;return this.data.seg.path[a]},fsegment:function(a){if(a===c)return this.data.seg.fragment;a=a<0?this.data.seg.fragment.length+a:a-1;return this.data.seg.fragment[a]}}}}();

	/**
	 * Provide Function Bind specification if browser desn't support it
	 */
	if(!Function.prototype['bind']) {
		Function.prototype['bind'] = function(object) {
			var originalFunction = this, args = Array.prototype.slice.call(arguments), object = args.shift();
			return function() {
				return originalFunction.apply(object, args.concat(Array.prototype.slice.call(arguments)));
			};
		};
	}
	
	/**
	 * Thanks to Sammy.js
	 */
	var PATH_REPLACER = "([^\/]+)",
		PATH_NAME_MATCHER = /:([\w\d]+)/g,
		PATH_EVERY_MATCHER = /\*/g,
		PATH_EVERY_REPLACER = "[^\/]+",
		LEADING_BACKSLASHES_MATCH = /\/*$/;

	/**
	 Router
	 @class Router
	 */
	var Router = function() {
		this._routes = [];
		this._befores = [];
		this._errors = {
			'_404' : function(err, url) {
				if(console && console.warn) console.warn('404! Unmatched route for url ' + url);
			},
			'_500' : function(err, url) {
				if(console && console.error) console.error('500! Internal error route for url ' + url);
				else{
					throw new Error('500');
				}
			}
		};
		this._paused = false;
		
		window.onhashchange = function(e) {
			if(!this._paused)
				this._route( purl(window.location.href) );
			return true;
		}.bind(this);
	};

	/**
	 * Internally launched when an error in route or in nexts happens
	 * @param {String|Number} httpCode The httpCode of the error to thrown
	 * @param {Object} err, Error to thrown
	 * @param {String} url, Url which generated the error
	 */
	Router.prototype._throwsRouteError = function( httpCode, err, url ) {
		this._errors['_'+httpCode](err, url);
		return false;
	};
	
	
	/**
	 * Build a request object based on passed information
	 * @param {Object} urlObj
	 * @param {Object} params Params of request if any. Not mandatory
	 * @throw error Error if urlObj is not passed
	 */
	Router.prototype._buildRequestObject = function(urlObj, params, splat){
		if(!urlObj)
			throw new Error('Unable to compile request object');
		var request = {};
		request.href = '#' + urlObj.attr('fragment');
		if(params)
			request.params = params;
		var completeFragment = urlObj.attr('fragment').split('?');
		if(completeFragment.length == 2){
			var queryKeyValue = null;
			var queryString = completeFragment[1].split('&');
			request.queryString = {};
			for(var i = 0, qLen = queryString.length; i < qLen; i++){
				queryKeyValue = queryString[i].split('=');
				request.queryString[decodeURI(queryKeyValue[0])] = decodeURI(queryKeyValue[1]);
			}
		}
		if(splat && splat.length > 0){
			request.splats = splat;
		}
		return request;
	};

	/**
	 * Internally launched when routes for current hash are found
	 * @param {Object} urlObj Object of the url which fired this route
	 * @param {String} url Url which fired this route
	 * @param {Array} matchedIndexes Array of matched indexes
	 */
	Router.prototype._followRoute = function( urlObj, url, matchedIndexes ) {
		var index = matchedIndexes.splice(0, 1), 
			route = this._routes[index], 
			match = url.match(route.path), 
			request = {}, 
			params = {},
			splat = [];
		if(!route){
			return this._throwsRouteError(500, new Error('Internal error'), urlObj.attr('fragment'));
		}
		/*Combine path parameter name with params passed if any*/
		for(var i = 0, len = route.paramNames.length; i < len; i++) {
			params[route.paramNames[i]] = match[i + 1];
		}
		i = i+1;
		/*If any other match put them in request splat*/
		if( i < match.length){
			for(var j = i;j< match.length;j++){
				splat.push(match[j]);
			}
		}
		/*Build next callback*/
		var next = (matchedIndexes.length == 0) ? null : (function(uO, u,mI,context){
			return function(err){
				if(err)	
					return this._throwsRouteError( 500, err, uO.attr('fragment') );
				this._followRoute(uO, u, mI);
				}.bind(this);
			}.bind(this)(urlObj, url, matchedIndexes));
		
		request = this._buildRequestObject( urlObj, params, splat );
		route.routeAction(request, next);
	};
	
	/**
	 * Internally call every registered before
	 * @param {Array} befores Array of befores callback
	 * @param {Function} before Actual before
	 * @param {Object} urlObj Object of the url which fired this route
	 * @param {String} url Url which fired this route
	 * @param {Array} matchedIndexes Array of matched indexes
	 */
	Router.prototype._routeBefores = function(befores, before, urlObj, url, matchedIndexes) {
		var next;
		if(befores.length > 0) {
			var nextBefore = befores.splice(0, 1);
			nextBefore = nextBefore[0];
			next = function(err) {
				if(err)
					return this._throwsRouteError(500, err, urlObj.attr('fragment'));
				this._routeBefores(befores, nextBefore, urlObj, url, matchedIndexes);
			}.bind(this);
		} else {
			next = function(err) {
				if(err)
					return this._throwsRouteError(500, err, urlObj.attr('fragment'));
				this._followRoute(urlObj, url, matchedIndexes);
			}.bind(this);
		}
		before( this._buildRequestObject( urlObj ), next );
	};
	
	/**
	 * On hashChange route request through registered handler
	 */
	Router.prototype._route = function( urlObj ) {
		var route = '', 
			befores = this._befores.slice(),/*Take a copy of befores cause is nedeed to splice them*/ 
			matchedIndexes = [];
		var url = urlObj.attr('fragment');
		if(!url)
			return true;
		url = '#'+(url.split('?'))[0]
			  .replace( LEADING_BACKSLASHES_MATCH, '');/*Removes leading backslashes from the end of the url*/
		/*Check for all matching indexes*/
		for(var p in this._routes) {
			if(this._routes.hasOwnProperty(p)) {
				route = this._routes[p];
				if(route.path.test(url)) {
					matchedIndexes.push(p);
				}
			}
		}
		if(matchedIndexes.length > 0) {
			/*If befores were added call them in order*/
			if(befores.length > 0) {
				var before = befores.splice(0, 1);
				before = before[0];
				/*Execute all before consecutively*/
				this._routeBefores(befores, before, urlObj, url, matchedIndexes);
			} else {
				/*Follow all routes*/
				this._followRoute(urlObj, url,  matchedIndexes);
			}
		/*If no route matched, then call 404 error*/
		} else {
			return this._throwsRouteError(404, null, urlObj.attr('fragment'));
		}
	};
	
	/**
	 * Pause router to be binded on hashchange
	 */
	Router.prototype.pause = function(){
		this._paused = true;
	};
	
	/**
	 * Unpause router to be binded on hashchange
	 * @param {Boolean} triggerNow If true evaluate location immediately
	 */
	Router.prototype.play = function(triggerNow){
		triggerNow = 'undefined' == typeof triggerNow ? false : triggerNow;
		this._paused = false;
		if(triggerNow){
			this._route( purl(window.location.href) );
		}
	};
	
	/**
	 * Set location but doesn't fire route handler
	 * @param {String} url Url to set location to
	 */
	Router.prototype.setLocation = function(url){
		window.history.pushState(null,'',url);
	};
	
	/**
	 * Set location and fires route handler
	 * @param {String} url Url to redirect to
	 */
	Router.prototype.redirect = function(url){
		this.setLocation(url);
		if(!this._paused)
			this._route( purl(window.location.href) );
	};

	/**
	 * Add a routes to possible route match
	 * @param {String|RexExp} path A string or a regular expression to match
	 * @param {Function} callback Function to be fired on path match
	 * 					  Callback will be fired with (req, next)
	 * 				      req is the current Request and contains {
	 * 																 'href': local href,
	 * 																 'params': Object containing parameter for the request plus splat
	 * 																}
	 */
	Router.prototype.addRoute = function(path, callback) {
		var match, paramNames = [];
		if('string' == typeof path) {
			/*Remove leading backslash from the end of the string*/
			path = path.replace(LEADING_BACKSLASHES_MATCH,'');
			/*Param Names are all the one defined as :param in the path*/
			while(( match = PATH_NAME_MATCHER.exec(path)) != null) {
				paramNames.push(match[1]);
			}
			path = new RegExp(path.replace(PATH_NAME_MATCHER, PATH_REPLACER)
							  .replace(PATH_EVERY_MATCHER, PATH_EVERY_REPLACER) + "$");
		}
		this._routes.push({
			'path' : path,
			'paramNames' : paramNames,
			'routeAction' : callback
		});
		return this;
	};
	
	
	/**
	 * Adds a before callback. Will be fired before every route
	 */
	Router.prototype.before = function(callback) {
		this._befores.push(callback);
		return this;
	};
	
	
	/**
	 * Adds error callback handling for Http code
	 * @param {Number} httpCode Http code to handle just like 404,500 or what else
	 * @param {Function} callback Handler for error
	 */
	Router.prototype.errors = function(httpCode, callback) {
		if(isNaN(httpCode)) {
			throw new Error('Invalid code for routes error handling');
			return this;
		}
		if(!(callback instanceof Function)){
			throw new Error('Invalid callback for routes error handling');
			return this;
		}
		httpCode = '_' + httpCode;
		this._errors[httpCode] = callback;
		return this;
	};
	
	/**
	 * Run application. Note that calling this is not mandatory. Calling it just force application to evaluate current or passed url
	 * @param {String} startUrl Url to redirect application on startup. Default is current location
	 */
	Router.prototype.run = function( startUrl ){
		if(!startUrl){
			startUrl = purl(window.location.href).attr('fragment');
		}
		startUrl = startUrl.indexOf('#') == 0 ? startUrl : '#'+startUrl;
		this.redirect( startUrl );
	};

	window.Router = Router;

})(window);