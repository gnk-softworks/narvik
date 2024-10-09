import type { Hash } from "../hash/index.js";
export declare function sha3_224(data: Uint8Array): Uint8Array;
export declare function sha3_256(data: Uint8Array): Uint8Array;
export declare function sha3_384(data: Uint8Array): Uint8Array;
export declare function sha3_512(data: Uint8Array): Uint8Array;
export declare class SHA3_224 implements Hash {
    blockSize: number;
    size: number;
    private sha3;
    update(data: Uint8Array): void;
    digest(): Uint8Array;
}
export declare class SHA3_256 implements Hash {
    blockSize: number;
    size: number;
    private sha3;
    update(data: Uint8Array): void;
    digest(): Uint8Array;
}
export declare class SHA3_384 implements Hash {
    blockSize: number;
    size: number;
    private sha3;
    update(data: Uint8Array): void;
    digest(): Uint8Array;
}
export declare class SHA3_512 implements Hash {
    blockSize: number;
    size: number;
    private sha3;
    update(data: Uint8Array): void;
    digest(): Uint8Array;
}
