import type { Hash } from "../hash/index.js";
export declare function sha512_224(data: Uint8Array): Uint8Array;
export declare class SHA512_224 implements Hash {
    blockSize: number;
    size: number;
    private sha512;
    update(data: Uint8Array): void;
    digest(): Uint8Array;
}
