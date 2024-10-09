export declare function generateRandomInteger(random: RandomReader, max: bigint): bigint;
export declare function generateRandomIntegerNumber(random: RandomReader, max: number): number;
export declare function generateRandomString(random: RandomReader, alphabet: string, length: number): string;
export interface RandomReader {
    read(bytes: Uint8Array): void;
}
