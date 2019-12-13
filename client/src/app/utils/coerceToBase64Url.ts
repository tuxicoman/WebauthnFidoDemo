export function coerceToBase64Url(
  thing:
    | string
    | Iterable<number>
    | ArrayBuffer
    | ArrayLike<number>
    | SharedArrayBuffer
    | Uint8Array
    | number[]
) {
  // Array or ArrayBuffer to Uint8Array
  if (Array.isArray(thing)) {
    thing = Uint8Array.from(thing);
  }
  if (thing instanceof ArrayBuffer) {
    thing = new Uint8Array(thing);
  }
  // Uint8Array to base64
  if (thing instanceof Uint8Array) {
    let str = "";
    const len = thing.byteLength;
    for (let i = 0; i < len; i++) {
      str += String.fromCharCode(thing[i]);
    }
    thing = window.btoa(str);
  }
  if (typeof thing !== "string") {
    throw new Error("could not coerce to string");
  }
  // base64 to base64url
  // NOTE: "=" at the end of challenge is optional, strip it off here
  thing = thing
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=*$/g, "");
  return thing;
}
