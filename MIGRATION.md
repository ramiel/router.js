# Migrating from old versions

## Version 1.x to 2

Version 2 is deeply different from version 1 and I suggest you not to migrate but also to start any new project using version 2 directly. If you want to migrate consider the following:

- Version 2 works with pushState API present in modern browsers. To have the same behavior as version 1, with hasbang, you need a dedicated engine. While there are plans to create such engine, it doesn't exist yet.
- `errorCode` in error is now called `statusCode`.
- All the matching routes are called and `next` function disappeared. There is now a `stop` function to prevent next route handler to be called.
- Route handlers signature is now `(req, context) => void`.
- Error handler dignature is now `(err, context) => void`.
- `before` doesn't exist anymore for an easier approach with middlewares.
- `*` and `**` also match against empty strings.

I told you, it's a completely different thing. Enjoy the new version!!

## Version 0.x to 1

If you have code for version prior of 1.0.0 you should remember that something has changed. To be sure that another matching route exists, you have to check req.hasNext and not controlling that next is a function, as previous indicated. Here an example of migration

```js
router.get('#/home',function(req, next){
  //Avoid
  if(next instanceof Function){ // WRONG! It's always a function now
    next();
  }

  //Use instead
  if(req.hasNext){
    next();
  }
});
```
