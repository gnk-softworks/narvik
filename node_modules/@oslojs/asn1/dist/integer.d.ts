export declare function bigIntTwosComplementBytes(value: bigint): Uint8Array;
export declare function bigIntFromTwosComplementBytes(bytes: Uint8Array): bigint;
export declare function variableLengthQuantityBytes(value: bigint): Uint8Array;
export declare function variableLengthQuantityFromBytes(bytes: Uint8Array, maxBytes: number): [value: bigint, size: number];
