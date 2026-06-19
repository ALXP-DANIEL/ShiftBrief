// Room code generation. Uppercase, unambiguous alphabet (no I, O, 0, 1).

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const DEFAULT_LENGTH = 5;

export function generateRoomCode(length: number = DEFAULT_LENGTH): string {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * ALPHABET.length);
    code += ALPHABET[index];
  }
  return code;
}

export function normalizeRoomCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function isValidRoomCode(raw: string): boolean {
  const code = normalizeRoomCode(raw);
  if (code.length < 4 || code.length > 6) return false;
  return [...code].every((char) => ALPHABET.includes(char));
}

/**
 * Generate a unique code, checking existence via the provided async predicate.
 * Falls back to a longer code if short ones keep colliding.
 */
export async function generateUniqueRoomCode(
  exists: (code: string) => Promise<boolean>,
): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const length = attempt < 8 ? DEFAULT_LENGTH : 6;
    const code = generateRoomCode(length);
    if (!(await exists(code))) return code;
  }
  // Extremely unlikely; widen the space to guarantee progress.
  return generateRoomCode(6) + generateRoomCode(2);
}
