Router.js
=========

Router.js is a simple yet powerful javascript plugin to handle hash fragment in order to route request.
Router.js helps you to intercept request done trough fragment and match them using string or regular expressions.

##Basics

Include Router.js in your application

	<script type="text/javascript" src="js/router.js">

according to your directory template.

Now just define a simple route. A route is made of two components

* Matching string/regexp
* Callback

Let's see

```javascript
	var router = new Router()
		   	.add('#/users', function(req, next){
				/* Do something */
			});
```

There are three noticeble aspects. Your router object and all its functions are chainable. So after and addRoute you can chain onther one and so on.
The matching string is '#/users', so if your fragment match this pattern your callback will be fired.

Callback is populated with two arguments:

* req
* next


req is an object containing

1. href, which is the url that matched
2. params, all the params recognized in the url. We will talk about this in a while

What if more than a route match your url? Well, the next parameter will be populated with a function you can call to execute the next route which match. Elsewhere next is null

###Parametric route

Let's see this:

```javascript
	router.addRoute('#/users/:username', function(req,next){
					var username = req.params.username;
				});
```

well, if the called url is 'http://www.webapp.com/#/users/jhon', then `username` in the callback will be 'jhon'!

You can use as many params you want, they will appear in the `params` property of `req` object.

###Special symbols

The other symbol you can use in your route is `*`. It matches every word before next backslash.
Consider:

```javascript
	router.addRoute('#/users/*', function(req,next){
					/*Everithing after /users/ will match this route*/
				});
```

Now all of this url will match the rule:

* http://www.webapp.com/#/users/jhon
* http://www.webapp.com/#/users/asdasd
* http://www.webapp.com/#/users/lua

The url http://www.webapp.com/#/users/jhon/foo will not match! Remember that I've said 'before next backslash'!

##Next argument

Considering this routes:

```javascript
	router.addRoute('#/users/:username', function(req,next){
	
					var username = req.params.username;
					if( username != 'admin' && next instanceof Function)
						next();
						
					})
					.addRoute('#/users/*', function(req,next){					
						alert('You are not admin!');
					});
```

As you can see both the routes match the url `http://www.webapp.com/users/jhon`. In Router.js only the first declared match will be called unless you explicitly
call next, then also the second match will be fired and so on. Remember, `next` will be a function only if another route matches.

Next will be useful also to fire erros, we will see this in a while, after talking about error handling

##Error handling

We can handle errors just like http protocol handle it, by http codes.
An example is better than million words

```javascript
	router.addRoute('#/users/:username', function(req,next){
							/*do something*/
		})
		.errors(404, function( err, href){
			alert('Page not foud!' + href );
		});
```

In this example if we point browser to `http://www.webapp.com/route/inexistent` no route will match our url. Router.js will fire a '404' error.
You can subscribe to 404 situation just with `errors(404, function(err,href){...})`

Router js will match for you 404 and 500 situation but will fire a general error for all http code you forgot to register

##Befores

Sometimes you just want to execute some actions before the route matches and then continue on regular matches. Then `befores` is what you need.

```javascript
	router
		.before(function(req,next){
			if( userIsLogged() === true)
				next();
			else
				next( new Error('User not logged'), 403);
		})
	
		.addRoute('#/users/:username', function(req,next){
							/*do something*/
		})
		
		.error(403, function(err, href){
			console.error('While attempting to access to '+ href +' the following error happened: '+err.message);
		});
```

`Befores` will be executed before normal route. If `next` is called in before then the route is followed, else if `next` is called with an error then the error is fired and the route is not followed.
You can specify even error type (403 in this case), elsewhere it will be a 500

You can add as many `befores` you want, they will be fired sequentially

```javascript
	router.before(function(){...})
		  .before(function(){...});
```

Remember that in before req has just `href` property cause is the only you know at before time. 
		  
##This meaning

Context inside callback, befores or errors have no special meaning to avoid complexity. If you need to force your context inside a callback you can use `bind`.
Bind is the browser implementation or our if missing. Let's see at an example

```javascript
	function(){
	
		this.property = 'foo';
		
		var router = new Router()
								.route('#/mine/route', function(req,next){
										var p = this.property;
										console.log(p); /* will print 'foo' */
										router.redirect('#/'+p);
								}.bind(this));
	
	}
```

If you need your router inside a callback just refer to it as router.
Have you noticed redirect method? Well it's time to talk about utility methods

##Utility methods

In Router.js are present two utility method. Just two because probably you'll need just them. Actually there could be just one, but I\'m generous!

```javascript
	redirect(url)
```

this will redirect your application to desired url firing routes normally

```javascript
	setLocation(url)
```

this will redirect your application to desired url WITHOUT firing any routes!

##RegExp

We already said that you can use regular expression to better match your route

```javascript
	router.addRoute(/#\/foo\/bar\/?(.*)/i, function(req, next){
		
		/* req gained splats property which contains an array with all your custom matches*/
	});
```

So calling 'http://www.webapp.com/#/foo/bar/custom' will follow the route and in req you will find a property called splats.
Splats is an array containing all regexp matches (everyting between two '()' ). In this cas req.splats[0] is 'custom'

You can use regular expression to obtain more grain fined routes


##Run

Router has a special method (yes, another one, I lied). You can call run after you have setted all your route to immediately launch routes parsing.
Run has a parameter, 'startUrl'. If is setted it will redirect immediately to that url, alse it will read current browser url.
If you do not call run Router will do nothing until next fragment change.


#Why

* I've used different router like library but some do too few, other too much. I need a little, clear script which do the essential.

* Code written using Router.js is higly readable (not my fault Sammy.js!)
 
	
## Author


Fabrizio 'ramiel' Ruggeri