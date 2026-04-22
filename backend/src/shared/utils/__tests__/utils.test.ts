import { describe, it, expect } from "vitest";
import { parseId, parsePagination } from "../index";

describe("parseId", () => {
  it("should parse a valid positive integer string", () => {
    expect(parseId("1")).toBe(1);
    expect(parseId("42")).toBe(42);
    expect(parseId("999")).toBe(999);
  });

  it("should throw for zero", () => {
    expect(() => parseId("0")).toThrow("Invalid ID parameter");
  });

  it("should throw for negative numbers", () => {
    expect(() => parseId("-1")).toThrow("Invalid ID parameter");
  });

  it("should throw for non-numeric strings", () => {
    expect(() => parseId("abc")).toThrow("Invalid ID parameter");
    expect(() => parseId("")).toThrow("Invalid ID parameter");
  });

  it("should throw for floating-point numbers", () => {
    expect(() => parseId("1.5")).toThrow("Invalid ID parameter");
  });

  it("should throw for array values", () => {
    expect(() => parseId(["1", "2"])).toThrow("Invalid ID parameter");
  });
});

describe("parsePagination", () => {
  it("should return defaults when no params provided", () => {
    expect(parsePagination({})).toEqual({ limit: 50, offset: 0 });
  });

  it("should parse valid limit and offset", () => {
    expect(parsePagination({ limit: "10", offset: "20" })).toEqual({
      limit: 10,
      offset: 20,
    });
  });

  it("should cap limit at 200", () => {
    expect(parsePagination({ limit: "500" })).toEqual({ limit: 200, offset: 0 });
  });

  it("should default limit when less than 1", () => {
    expect(parsePagination({ limit: "0" })).toEqual({ limit: 50, offset: 0 });
    expect(parsePagination({ limit: "-5" })).toEqual({ limit: 50, offset: 0 });
  });

  it("should floor negative offset to 0", () => {
    expect(parsePagination({ offset: "-10" })).toEqual({ limit: 50, offset: 0 });
  });

  it("should handle non-numeric values with defaults", () => {
    expect(parsePagination({ limit: "abc", offset: "xyz" })).toEqual({
      limit: 50,
      offset: 0,
    });
  });
});
