import type { HashAlgorithm } from "../hash/index.js";
export declare function verifyRSASSAPKCS1v15Signature(publicKey: RSAPublicKey, hashObjectIdentifier: string, hashed: Uint8Array, signature: Uint8Array): boolean;
export declare function verifyRSASSAPSSSignature(publicKey: RSAPublicKey, MessageHashAlgorithm: HashAlgorithm, MGF1HashAlgorithm: HashAlgorithm, saltLength: number, hashed: Uint8Array, signature: Uint8Array): boolean;
export declare class RSAPublicKey {
    n: bigint;
    e: bigint;
    constructor(n: bigint, e: bigint);
    encodePKCS1(): Uint8Array;
    encodePKIX(): Uint8Array;
}
export declare function decodePKCS1RSAPublicKey(pkcs1: Uint8Array): RSAPublicKey;
export declare function decodePKIXRSAPublicKey(pkix: Uint8Array): RSAPublicKey;
export declare const sha1ObjectIdentifier = "1.3.14.3.2.26";
export declare const sha224ObjectIdentifier = "2.16.840.1.101.3.4.2.4";
export declare const sha256ObjectIdentifier = "2.16.840.1.101.3.4.2.1";
export declare const sha384ObjectIdentifier = "2.16.840.1.101.3.4.2.2";
export declare const sha512ObjectIdentifier = "2.16.840.1.101.3.4.2.3";
