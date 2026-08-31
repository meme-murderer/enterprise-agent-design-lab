import { describe, expect, it } from "vitest";
import { detectSensitiveContent } from "@/lib/privacy";

describe("detectSensitiveContent", () => {
  it("allows generalized process descriptions", () => {
    expect(
      detectSensitiveContent([
        "Vendor onboarding",
        "Reduce avoidable review delays",
      ]),
    ).toBeNull();
  });

  it("detects direct contact information", () => {
    expect(
      detectSensitiveContent(["Send the result to person@example.com"]),
    ).toBe("email address");
  });

  it("detects likely credentials", () => {
    expect(detectSensitiveContent(["API key: abc123"])).toBe(
      "credential or secret",
    );
  });
});
