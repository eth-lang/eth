var readFileSync = require("fs").readFileSync;
var eth = require("./eth");
var path = process.argv[2];
if (!path) return console.log("no file provided");
var source = readFileSync(path, "utf8");
source.tokens(":=<>!+-*&|/%^", "=<>&|").forEach(t => {
  console.log(t.type + ' "' + t.value + '"');
});
console.log("==================================");
function ppAst(ast, indent) {
  indent = indent || "";
  switch (ast.type) {
    case "root":
      return ast.nodes.map(n => ppAst(n, indent)).join(" ");
    case "symbol":
      if (ast.value === ";") {
        return ";\n" + indent;
      }
      return ast.value;
    case "string":
      return JSON.stringify(ast.value);
    case "number":
      return String(parseFloat(ast.value));
    case "keyword":
      return ":" + ast.value;
    case "block":
      return (
        "{\n" +
        indent +
        "  " +
        ast.nodes.map(n => ppAst(n, indent + "  ")).join(" ") +
        "}"
      );
    case "array":
      return "[" + ast.nodes.map(n => ppAst(n, indent + "  ")).join(" ") + "]";
    case "object":
      return "[" + ast.nodes.map(n => ppAst(n, indent + "  ")).join(" ") + "]";
    default:
      throw new Error("unknown ast node: " + JSON.stringify(ast));
  }
}
console.log(ppAst(eth.read(source)));
//console.log(JSON.stringify(eth.read(source), null, 2));
