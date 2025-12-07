import { swaggerSpec } from "../../../src/config/swagger.js";

describe("OpenAPI Specification", () => {
  describe("Base Structure", () => {
    test("should have valid OpenAPI 3.0.0 version", () => {
      expect(swaggerSpec.openapi).toBe("3.0.0");
    });

    test("should have required top-level fields", () => {
      expect(swaggerSpec).toHaveProperty("openapi");
      expect(swagg