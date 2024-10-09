import type { Hash } from "../hash/index.js";
export declare function shake128(size: number, data: Uint8Array): Uint8Array;
export declare function shake256(size: number, data: Uint8Array): Uint8Array;
export declare class SHAKE128 implements Hash {
    blockSize: number;
    size: number;
    private sha3;
    constructor(size: number);
    update(data: Uint8Array): void;
    digest(): Uint8Array;
}
export declare class SHAKE256 implements Hash {
    blockSize: number;
    size: number;
    private sha3;
    constructor(size: number);
    update(data: Uint8Array): void;
    digest(): Uint8Array;
}
