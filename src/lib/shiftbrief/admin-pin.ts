const ITERATIONS = 210_000;

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

function fromBase64(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, "base64"));
}

async function derivePin(pin: string, salt: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: new Uint8Array(salt).buffer,
      iterations: ITERATIONS,
    },
    key,
    256,
  );
  return new Uint8Array(bits);
}

export async function hashAdminPin(pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePin(pin, salt);
  return `pbkdf2-sha256:${ITERATIONS}:${toBase64(salt)}:${toBase64(hash)}`;
}

export async function verifyAdminPin(
  pin: string,
  encoded: string,
): Promise<boolean> {
  const [algorithm, iterations, saltValue, expectedValue] = encoded.split(":");
  if (
    algorithm !== "pbkdf2-sha256" ||
    Number(iterations) !== ITERATIONS ||
    !saltValue ||
    !expectedValue
  ) {
    return false;
  }

  const actual = await derivePin(pin, fromBase64(saltValue));
  const expected = fromBase64(expectedValue);
  if (actual.length !== expected.length) return false;

  let difference = 0;
  for (let index = 0; index < actual.length; index++) {
    difference |= actual[index] ^ expected[index];
  }
  return difference === 0;
}
