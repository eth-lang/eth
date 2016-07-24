# eth

_A fun, productive, and simple functional language that compiles to JavaScript._

# intro

*eth* is a small in surface, small in code, easy to master, easy to adopt,
functional language that will bring productivity and joy to your day
programming.

I tries really hard to have a unified interface, and a small amount of primitives keeping JavaScript's
awesome core and avoid all the new reserved words and doubtedly useful features recent versions of
JavaScript are rapidly adding.

*eth* does all that while really staying close to JavaScript's true nature and ecosystem. Anything
you can do in JavaScript can be done in *eth*.

# types

| name | example | description |
|---|---|---|
| **nil** | `nil` | translates to `undefined` |
| **boolean** | `true` | same as JS booleans |
| **number** | `1.23` | same as JS numbers |
| **string** | `"xyz"` | same as JS strings |
| **symbol** | `x` | translates to the symbol itself but supports special characters disalowed in JS |
| **array** | `[1 2 3]` | same as JS arrays, but, you drop the commas |
| **object** | `{a 1 b 2}` | same as JS objects, but, you drop the commas and colons |

# built-in's

```
get
set
delete
def
fn
cond
```

# license

MIT
