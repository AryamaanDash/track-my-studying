import { readFileSync } from "node:fs";
import ts from "typescript";

// Execute the actual handler source with explicit boundary doubles. This keeps
// database/auth/cache calls observable without booting Next or touching user data.
export function loadIsolatedModule(path, dependencies) {
  const { outputText } = ts.transpileModule(readFileSync(path, "utf8"), {
    fileName: path.pathname,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  });
  const loadedModule = { exports: {} };
  const require = (name) => {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  };
  new Function("require", "module", "exports", outputText)(require, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}
