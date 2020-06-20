# Changelog

## 2.4.5
  - Added more tests to browser history engine

## 2.4.4
  - Fix, avoid including query parameters in params

## 2.4.3
  - Fix pipe type declaration

## 2.4.2
  - Fix: include `search` in path so that querystrings are correctly computed

## 2.4.1
  - Fix: BrowserEngine supports anchors when wrapping complex elements #43

## 2.4.0
  - Add back, forward and go methods

## 2.3.3
  - Fix: Execute handlers on popstate

## 2.3.2
  - Fix: include needed dependency in the bundle

## 2.3.1
  - Mark this package as side effect free

## 2.3.0
  - Move to `path-to-regexp`
  - Remove special symbols support

## 2.2.1
  - `engine` parameter is optional when creating the router

## 2.2.0
  - Introduces better special symbols: *, **, +, ++
    - `*` works as intended matching empty strings
    - `+` and `++` have been introduced to cover all cases

## 2.1.0
  - Introduces exit handlers

## 2.0.1
  - Little fix in versioning

## 2.0.0

  - 🎉 New, stable version!

## 2.0.0-beta.2

  - More error handlers can listen to the same error
  - '*' can be used to listen to any error

## 2.0.0-beta.1

  - Expose more types

## 2.0.0-beta.0

- Complete rewrite! 
  - More powerful
  - Written in typescript
  - Tested
  - New paradigms
  - Discover everything in the README


## 1.0.10

- Fixed markdown in README

## 1.0.9

- Fixed url to website
- Add donation button

## 1.0.8

- Use not minified version in bower

## 1.0.7

- Fix bower dependecy

## 1.0.6

- Improve documentation
- Update dependencies

## 1.0.5

- Updated dev-dependency
- Fixed bug building documentation
- Tests are done on latest version of node to behave like    
  in development environment
- Update readme with information on Internet Explorer 8 compatibility
- Updated documentation

## v1.0.4

- Improved documentation
- Removed unused dev dependencies
- Updated old dependencies
- Fixed an error on strict javascript
- Fixed some typos on documentation

## v1.0.1
- minor bugfixes

## v1.0.0
- Added documentation
- New tests added
- Added `req.hasNext` properties to match presence of more mathing routes


## v 0.8.4
- Enabled removed tests

## v 0.8.3
- Grunt configured
- JSHint of code
- Karma Grunt integration
- Removed unused warning from tests
- Test completed

## v 0.8.2
- Added some tests

## v 0.8.0
- Fixed return value for all functions
- Added `destroy` method to clean all listeners

## v 0.7.1
- Correct return value in "run" method
- Introduced a test suite

## v 0.7.0
- Request object has `get` method to retrieve parameters wherever they are passed
- Bugfix: Splats do not contain query anymore in some cases


## v 0.6.3
- Added support for options. `ignorecase` option, default true

## v 0.6.2
- Added map file
- Bugfix: Query string do not appear in regular params value
- Internal : Added closure compiler support

## v 0.6.1
- Added alias name for method `addRoute`. Now can be called `add`, `route`, `get`.

Old changelog missing
