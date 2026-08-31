import { describe, expect, it } from "vitest";
import { clientKey } from "@/lib/rate-limit";

describe("participant request identity", () => {
  it("prefers an anonymous browser session over the shared room address", () => {
    const request = new Request("https://example.test", {
      headers: {
        "x-workshop-session": "550e8400-e29b-41d4-a716-446655440000",
        "x-forwarded-for": "203.0.113.10",
      },
    });
    expect(clientKey(request)).toBe(
      "session:550e8400-e29b-41d4-a716-446655440000",
    );
  });

  it("falls back to the network address for invalid session values", () => {
    const request = new Request("https://example.test", {
      headers: {
        "x-workshop-session": "too-short",
        "x-forwarded-for": "203.0.113.10",
      },
    });
    expect(clientKey(request)).toBe("network:203.0.113.10");
  });
});
