
# RouterJS

[![npm version](https://badge.fury.io/js/routerjs.svg)](https://badge.fury.io/js/routerjs)
[![CircleCI](https://circleci.com/gh/ramiel/router.js.svg?style=shield&circle-token=04cff3788541e5ef982f8081b326d89bb966706d)](https://circleci.com/gh/ramiel/router.js)
[![Minified + zipped size](https://badgen.net/bundlephobia/minzip/routerjs)](https://bundlephobia.com/result?p=routerjs)

RouterJS is a simple and powerful javascript router. It's simple to use, versatile and ready to be coupled with your framework of choice. It can work in the browser or on native applications.

🌟 Reasonable defaults. Just define your routes and go.    
🖱️ Smart listener. Don't define custom links, RouterJS is able to understand what click to handle!    
⚙️ Works everywhere: thought for the browser, it can also run on native apps or on your watch, drop in your engine.    
🐞 Type safe. RouterJS is written in Typescript and fully tested.    
🌍 Plain javascript. It can be used as is or with any library you prefer (React, Angular, Vue...)


<!-- vscode-markdown-toc -->
* 1. [Older versions and migration](#Olderversionsandmigration)
* 2. [Installation](#Installation)
* 3. [Use with other libraries/frameworks (React and others)](#UsewithotherlibrariesframeworksReactandothers)
* 4. [Usage](#Usage)
	* 4.1. [Matching params](#Matchingparams)
	* 4.2. [Query params](#Queryparams)
	* 4.3. ["req.get" - One method to get them all](#req.get-Onemethodtogetthemall)
	* 4.4. [Regexp and splats](#Regexpandsplats)
	* 4.5. [Multiple matching routes](#Multiplematchingroutes)
	* 4.6. [Middlewares](#Middlewares)
	* 4.7. [Always callbacks](#Alwayscallbacks)
	* 4.8. [Exit handlers](#Exithandlers)
	* 4.9. [Context](#Context)
	* 4.10. [Errors](#Errors)
	* 4.11. [Engines](#Engines)
		* 4.11.1. [BrowserHistoryEngine](#BrowserHistoryEngine)
	* 4.12. [Request object](#Requestobject)
	* 4.13. [Options](#Options)
	* 4.14. [Router methods](#Routermethods)

<!-- vscode-markdown-toc-config
	numbering=true
	autoSave=true
	/vscode-markdown-toc-config -->
<!-- /vscode-markdown-toc -->

##  1. <a name='Olderversionsandmigration'></a>Older versions and migration

Version 2 of this router represents a complete rewrite and redefines some concept of the older versions. Refer to the [migration guide](https://github.com/ramiel/router.js/blob/master/MIGRATION.md) if you were using one of those versions.

Are you looking for documentation of version 1? Check it out [here](https://github.com/ramiel/router.js/tree/1.0.10).


##  2. <a name='Installation'></a>Installation

This library is available on npm

`npm install routerjs`

##  3. <a name='UsewithotherlibrariesframeworksReactandothers'></a>Use with other libraries/frameworks (React and others)

If you're looking for a way to integrate this library in your React application, have a look at __[react-routerjs](https://github.com/ramiel/react-routerjs)__

##  4. <a name='Usage'></a>Usage

To define your routes simply match a route url with a callback

```js
import { createRouter } from 'routerjs';

// Create the instance of your router
const router = createRouter()
  // Define the route matching a path with a callback
  .get('/user', (req, context) => {
    // Handle the route here...
  })

  // Calling "run" will execute handlers immediately for the current url.
  // You can avoid calling it and wait for the next route change instead.
  .run();
```

__path__: The path can be a string, like the one above, or a regular expression    
__callback__: The callback can be synchronous or asynchronous and it receives two parameters:
  - __req__, the current request, we'll see it in [details later](#Requestobject).
  - __context__, contains some fixed informations, as explained [here](#Context).

When you create a router with the default engine, any click on anchors will be intercepted and converted to a router event. You can discover more on the default engine and how to opt-out of this click behavior [here](#Engines).

###  4.1. <a name='Matchingparams'></a>Matching params

Under the hood the path matching is done through [path-to-regexp](https://github.com/pillarjs/path-to-regexp), so you can look at its [documentation](https://github.com/pillarjs/path-to-regexp#path-to-regexp) to know all the possibilities.

A route can define several named params in the form `:name` that will be available inside the request through `req.params`

```js
const router = createRouter()
  .get('/user/:id', async (req, context) => {
    const user = await getUser(req.params.id);
  });
```

This route will match, for example, the route `/user/123` and the `id` will be `123`.    
All the params are strings.

Multiple params can be used together

```js
const router = createRouter()
  .get('/post/:date/:title', async (req, context) => {
    // ...
  });
```

Again: look at the [documentation](https://github.com/pillarjs/path-to-regexp#path-to-regexp) of path-to-regexp to know about all of the features:

- Optional parameters `/user/:id?`
- Zero or more `/posts/:date*`
- One or more `/posts/:date+`
- Unnamed parameters `/:foo/(.*)`
- Custom matching parameters `/user/:id(\\d+)`

###  4.2. <a name='Queryparams'></a>Query params

Any regular query parameter can be retrieved through `req.query`

```js
const router = createRouter()
  .get('/users', async (req, context) => {
    const filter = req.query.filter || 'all';
  });
```

So the path `/users?filter=active` will result in filter to be `active`


###  4.3. <a name='req.get-Onemethodtogetthemall'></a>"req.get" - One method to get them all

The `req.get` method looks for parameters in the params, then in the query and otherwise it fallbacks to a default value if one is provided.

```js
// Visiting /users/john?age=25
router
  .get('/users/:username', (req, context) => {
    const username = req.get('username');      // will be 'john' because is found in params
    const age = req.get('age', 18);            // will be 25 because is found in query
    const surname = req.get('surname', 'Snow');// will be 'Snow' because of provided default value
    const address = req.get('address');        // will be undefined
  });
```

###  4.4. <a name='Regexpandsplats'></a>Regexp and splats

A route can be defined through a regular expression instead of a string. Any capturing group value can be retrieved from the `req.splats` array

```js
router
  .get(/\/foo\/bar\/?(.*)/i, (req, context) => {
    console.log(req.splats)
  });
```

The path `/foo/bar/something` will match and the output will be

`['something']`

because the splats will contain the value from the caturing group in the regular expression.

_NOTE_ in the future, named capturing group will be used to get regular params through regular expressions.

###  4.5. <a name='Multiplematchingroutes'></a>Multiple matching routes

All the matching routes are executed

```js
// For path "/users/admin"

router
  .get('/users/:name', () => {
    console.log('I am called');
  })
  .get('/users/admin', () => {
    console.log('I am called too');
  });
```

For the path `/users/admin`, both routes will be exectued because they both match. If you want to prevent this, you need to call `req.stop()`

```js
router
  .get('/users/:name', (req, context) => {
    //...
    req.stop();
  })
  .get('/users/admin', (req, context) => {
    // this won't be called because req is stopped
  });
```

###  4.6. <a name='Middlewares'></a>Middlewares

You can write middlewares which are functionalities to run before your route handler.    
Implementation of middlewares are inspired by the ones in [zeit micro](https://github.com/zeit/micro), so they're simply composition of functions!

```js
const logMiddleware = fn => (req, context) => {
  console.log(`${Date.now()} - GET ${context.path}`);
};

router
  .get('/users', logMiddleware((req, context) => {
    // ...
  }))
```

Now every route match will be logged. 

To compose together more middlewares, simply use the `compose` function.

```js
import { createRouter, compose } from 'routerjs';

const userRoute = (req, context) => {
  //...
};

const router = createRouter()
  .get(
    '/users', 
    compose(
      logMiddleware,
      authMiddleware,
      // any other middleware
    )(userRoute)
  );
```

If you just have middlewares but not an handler, you can use pipe instead.

```js
import { createRouter, pipe } from 'routerjs';

const userRoute = (req, context) => {
  //...
};

const router = createRouter()
  .get(
    '/users', 
    pipe(
      logMiddleware,
      authMiddleware,
      // any other middleware
    )
  );
```

###  4.7. <a name='Alwayscallbacks'></a>Always callbacks

You can define a callback that is executed always, on every route and despite the fact that the request has been stopped or not.

```js
router
  .get('/users')
  .get('/posts')
  .get('/post/:id')
  .always((context) => {
    // this will be executed for every route.
    // Context contains at least the `path`
    console.log('Path is: ', context.path)
  });
```

`always` callbacks receive only the [`context`](#Context) as parameter.

If we navigate to `/post/14`, this will be logged to the console

```
Path is: /post/14
```

###  4.8. <a name='Exithandlers'></a>Exit handlers

You can attach handlers that are executed when the user leaves a route. The syntax is the same as `get` and the callback receives the same arguments

```js
router
  .get('/', () => {})
  .exit('/', (req, context) => {
    // ... do something when the route "/" is left
  });
```

The behavior is the same as for `get` and so you can stop the execution and populate the `context`. Let's say that you have a series of `get`s, that run when the user enters a route, and a series of `exit`s that run when the user leaves the route.

###  4.9. <a name='Context'></a>Context

The context is an object which is retained through the execution of each callback.    
It contains the current `path` but you can attach whatever you want. In this example we'll use a middleware to populate the context with some user information


```js
const userInfo = fn => async (req, context) => {
  // This fake method get the user from a hypotetical JWT token
  // contained in the cookies, then attaches it to the context
  context.user = await userFromJWT(document.cookies);
}

router
  .get('/post/:id', compose(
    userInfo
  )((req, context) => {
    // The context will contain those user info fetched before
    const userId = context.user.id;
  }))
  .get('/post/*', (req, context) => {
    // The context will have the user info here as well, since the context
    // object is kept through each callback!
  })
  .always((context) => {
    // also here, `context.user` is available
  })
```

###  4.10. <a name='Errors'></a>Errors

Your routes can throw errors for any reason and you can listen to those errors. Errors in RouterJS behave like http errors and so they have a code associated. You can add a listener for the code you prefer and, if an error has no associated code, it behaves like a `500`.

```js
router
  .get('/user/:id', () => {
    // ...
    throw new Error('User not present');
  })
  .error(500, (err, context) => {
    // here you handle any 500 error
    console.error(err);
  });
```

If a route is not found, a 404 error is thrown and you can listen to those as well.

```js
router
  .get( /* ... */ )
  .error(404, (err, context) => {
    console.log(`Route ${context.path} not found`);
  });
```

You can attach any `statusCode` you want to your errors.

```js
router
  .get('/authorize', () => {
    // ...
    const e = new Error('Not authorized');
    e.statusCode = 403;
    throw e;
  })
  .error(403, (err, context) => {
    // Your 403 errors are caught here.
  });
```

You can also add an error handler that listen to any error just using the wildcard `*`

```js
router
  .get('/', () => {
    // ...
  })
  .error('*', (err, context) => {
    // This will catch any error, regardless of the statusCode
  });
```

By default RouterJS will log for 404 and 500 errors but this behavior can be opt-out in the future.

###  4.11. <a name='Engines'></a>Engines

RouterJS can work with several engines. For the moment only one engine exists and it's a browser engine that uses `pushState` API under the hood. In the future there will be an engine that uses `hashbang` instead and you can imagine engines for other environments that use javascipt but which are not a browser (node.js, native frameworks, etc...).

The current engine is setup automatically for you by RouterJS but you can pass your own instance creator.

```js
import { createRouter, BrowserHistoryEngine} from 'routerjs';

const router = createRouter({engine: BrowserHistoryEngine({bindClick: false})});
```

In this example the `BrowserHistoryEngine` won't automatically listen to click to anchors and it will be up to you to call the `navigate` method when appropriate.

####  4.11.1. <a name='BrowserHistoryEngine'></a>BrowserHistoryEngine

As said this engine works with the `pushState` API. It takes some parameters:

- __bindClick__: If true any click on an anchor will be automatically translated to a router event. Default to true.

The clicks on anchors are listened unless:
  - The anchor has a `data-routerjs-ignore` attribute
  - The anchor has a `download` attribute
  - The anchor has a `target` attribute
  - The anchor has a `rel="external"` attribute
  - The anchor href points to a different domain

###  4.12. <a name='Requestobject'></a>Request object

Here the complete list of properties available in the request object, `req`, the first parameter of the callbacks:

- __path__: The current path (cleaned)
- __params__: An object containing every matched param, if any.
- __query__: An object with the query params, if any.
- __get__: A function in the form `(k: string, defValue: any) => any` that looks for params
- __splats__: An array containing any matching group for routes defined through regular expressions.
- __stop__: A function to avoid any following matched route to be executed
- __isStopped__: A function `() => boolean` that tells if stop has been called.

###  4.13. <a name='Options'></a>Options

The router can be instantiated with several options:

- __engine__: A function that returns an instance of a custom engine, usually an external package.
- __ignoreCase__: If `true` that route will NOT check the case of the path when matching. Default to false.
- __basePath__: A base path to ignore. If, for example, the basePath is `/blog`, any path will exclude that string. In this case `/blog/post/:id` can be simply written as `/post/:id`

```js

router = createRouter({basePath: '/blog'})
  .get('/post/:id', () => {
    // This will match `/blog/post/:id`
  });
```

This can be handy when the router is for an application served from a subdir.


###  4.14. <a name='Routermethods'></a>Router methods

A list of methods available in the router:

- __get__: Function to define a route
- __always__: Function to define an handler for any route, even if the `req.stop` has been called
- __error__: Function to define an error handler
- __navigate__: Function to navigate. i.e. `router.navigate('/post/3')`
- __setLocation__: Same as navigate but the handlers are not run
- __go__: Navigate into the history of `n` positions. `router.go(-2)` or `router.go(1)`
- __back__: Navigate back in the history
- __forward__: Navigate forward in the history
- __run__: Function that execute immediately the router, even if no route has changed yet.    
    This function is useful to run during the application to startup to immediately elaborate the handler for the current url. You can also pass a `path` to the function and the url will be adjusted accordingly
- __teardown__: Function to remove any event handler instantiated by the router. Useful to cleanup memory on application disposal.
- __buildUrl__: Function to get an url considering also the baseUrl.    
  i.e, if the base url is `/blog`, the call `router.buildUrl('/post')` will return `/blog/post`
