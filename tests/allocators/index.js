const fs = require("fs");
const COMMON_MAX = 1 << 30;

function test(file) {
  console.log("Testing '" + file + "' ...\n");

  const exports = new WebAssembly.Instance(new WebAssembly.Module(fs.readFileSync(__dirname + "/" + file)), {
    env: {
      abort: function(msg, file, line, column) {
        throw Error("Assertion failed: " + (msg ? "'" + getString(msg) + "' " : "") + "at " + getString(file) + ":" + line + ":" + column);
      },
      log: function(ptr) { console.log(getString(ptr)); },
      logi: function(i) { console.log(i); }
    }
  }).exports;

  function getString(ptr) {
    var len = new Uint32Array(exports.memory.buffer, ptr)[0];
    var str = new Uint16Array(exports.memory.buffer, ptr + 4).subarray(0, len);
    return String.fromCharCode.apply(String, str);
  }

  require("./runner")(exports, 20, 20000);

  console.log("mem final: " + exports.memory.buffer.byteLength);
  console.log();

  try {
    exports.allocate_memory(COMMON_MAX + 1); // unreachable
    throw Error("allocation is allowed to overflow MAX_SIZE");
  } catch (e) {}
  try {
    exports.allocate_memory(0xffffffff); // unreachable
    throw Error("allocation is allowed to overflow INT_MAX");
  } catch (e) {}
}

if (process.argv.length > 2) {
  test(process.argv[2] + "/untouched.wasm");
  test(process.argv[2] + "/optimized.wasm");
} else {
  console.error("Usage: npm test <allocator>");
  process.exit(1);
}
