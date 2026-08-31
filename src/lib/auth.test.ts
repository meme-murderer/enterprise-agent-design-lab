import { afterEach, describe, expect, it } from "vitest";
import { validFacilitatorPin } from "@/lib/auth";

describe("facilitator PIN", () => {
  afterEach(() => delete process.env.FACILITATOR_PIN);

  it("fails closed when unconfigured", () => {
    expect(validFacilitatorPin("1234")).toBe(false);
  });

  it("requires an exact match", () => {
    process.env.FACILITATOR_PIN = "example-test-pin";
    expect(validFacilitatorPin("example-test-pin")).toBe(true);
    expect(validFacilitatorPin("wrong-test-pin")).toBe(false);
  });
});
