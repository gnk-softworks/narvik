export declare class SHA3 {
    private rate;
    private outputSize;
    private state;
    private absorbedBytes;
    constructor(rate: number, outputSize: number);
    absorb(bytes: Uint8Array): void;
    squeeze(): Uint8Array;
}
export declare class SHA3XOF {
    private rate;
    private outputSize;
    private state;
    private absorbedBytes;
    constructor(rate: number, outputSize: number);
    absorb(bytes: Uint8Array): void;
    squeeze(): Uint8Array;
}
