import "server-only";
import { timingSafeEqual } from "node:crypto";

export function validFacilitatorPin(candidate: string | null) {
  const expected = process.env.FACILITATOR_PIN;
  if (!expected || !candidate) return false;
  const left = Buffer.from(candidate);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}
