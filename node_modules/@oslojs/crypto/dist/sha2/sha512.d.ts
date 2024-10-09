import type { Hash } from "../hash/index.js";
export declare function sha512(data: Uint8Array): Uint8Array;
export declare class SharedSHA512 {
    blockSize: number;
    size: number;
    private blocks;
    private currentBlockSize;
    private l;
    private w;
    private H;
    constructor(H: BigUint64Array);
    update(data: Uint8Array): void;
    putDigest(result: Uint8Array): void;
    private process;
}
export declare class SHA512 implements Hash {
    blockSize: number;
    size: number;
    private sha512;
    update(data: Uint8Array): void;
    digest(): Uint8Array;
}
