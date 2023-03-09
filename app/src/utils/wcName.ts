export async function generateWCName(str: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashBase64 = btoa(String.fromCharCode(...hashArray));
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  const firstPart = hashBase64
    .substr(0, 5)
    .toLowerCase()
    .replace(/[^a-z]/g, (c) => alphabet[c.charCodeAt(0) % alphabet.length]);
  const secondPart = hashBase64
    .substr(5, 4)
    .toLowerCase()
    .replace(/[^a-z]/g, (c) => alphabet[c.charCodeAt(0) % alphabet.length]);
  return `${firstPart}-${secondPart}`;
}
