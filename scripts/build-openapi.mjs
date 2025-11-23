import fs from "fs";
import path from "path";

// Import the generated swagger spec from the project's config. This file uses ESM imports.
const { default: swaggerSpec } = await import("../src/config/swagger.js");

const outDir = path.resolve("./src/docs");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Write pretty JSON of the generated spec
fs.writeFileSync(path.join(outDir, "openapi.json"), JSON.stringify(swaggerSpec, null, 2), "utf8");
console.log("Wrote src/docs/openapi.json");

// Helper to build a simple example value from a schema
function exampleFromSchema(schema, visited = new WeakSet()) {
  if (!schema) return null;
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (schema.$ref) return null; // don't resolve $ref here
  if (schema.type === "string") return schema.format === "email" ? "user@example.com" : schema.enum ? schema.enum[0] : "string";
  if (schema.type === "integer" || schema.type === "number") return 1;
  if (schema.type === "boolean") return true;
  if (schema.type === "array") {
    const item = exampleFromSchema(schema.items || {}, visited);
    return item === null ? [] : [item];
  }
  if (schema.type === "object" || schema.properties) {
    if (visited.has(schema)) return {};
    visited.add(schema);
    const out = {};
    const props = schema.properties || {};
    for (const [k, v] of Object.entries(props)) {
      out[k] = exampleFromSchema(v, visited);
    }
    return out;
  }
  return null;
}

// Build examples mapping for request bodies
const examples = {};
for (const [p, methods] of Object.entries(swaggerSpec.paths || {})) {
  examples[p] = {};
  for (const [method, op] of Object.entries(methods || {})) {
    const rb = op.requestBody;
    if (!rb) continue;
    const content = rb.content || {};
    // Prefer application/json example if present
    const json = content["application/json"] || Object.values(content)[0];
    if (!json) continue;
    let schema = json.schema || {};
    let ex = null;
    if (json.example !== undefined) ex = json.example;
    else if (json.examples) {
      // pick first example
      const first = Object.values(json.examples)[0];
      ex = first && first.value ? first.value : null;
    }
    if (ex === null) {
      ex = exampleFromSchema(schema) || null;
    }
    examples[p][method] = ex;
  }
}

fs.writeFileSync(path.join(outDir, "openapi-examples.json"), JSON.stringify(examples, null, 2), "utf8");
console.log("Wrote src/docs/openapi-examples.json");

// Done
console.log("OpenAPI build complete.");
