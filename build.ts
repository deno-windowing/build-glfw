import { encode } from "https://deno.land/std@0.173.0/encoding/base64.ts";

const $ = (cmd: string, ...args: string[]) => {
  console.log(`%c$ ${cmd} ${args.join(" ")}`, "color: #888");
  return new Deno.Command(cmd, {
    args,
    stdin: "null",
    stdout: "inherit",
    stderr: "inherit",
  }).outputSync();
};

try {
  Deno.removeSync("./build", { recursive: true });
} catch (_e) {
  // ignore
}

Deno.mkdirSync("./build");

const cmakeArgs = [
  "-S",
  "./glfw",
  "-B",
  "./build",
];

if (Deno.build.os === "windows") {
  cmakeArgs.push("-G", "Visual Studio 17 2022");
}

cmakeArgs.push(
  "-D",
  "BUILD_SHARED_LIBS=ON",
  "-D",
  "GLFW_BUILD_EXAMPLES=OFF",
  "-D",
  "GLFW_BUILD_TESTS=OFF",
  "-D",
  "GLFW_BUILD_DOCS=OFF",
  "-D",
  "CMAKE_BUILD_TYPE=Release",
);

$("cmake", ...cmakeArgs);

$("cmake", "--build", "./build", "--config", "Release");

const BUILD_FILE = Deno.build.os === "windows"
  ? "./build/src/Release/glfw3.dll"
  : Deno.build.os === "linux"
  ? "./build/src/libglfw.so"
  : "./build/src/libglfw.dylib";

const BIN_FILE = Deno.build.os === "windows"
  ? "./glfw3.dll"
  : Deno.build.os === "linux"
  ? "./libglfw3.so"
  : `./libglfw3${Deno.build.arch === "aarch64" ? "_aarch64" : ""}.dylib`;

Deno.copyFileSync(BUILD_FILE, BIN_FILE);

const OUT_FILE = `./glfw3_${Deno.build.os}${
  Deno.build.arch === "aarch64" ? "_aarch64" : ""
}.js`;

Deno.writeTextFileSync(
  OUT_FILE,
  `const BASE64 = "${
    encode(Deno.readFileSync(BIN_FILE))
  }";\nfunction decode(b64) {\n  const binString = atob(b64);\n  const size = binString.length;\n  const bytes = new Uint8Array(size); \n  for (let i = 0; i < size; i++) {\n    bytes[i] = binString.charCodeAt(i);\n  }\n  return bytes;\n}\nconst DECODED = Deno.build.os === "${Deno.build.os}" && Deno.build.arch === "${Deno.build.arch}" ? Deno.core.ops.op_base64_decode(BASE64) : new Uint8Array();\nexport default DECODED;\n`,
);

console.log(`%cWrote ${OUT_FILE}`, "color: #888");
