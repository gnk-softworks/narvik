export function rotl32(x, n) {
    return ((x << n) | (x >>> (32 - n))) >>> 0;
}
export function rotr32(x, n) {
    return ((x << (32 - n)) | (x >>> n)) >>> 0;
}
export function rotr64(x, n) {
    return ((x << BigInt(64 - n)) | (x >> BigInt(n))) & 0xffffffffffffffffn;
}
export function rotl64(x, n) {
    return ((x << BigInt(n)) | (x >> BigInt(64 - n))) & 0xffffffffffffffffn;
}
