import bin from "./glfw3_linux.js";

const start = performance.now();
const tmp = Deno.makeTempFileSync();
Deno.writeFileSync(tmp, bin);
const ffi = Deno.dlopen(
  tmp,
  {
    glfwInit: { parameters: [], result: "i32" },
  } as const,
).symbols;
Deno.removeSync(tmp);
const end = performance.now();
console.log(`Loaded in ${end - start}ms`);
console.log(ffi.glfwInit());
