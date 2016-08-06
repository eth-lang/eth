<p align="center">
  <img src="https://raw.githubusercontent.com/eth-lang/eth/master/website/logo.png" alt="eth lang logo" />
</p>
<p align="center">
  <i>A fun, productive, and simple functional language that compiles to JavaScript.</i>
</p>
<p align="center">
  <a href="https://github.com/eth-lang/eth#intro">intro</a>
  &nbsp;|&nbsp;
  <a href="https://github.com/eth-lang/eth#running">running</a>
  &nbsp;|&nbsp;
  <a href="https://github.com/eth-lang/eth#language-types">types</a>
  &nbsp;|&nbsp;
  <a href="https://github.com/eth-lang/eth#language-built-ins">built-ins</a>
  &nbsp;|&nbsp;
  <a href="https://github.com/eth-lang/eth#standard-library">standard library</a>
  &nbsp;|&nbsp;
  <a href="https://github.com/eth-lang/eth#using-eth-for-your-next-project">using eth for a project</a>
  &nbsp;|&nbsp;
  <a href="https://github.com/eth-lang/eth#developing">developing</a>
</p>
<p align="center">
  <a href="https://circleci.com/gh/eth-lang/eth">
    <img alt="circleci build status" src="https://img.shields.io/circleci/project/eth-lang/eth/master.svg" />
  </a>
  <a href="https://www.npmjs.com/package/eth">
    <img alt="npm version" src="https://img.shields.io/npm/v/eth.svg" />
  </a>
  <a href="https://github.com/eth-lang/eth-lang/blob/master/LICENSE">
    <img alt="license" src="https://img.shields.io/npm/l/eth.svg" />
  </a>
</p>

## intro

*eth* is a small in surface, small in code, easy to master, easy to adopt, functional language
that will bring productivity and joy to your day programming.

**simple**

I tries really hard to have a unified interface, and a small amount of primitives keeping JavaScript's
awesome core and avoid all the new reserved words and doubtedly useful features recent versions of
JavaScript are rapidly adding.

**close to JavaScript**

*eth* remains very close to JavaScript, except for the lispyier syntax primitives are almost
all written the same way, it's compatible with the whole JS exosystem, and it support all of ES5
features so, we could bet you wont feel lost when writing your first bits of *eth* code.

```js
let(http require("http"))

let(hostname "127.0.0.1")
let(port 3000)

let(server http.createServer(fn(req res {
  =(res.statusCode 200)
  res.setHeader("Content-Type" "text/plain")
  res.end("Hello World\n")
})))

server.listen(port hostname fn(
  print(string("Server running at http://" hostname ":" port "/"))
))
```

## running

You'll want to start by installing `eth` using `npm`:

```
npm install --global eth
```

There a **repl** you can start with:

```
$ eth repl
eth> +(3 5)
8
eth>
```

You can **compile** files to JavaScript using:

```
$ eth <file.eth
// ... eth prelude ...
sum(3, 5);
```

Or **run** them right away using (for production use it's better to compile & run with `node`):

```
$ eth eval file.eth
8
```

In summary:

```
Usage: eth [command] [arguments]

Commands:
  h, help     prints this message
  v, version  prints eth's version
  r, repl     starts the repl
  e, eval     runs given file or code
  b, build    builds the given file

eth also works using stdin & stdout like so: eth <app.eth >app.js

Documentation can be found at http://eth-lang.com
```

## language types

| name | example | description |
|---|---|---|
| **nil** | `nil` | translates to `undefined` |
| **boolean** | `true` | same as JS booleans |
| **number** | `1.23` | same as JS numbers |
| **string** | `"xyz"` | same as JS strings |
| **keyword** | `:xyz` | similar to ruby keywords, translates to a string |
| **symbol** | `x` | translates to the symbol itself but supports special characters disallowed in JS |
| **array** | `[1 2 3]` | same as JS arrays, but, you drop the commas |
| **object** | `{:a 1 :b 2}` | same as JS objects, but, you drop the commas and colons |

## language built-ins

```
get -> a[b]
set -> a = b
let -> var a = b
delete -> delete a.b
fn fn(a b {+(a b)}) -> function (a, b) { return a + b; }
cond cond(==(a b) a :else b) -> if (a == b) { return a } else { return b }
loop -> TODO use recursion!
package -> TODO use set(module.exports { ... })
import -> TODO use let(fs require("fs"))
```

## standard library

The standard library is, at it's core, composed of all the functions in [Ramda.js](http://ramdajs.com/).
`ramda` is a really neat library packed with small utility functions that all have a well designed
functional api.

Similar to `lodash` and `underscore` you might say but there is a fundamental difference in how `ramda`
orders the arguments it's functions take that makes it especially suitable for currying, composing
and functional programming in general.

If you are interested in functional programming and using `eth` I then strongly encourage you pass by
ramda's awesome [documentation](http://ramdajs.com/0.21.0/docs/) and read the introductory post
[Why Ramda?](http://fr.umio.us/why-ramda/).

In addition to the functions from `ramda`, `eth` defined a few more useful function like `to-json`,
`print`, `assert` and more. They are all listed below.

```
print assert
toJson fromJson
string type isOfType
isOdd isEven
regexp regexpMatch regexpFind regexpReplace
getIn setIn updateIn
```

## using eth for your next project

### browser

Eth compiles down to plain JavaScript so you could simply run `eth <app.eth >app.js` and load
`app.js` in a browser but that only hic is that you won't have access to the nice `import` statements
any more.

To be able to use `import`s (really `require`s) you need to use a module loader / system to bundle
your code for browsers. This implies that there needs to be an integration written for the tool you
are going to choose.

For **Browserify** users there is no `eth` integration yet but if you are up for it this [`soloify`](https://github.com/kiasaki/soloify) project should be a good example to look at.

**If you are using _webpack_** you can install the [`eth-loader`](https://github.com/eth-lang/eth-loader)
package and use it like so:

```
// webpack.config.js
module.exports = {
  entry: './src/app.eth',
  output: {path: './build', filename: 'app.js'},
  module: {
    loaders: [{test: /\.eth$/, loader: 'eth-loader'}]
  }
};
```

### node

The story here is similar that that of CoffeeScript or TypeScript, you have mainly two option:
compiling all files and running those with `node` or using node.js `require.extensions` to register
a handler for files with a specific extension, `.eth` in our case (this is clearly not production
worthy).

**Option 1: Compiling and running**

Here, a simple `Makefile` that looks like the following can come in super handy:

```make
ETH := node_modules/.bin/eth

FILES = models.js routes.js server.js
TEST_FILES = test/models.js test/routes.js

default: run

%.js: %.eth
    $(ETH) <$< >$@

build: $(FILES) $(TEST_FILES)

run: build
  node server.js

test: build
    node -r ./test/models.js ./test/routes.js

clean:
    @rm -rf *.js
    @rm -rf test/*.js
```
**Option 2: Require extension**

This version of getting `.eth` files to run on node.js is by far the easiest, it consists in having
a `.js` file the simply requires `eth/register` followed by your `server.eth`, from that point on
all `require`s resolving to `.eth` file will get compiled first, then ran.

```js
// bootstrap.js
require('eth/register');
require('./server');
```

### library

You will probably want to have two directories, say `src` for `.eth` source files and a `lib` or
`build` folder for compiled javascript.

That way people consuming your library don't even need to know it is written in `eth` and still use
it. To get there you'll simply have to make sure that you build all necessary `.js` files before
commiting changes and have a line that looks like `"main": "build/index.js"` in your `package.json`.

## developing

**The compiler** for the language is all in `eth.js` and is still way under 1000 lines.

**The repl/cli tool** is implemented in `bin/eth`.

**The standard library** is written in `eth` and is located in the `core.js` file.

To run the test suite simply run:

```
make test
```

# license

MIT, see [`license`](https://github.com/eth-lang/eth/blob/master/license) file.
