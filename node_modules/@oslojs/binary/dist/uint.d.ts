declare class BigEndian implements ByteOrder {
    uint8(data: Uint8Array, offset: number): number;
    uint16(data: Uint8Array, offset: number): number;
    uint32(data: Uint8Array, offset: number): number;
    uint64(data: Uint8Array, offset: number): bigint;
    putUint8(target: Uint8Array, value: number, offset: number): void;
    putUint16(target: Uint8Array, value: number, offset: number): void;
    putUint32(target: Uint8Array, value: number, offset: number): void;
    putUint64(target: Uint8Array, value: bigint, offset: number): void;
}
declare class LittleEndian implements ByteOrder {
    uint8(data: Uint8Array, offset: number): number;
    uint16(data: Uint8Array, offset: number): number;
    uint32(data: Uint8Array, offset: number): number;
    uint64(data: Uint8Array, offset: number): bigint;
    putUint8(target: Uint8Array, value: number, offset: number): void;
    putUint16(target: Uint8Array, value: number, offset: number): void;
    putUint32(target: Uint8Array, value: number, offset: number): void;
    putUint64(target: Uint8Array, value: bigint, offset: number): void;
}
export declare const bigEndian: BigEndian;
export declare const littleEndian: LittleEndian;
export interface ByteOrder {
    uint8(data: Uint8Array, offset: number): number;
    uint16(data: Uint8Array, offset: number): number;
    uint32(data: Uint8Array, offset: number): number;
    uint64(data: Uint8Array, offset: number): bigint;
    putUint8(target: Uint8Array, value: number, offset: number): void;
    putUint16(target: Uint8Array, value: number, offset: number): void;
    putUint32(target: Uint8Array, value: number, offset: number): void;
    putUint64(target: Uint8Array, value: bigint, offset: number): void;
}
export {};
