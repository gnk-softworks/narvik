import type { HashAlgorithm } from "../hash/index.js";
export declare class HMAC {
    private k0;
    private inner;
    private outer;
    constructor(Algorithm: HashAlgorithm, key: Uint8Array);
    update(message: Uint8Array): void;
    digest(): Uint8Array;
}
export declare function hmac(Algorithm: HashAlgorithm, key: Uint8Array, message: Uint8Array): Uint8Array;
