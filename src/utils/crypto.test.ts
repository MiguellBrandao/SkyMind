import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret, maskSecret } from "./crypto";

describe("encryptSecret / decryptSecret", () => {
  it("round-trips a secret", () => {
    const secret = "sk-super-secret-api-key-1234567890";
    const encrypted = encryptSecret(secret);
    expect(encrypted).not.toContain(secret);
    expect(decryptSecret(encrypted)).toBe(secret);
  });

  it("produces a different ciphertext each time (random IV)", () => {
    const secret = "same-secret";
    expect(encryptSecret(secret)).not.toBe(encryptSecret(secret));
  });

  it("throws on a malformed payload", () => {
    expect(() => decryptSecret("not-a-valid-payload")).toThrow();
  });

  it("throws when the auth tag has been tampered with", () => {
    const encrypted = encryptSecret("secret-value");
    const parts = encrypted.split(":");
    const tampered = [parts[0], Buffer.from("tampered-tampered-tam").toString("base64"), parts[2]].join(":");
    expect(() => decryptSecret(tampered)).toThrow();
  });
});

describe("maskSecret", () => {
  it("masks the middle of a long secret", () => {
    expect(maskSecret("sk-abcdefghijklmnop")).toBe("sk-a...mnop");
  });

  it("fully masks very short secrets", () => {
    expect(maskSecret("short")).toBe("****");
  });
});
