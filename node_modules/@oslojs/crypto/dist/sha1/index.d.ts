import type { Hash } from "../hash/index.js";
export declare function sha1(data: Uint8Array): Uint8Array;
export declare class SHA1 implements Hash {
    blockSize: number;
    size: number;
    private blocks;
    private currentBlockSize;
    private H;
    private l;
    private w;
    update(data: Uint8Array): void;
    digest(): Uint8Array;
    private process;
}
