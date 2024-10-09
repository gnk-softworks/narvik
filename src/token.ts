import {encodeBase32LowerCaseNoPadding} from "@oslojs/encoding";

export function generateRandomToken(): string {
    return encodeBase32LowerCaseNoPadding(generateRandomBytes(20));
}

function generateRandomBytes(length: number): Uint8Array {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return bytes;
}