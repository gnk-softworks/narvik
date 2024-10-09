import type { ECDSANamedCurve } from "./curve.js";
export declare function verifyECDSASignature(publicKey: ECDSAPublicKey, hash: Uint8Array, signature: ECDSASignature): boolean;
export declare class ECDSAPublicKey {
    curve: ECDSANamedCurve;
    x: bigint;
    y: bigint;
    constructor(curve: ECDSANamedCurve, x: bigint, y: bigint);
    isCurve(curve: ECDSANamedCurve): boolean;
    encodeSEC1Uncompressed(): Uint8Array;
    encodeSEC1Compressed(): Uint8Array;
    encodePKIXUncompressed(): Uint8Array;
    encodePKIXCompressed(): Uint8Array;
}
export declare function decodeSEC1PublicKey(curve: ECDSANamedCurve, bytes: Uint8Array): ECDSAPublicKey;
export declare class ECDSASignature {
    r: bigint;
    s: bigint;
    constructor(r: bigint, s: bigint);
    encodeIEEEP1363(curve: ECDSANamedCurve): Uint8Array;
    encodePKIX(): Uint8Array;
}
export declare function decodeIEEEP1363ECDSASignature(curve: ECDSANamedCurve, bytes: Uint8Array): ECDSASignature;
export declare function decodePKIXECDSASignature(der: Uint8Array): ECDSASignature;
export declare function decodePKIXECDSAPublicKey(bytes: Uint8Array, curves: ECDSANamedCurve[]): ECDSAPublicKey;
