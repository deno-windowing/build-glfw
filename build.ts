import { encodeBase64 } from "@std/encoding/base64";

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
}.ts`;

const decodeFunction = [
  "function decodeBase64(b64: string): Uint8Array {",
  "  const binString = atob(b64);",
  "  const size = binString.length;",
  "  const bytes = new Uint8Array(size);",
  "  for (let i = 0; i < size; i++) {",
  "    bytes[i] = binString.charCodeAt(i);",
  "  }",
  "  return bytes;",
  "}",
].join("\n");

Deno.writeTextFileSync(
  OUT_FILE,
  `${decodeFunction}\nconst BASE64 = "${
    encodeBase64(Deno.readFileSync(BIN_FILE))
  }";\nconst DECODED: Uint8Array = Deno.build.os === "${Deno.build.os}" && Deno.build.arch === "${Deno.build.arch}" ? decodeBase64(BASE64) : new Uint8Array();\nexport default DECODED;\n`,
);

console.log(`%cWrote ${OUT_FILE}`, "color: #888");
