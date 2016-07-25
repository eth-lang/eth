// eth compiler
require('./tokens');
var core = require('./core');

// read {{{
var NODES = {
  ROOT: 'root',
  NIL: 'nil',
  BOOLEAN: 'bool',
  NUMBER: 'number',
  STRING: 'string',
  KEYWORD: 'keyword',
  SYMBOL: 'symbol',
  ARRAY: 'array',
  OBJECT: 'object',
  CALL: 'call',
  REF: 'ref',
  BLOCK: 'block'
};

var tokens;
var index;
var token;

function readList(ast, endCh) {
  while (true) {
    index = index + 1;
    token = tokens[index];
    if (!token) {
      throw new Error('unterminated list starting at ' + ast.token.from + '\nstart: ' +
        prettyPrint(ast));
    }
    if (token.type === 'operator' && token.value === endCh) {
        return;
    }
    readToken(ast, token);
  }
}

function readToken(ast, token) {
    if (token.type === 'name' && token.value === 'nil') {
      ast.nodes.push({type: NODES.NIL, token: token, value: undefined});
      return;
    }
    if (token.type === 'name' && token.value === 'true') {
      ast.nodes.push({type: NODES.BOOLEAN, token: token, value: true});
      return;
    }
    if (token.type === 'name' && token.value === 'false') {
      ast.nodes.push({type: NODES.BOOLEAN, token: token, value: false});
      return;
    }
    if (token.type === 'number') {
      ast.nodes.push({type: NODES.NUMBER, token: token, value: token.value});
      return;
    }
    if (token.type === 'string') {
      ast.nodes.push({type: NODES.STRING, token: token, value: token.value});
      return;
    }
    if (token.type === 'name' && token.value.startsWith(':')) {
      ast.nodes.push({type: NODES.KEYWORD, token: token, value: token.value.slice(1)});
      return;
    }
    if (token.type === 'operator' && token.value === '[') {
      ast.nodes.push({type: NODES.ARRAY, token: token, nodes: []});
      readList(ast.nodes[ast.nodes.length-1], ']');
      return;
    }
    if (token.type === 'operator' && token.value === '{') {
      ast.nodes.push({type: NODES.OBJECT, token: token, nodes: []});
      var objectOrBlock = ast.nodes[ast.nodes.length-1];

      readList(objectOrBlock, '}');

      if (objectOrBlock.nodes.length > 0 && objectOrBlock.nodes[0].type !== NODES.KEYWORD) {
        // convert to block is 1st key is not a :keyword
        objectOrBlock.type = NODES.BLOCK;
      }
      return;
    }
    if (token.type === 'operator' && token.value === '(') {
      ast.nodes[ast.nodes.length-1] = {
        type: NODES.CALL,
        token: token,
        callee: ast.nodes[ast.nodes.length-1],
        nodes: []
      };
      readList(ast.nodes[ast.nodes.length-1], ')');
      return;
    }
    if (token.type === 'operator' && token.value === '.') {
      var refAst = {nodes: []};
      index = index + 1;
      token = tokens[index];

      // If next token is . too, it's not a ref but a symbol
      if (token.value === '.') {
        ast.nodes.push({type: NODES.SYMBOL, token: tokens[index-1], value: '..'});
        return;
      }

      readToken(refAst, token);
      ast.nodes[ast.nodes.length-1] = {
        type: NODES.REF,
        token: token,
        left: ast.nodes[ast.nodes.length-1],
        right: refAst.nodes[0]
      };
      return;
    }
    ast.nodes.push({type: NODES.SYMBOL, token: token, value: token.value});
    // throw new Error('unhandled token: ' + JSON.stringify(token));
}

function read(code) {
  var ast = {
    type: NODES.ROOT,
    nodes: []
  };

  tokens = code.tokens('=<>!+-*&|/%^', '=<>&|');
  index = -1;

  while (true) {
    index = index + 1;
    token = tokens[index];
    if (!token) {
      break;
    }

    readToken(ast, token);
  }

  return ast;
}
// }}}

// write {{{

function escapeSymbol(symbol) {
  // special
  symbol = symbol.replace(/\./g, '_dot_');
  symbol = symbol.replace(/!/g, '_bang_');
  symbol = symbol.replace(/\?/g, '_q_');
  symbol = symbol.replace(/-/g, '_');
  symbol = symbol.replace(/#/g, '_hash_');

  // operators
  symbol = symbol.replace(/\+/g, 'sum');
  symbol = symbol.replace(/-/g, 'subtract');
  symbol = symbol.replace(/\*/g, 'multiply');
  symbol = symbol.replace(/\//g, 'divive');
  symbol = symbol.replace(/%/g, 'modulo');
  symbol = symbol.replace(/==/g, 'eq');
  symbol = symbol.replace(/!=/g, 'notEq');
  symbol = symbol.replace(/<=/g, 'lowerOrEqual');
  symbol = symbol.replace(/>=/g, 'greaterOrEqual');
  symbol = symbol.replace(/</g, 'lower');
  symbol = symbol.replace(/>/g, 'greater');
  symbol = symbol.replace(/\|\|/g, 'or');
  symbol = symbol.replace(/&&/g, 'and');
  symbol = symbol.replace(/=/g, 'set');

  // reserved
  symbol = symbol.replace(/^export$/g, '_export');
  symbol = symbol.replace(/^import$/g, '_import');
  symbol = symbol.replace(/^in$/g, '_in');
  symbol = symbol.replace(/^instanceof$/g, '_instanceof');
  symbol = symbol.replace(/^new$/g, '_new');
  symbol = symbol.replace(/^throw$/g, '_throw');
  symbol = symbol.replace(/^try$/g, '_try');
  symbol = symbol.replace(/^typeof$/g, '_typeof');
  symbol = symbol.replace(/^void$/g, '_void');
  return symbol;
}

function wrapInIife(code) {
  return '(function () {' + code + '}).call(this)';
}

// default to a simple function call but handles all the builtins like fn, cond & more
function writeCall(node) {
  var calleeName;
  if (node.callee.type === NODES.SYMBOL) {
    calleeName = node.callee.value;
  }

  if (calleeName === 'ffi') {
    // TODO check that we have exatly one arg this is a string
    return node.nodes[0].value;
  }

  if (calleeName === 'fn') {
    var prelude = '';

    // handle noop
    if (node.nodes.length === 0) {
      return '(function () {})';
    }

    // do we have space for .. + arg name + body
    if (node.nodes.length >= 3) {
      // is the before last arg (skipping body) a ..
      var spreadNode = node.nodes[node.nodes.length - 3];
      if (spreadNode.type === NODES.SYMBOL && spreadNode.value === '..') {
        prelude = 'var ' + escapeSymbol(node.nodes[node.nodes.length - 2].value)
          + ' = Array.prototype.slice.call(arguments, ' + (node.nodes.length - 3) + ');';
        node.nodes.splice(node.nodes.length - 3, 2);
      }
    }

    node.nodes.slice(0, -1).forEach(function (node) {
      if (node.type != NODES.SYMBOL) {
        throw new Error('builtin "fn" parameter "' + prettyPrint(node) + '" is not of type symbol');
      }
    });

    // if body node is empty object, treat as empty block
    var bodyNode = node.nodes[node.nodes.length - 1];
    if (bodyNode.type === NODES.OBJECT && bodyNode.nodes.length === 0) {
      bodyNode = {type: NODES.NIL, value: undefined};
    }

    return '(function ('
      + node.nodes.slice(0, -1).map(writeNode).join(', ') + ') {' + prelude + 'return '
      + writeNode(bodyNode) + ';})';
  }

  if (calleeName === 'get') {
    if (node.nodes.length !== 2) {
      throw new Error('builtin "get" takes exactly 2 params: key and target, got: '
        + prettyPrint(node));
    }
    return writeNode(node.nodes[0]) + '[' + writeNode(node.nodes[1]) + ']'
  }

  if (calleeName === 'set' || calleeName === '=') {
    if (node.nodes.length !== 2) {
      throw new Error('builtin "set" takes exactly 2 params: name and value, got: '
        + prettyPrint(node));
    }
    return writeNode(node.nodes[0]) + ' = ' + writeNode(node.nodes[1])
  }

  if (calleeName === 'let') {
    if (node.nodes.length !== 2) {
      throw new Error('builtin "let" takes exactly 2 params: name and value, got: '
        + prettyPrint(node));
    }
    if (node.nodes[0].type !== NODES.SYMBOL) {
      throw new Error('builtin "let" need a symbol as first parameter, got: '
        + prettyPrint(node));
    }
    return 'var ' + writeNode(node.nodes[0]) + ' = ' + writeNode(node.nodes[1])
  }

  if (calleeName === 'delete') {
    if (node.nodes.length !== 2) {
      throw new Error('builtin "delete" takes exactly 1 param: target, got: '
        + prettyPrint(node));
    }
    return 'delete ' + writeNode(node.nodes[0]);
  }

  if (calleeName === 'if') {
    if (node.nodes.length < 2 || node.nodes.length > 3) {
      throw new Error('builtin "if" a minimum of 2 and a maximum of 3 arguments (condition then else), got: '
        + prettyPrint(node));
    }
    var thenBody = '{return ' + writeNode(node.nodes[1]) + ';}';
    var elseBody = '{return ' + (node.nodes[2] ? writeNode(node.nodes[2]) : 'undefined') + ';}';
    return wrapInIife('if (' + writeNode(node.nodes[0]) + ') '
      + thenBody + ' else ' + elseBody);
  }

  if (calleeName === 'cond') {
    if (node.nodes.length % 2 !== 0) {
      throw new Error('builtin "cond" needs a pair amount of items, (condition result)*, got: '
        + prettyPrint(node));
    }
    var result = [];
    for (var i = 0; i < node.nodes.length; i++) {
      if (i % 2 === 1) {
        var ifBody = '{return ' + writeNode(node.nodes[i]) + ';}';
        if (node.nodes[i - 1].type === NODES.KEYWORD && node.nodes[i - 1].value === 'else') {
          result.push(ifBody);
        } else {
          result.push('if (' + writeNode(node.nodes[i - 1]) + ') ' + ifBody);
        }
      }
    }
    return wrapInIife(result.join(' else '));
  }

  if (calleeName === 'or' || calleeName === '||') {
    return '(' + node.nodes.map(writeNode).join(' || ') + ')';
  }
  if (calleeName === 'and' || calleeName === '&&') {
    return '(' + node.nodes.map(writeNode).join(' && ') + ')';
  }
  if ('+-*/'.indexOf(calleeName) > -1) {
    if (node.nodes.length < 2) {
      throw new Error('builtin "' + calleeName + '" needs a minimum of 2 arguments, got: '
        + prettyPrint(node));
    }
    return '(' + node.nodes.map(writeNode).join(' ' + calleeName + ' ') + ')';
  }

  return writeNode(node.callee) + '(' + node.nodes.map(writeNode).join(', ') + ')';
}

function writeNode(node) {
  if (node.type === NODES.ROOT) {
    return node.nodes.map(writeNode).join(';\n');
  }
  if (node.type === NODES.ARRAY) {
    return '[' + node.nodes.map(writeNode).join(', ') + ']';
  }
  if (node.type === NODES.OBJECT) {
    if (node.nodes.length % 2 !== 0) {
      throw new Error('object literal contains an odd number of elements, need a value for each key' +
        '\ngiven: ' + prettyPrintNode(node));
    }
    var out = '';
    for (var i = 0; i < node.nodes.length; i++) {
      if (i % 2 === 0) {
        out = out + writeNode(node.nodes[i]) + ': ';
      } else {
        out = out + writeNode(node.nodes[i]);
        if (i !== node.nodes.length - 1) {
          out = out + ', ';
        }
      }
    }
    return '{' + out.trim() + '}';
  }
  if (node.type === NODES.BLOCK) {
    return '(function () {' + node.nodes.slice(0, -1).map(writeNode).join(';')
      + (node.nodes.length > 1 ? ';' : '') + 'return ' + writeNode(node.nodes[node.nodes.length - 1])
      + ';}).call(this)';
  }
  if (node.type === NODES.CALL) {
    return writeCall(node);
  }
  if (node.type === NODES.REF) {
    // symbol to the right? use dot deref notation
    if (node.right.type === NODES.SYMBOL) {
      return writeNode(node.left) + '.' + writeNode(node.right);
    }
    return writeNode(node.left) + '[' + writeNode(node.right) + ']';
  }
  if (node.type === NODES.KEYWORD) {
    return '"' + escapeSymbol(node.value) + '"';
  }
  if (node.type === NODES.SYMBOL) {
    return escapeSymbol(node.value);
  }
  return node.value === undefined ? 'undefined' : JSON.stringify(node.value);
}

function write(ast) {
  return writeNode(ast);
}
// }}}

// compile {{{
function compile(code) {
  var prelude = '';
  var result = write(read(code));

  // now, let prepend the prelude, but, only for the functions possibly used in the compiled code
  core.forEach(function(coreFnName) {
    if (result.indexOf(coreFnName) > -1) {
      prelude += 'var ' + coreFnName + ' = require("eth/core").' + coreFnName + ';';
    }
  }, core.keys(core));

  return prelude + '\n' + result + '\n';
}
// }}}

// pretty {{{
function prettyPrint(ast) {
  function prettyPrintNode(node) {
    if (node.type === NODES.ROOT) {
      return node.nodes.map(prettyPrintNode).join('\n');
    }
    if (node.type === NODES.ARRAY) {
      return '[' + node.nodes.map(prettyPrintNode).join(' ') + ']';
    }
    if (node.type === NODES.OBJECT) {
      return '{' + node.nodes.map(prettyPrintNode).join(' ') + '}';
    }
    if (node.type === NODES.CALL) {
      return prettyPrintNode(node.callee) + '(' + node.nodes.map(prettyPrintNode).join(' ') + ')';
    }
    if (node.type === NODES.REF) {
      return prettyPrintNode(node.left) + '.' + prettyPrintNode(node.right);
    }
    if (node.type === NODES.SYMBOL) {
      return node.value;
    }
    return node.value === undefined ? 'undefined' : JSON.stringify(node.value);
  }
  return prettyPrintNode(ast);
}

function indent(jsCode) {
  var out = '';
  var indentWidth = '';
  var inString = false;
  for (var i = 0; i < jsCode.length; i++) {
    if (jsCode[i] === '}' && !inString) {
      indentWidth = indentWidth.slice(0, -2);
      out += '\n' + indentWidth;
    }

    out += jsCode[i];
    if (jsCode[i] === '"' && (jsCode[i-1] !== '\\' || (jsCode[i-1] === '\\' &&jsCode[i-2] === '\\' ))) {
      inString = !inString;
    }

    if (jsCode[i] === '{' && !inString) {
      indentWidth += '  ';
      out += '\n' + indentWidth;
    }
    if (jsCode[i] === ';' && !inString) {
      if (jsCode[i + 1] !== '}') {
        out += '\n' + indentWidth;
      }
    }
  }
  return out;
}
// }}}

module.exports = {
  read: read,
  write: write,
  prettyPrint: prettyPrint,
  indent: indent,
  compile: compile
};
