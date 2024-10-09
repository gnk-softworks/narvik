export declare function parseASN1NoLeftoverBytes(data: Uint8Array): ASN1Value;
export declare function parseASN1(data: Uint8Array): [result: ASN1Value, size: number];
export declare function encodeASN1(value: ASN1Encodable): Uint8Array;
export interface ASN1Encodable {
    class: ASN1Class;
    form: ASN1Form;
    tag: number;
    contents(): Uint8Array;
}
export declare class ASN1Value implements ASN1Encodable {
    class: ASN1Class;
    form: ASN1Form;
    tag: number;
    private _contents;
    constructor(asn1Class: ASN1Class, form: ASN1Form, tag: number, value: Uint8Array);
    universalType(): ASN1UniversalType;
    contents(): Uint8Array;
    boolean(): ASN1Boolean;
    integer(): ASN1Integer;
    bitString(): ASN1BitString;
    octetString(): ASN1OctetString;
    null(): ASN1Null;
    objectIdentifier(): ASN1ObjectIdentifier;
    real(): ASN1Real;
    enumerated(): ASN1Enumerated;
    utf8String(): ASN1UTF8String;
    sequence(): ASN1Sequence;
    set(): ASN1Set;
    numericString(): ASN1NumericString;
    printableString(): ASN1PrintableString;
    ia5String(): ASN1IA5String;
    utcTime(): ASN1UTCTime;
    generalizedTime(): ASN1GeneralizedTime;
}
export declare class ASN1Boolean implements ASN1Encodable {
    class: ASN1Class;
    form: ASN1Form;
    tag: 1;
    value: boolean;
    constructor(value: boolean);
    contents(): Uint8Array;
}
export declare class ASN1Integer implements ASN1Encodable {
    class: ASN1Class;
    form: ASN1Form;
    tag: 2;
    value: bigint;
    constructor(value: bigint);
    contents(): Uint8Array;
}
export declare class ASN1BitString implements ASN1Encodable {
    class: ASN1Class;
    form: ASN1Form;
    tag: 3;
    bytes: Uint8Array;
    length: number;
    constructor(bytes: Uint8Array, length: number);
    contents(): Uint8Array;
}
export declare class ASN1Enumerated implements ASN1Encodable {
    class: ASN1Class;
    form: ASN1Form;
    tag: 10;
    value: bigint;
    constructor(value: bigint);
    contents(): Uint8Array;
}
export declare class ASN1RealBinaryEncoding implements ASN1Encodable {
    class: ASN1Class;
    form: ASN1Form;
    tag: 9;
    mantissa: bigint;
    base: RealBinaryEncodingBase;
    exponent: bigint;
    constructor(mantissa: bigint, base: RealBinaryEncodingBase, exponent: bigint);
    contents(): Uint8Array;
}
export declare enum RealBinaryEncodingBase {
    Base2 = 0,
    Base8 = 1,
    Base16 = 2
}
export type ASN1Real = ASN1RealZero | ASN1SpecialReal | ASN1RealDecimalEncoding | ASN1RealBinaryEncoding;
export declare class ASN1RealDecimalEncoding implements ASN1Encodable {
    class: ASN1Class;
    form: ASN1Form;
    tag: 9;
    encodingFormat: RealDecimalEncodingFormat;
    value: Uint8Array;
    constructor(encodingFormat: RealDecimalEncodingFormat, value: Uint8Array);
    contents(): Uint8Array;
    decodeText(): string;
    decodeNumber(): number;
}
export declare enum RealDecimalEncodingFormat {
    ISO6093NR1 = 0,
    ISO6093NR2 = 1,
    ISO6093NR3 = 2
}
export declare class ASN1SpecialReal implements ASN1Encodable {
    class: ASN1Class;
    form: ASN1Form;
    tag: 9;
    value: SpecialReal;
    constructor(value: SpecialReal);
    contents(): Uint8Array;
}
export declare enum SpecialReal {
    PlusInfinity = 0,
    MinusInfinity = 1
}
export declare class ASN1RealZero implements ASN1Encodable {
    class: ASN1Class;
    form: ASN1Form;
    tag: 9;
    value: number;
    contents(): Uint8Array;
}
export declare class ASN1OctetString implements ASN1Encodable {
    class: ASN1Class;
    form: ASN1Form;
    tag: 4;
    value: Uint8Array;
    constructor(value: Uint8Array);
    contents(): Uint8Array;
}
export declare class ASN1Null implements ASN1Encodable {
    class: ASN1Class;
    form: ASN1Form;
    tag: 5;
    contents(): Uint8Array;
}
export declare class ASN1Sequence implements ASN1Encodable {
    class: ASN1Class;
    form: ASN1Form;
    tag: 16;
    elements: ASN1Value[];
    constructor(elements: ASN1Value[]);
    contents(): Uint8Array;
    isSequenceOfSingleType(asn1Class: ASN1Class, form: ASN1Form, tag: number): boolean;
    at(index: number): ASN1Value;
}
export declare class ASN1EncodableSequence implements ASN1Encodable {
    class: ASN1Class;
    form: ASN1Form;
    tag: 16;
    elements: ASN1Encodable[];
    constructor(elements: ASN1Encodable[]);
    contents(): Uint8Array;
}
export declare class ASN1Set implements ASN1Encodable {
    class: ASN1Class;
    form: ASN1Form;
    tag: 17;
    elements: ASN1Value[];
    constructor(elements: ASN1Value[]);
    contents(): Uint8Array;
    isSetOfSingleType(asn1Class: ASN1Class, form: ASN1Form, tag: number): boolean;
    at(index: number): ASN1Value;
}
export declare class ASN1EncodableSet implements ASN1Encodable {
    class: ASN1Class;
    form: ASN1Form;
    tag: 17;
    elements: ASN1Encodable[];
    constructor(elements: ASN1Encodable[]);
    contents(): Uint8Array;
}
export declare class ASN1ObjectIdentifier implements ASN1Encodable {
    class: ASN1Class;
    form: ASN1Form;
    tag: 6;
    encoded: Uint8Array;
    constructor(encoded: Uint8Array);
    contents(): Uint8Array;
    is(objectIdentifier: string): boolean;
}
export declare class ASN1NumericString implements ASN1Encodable {
    class: ASN1Class;
    form: ASN1Form;
    tag: 18;
    value: Uint8Array;
    constructor(value: Uint8Array);
    contents(): Uint8Array;
    decodeText(): string;
}
export declare class ASN1PrintableString implements ASN1Encodable {
    class: ASN1Class;
    form: ASN1Form;
    tag: 19;
    value: Uint8Array;
    constructor(value: Uint8Array);
    contents(): Uint8Array;
    decodeText(): string;
}
export declare class ASN1UTF8String implements ASN1Encodable {
    class: ASN1Class;
    form: ASN1Form;
    tag: 12;
    value: Uint8Array;
    constructor(value: Uint8Array);
    contents(): Uint8Array;
    decodeText(): string;
}
export declare class ASN1IA5String implements ASN1Encodable {
    class: ASN1Class;
    form: ASN1Form;
    tag: 22;
    value: Uint8Array;
    constructor(value: Uint8Array);
    contents(): Uint8Array;
    decodeText(): string;
}
export declare class ASN1GeneralizedTime implements ASN1Encodable {
    class: ASN1Class;
    form: ASN1Form;
    tag: 24;
    year: number;
    month: number;
    date: number;
    hours: number;
    minutes: number;
    seconds: number;
    milliseconds: number;
    constructor(year: number, month: number, date: number, hours: number, minutes: number, seconds: number, milliseconds: number);
    contents(): Uint8Array;
    toDate(): Date;
}
export declare class ASN1UTCTime implements ASN1Encodable {
    class: ASN1Class;
    form: ASN1Form;
    tag: 23;
    year: number;
    month: number;
    date: number;
    hours: number;
    minutes: number;
    seconds: number;
    constructor(year: number, month: number, date: number, hours: number, minutes: number, seconds: number);
    contents(): Uint8Array;
    toDate(century: number): Date;
}
export declare function encodeObjectIdentifier(oid: string): Uint8Array;
export declare enum ASN1UniversalType {
    Boolean = 0,
    Integer = 1,
    BitString = 2,
    OctetString = 3,
    Null = 4,
    ObjectIdentifier = 5,
    ObjectDescriptor = 6,
    External = 7,
    Real = 8,
    Enumerated = 9,
    EmbeddedPDV = 10,
    UTF8String = 11,
    RelativeObjectIdentifier = 12,
    Time = 13,
    Sequence = 14,
    Set = 15,
    NumericString = 16,
    PrintableString = 17,
    TeletexString = 18,
    VideotextString = 19,
    IA5String = 20,
    UTCTime = 21,
    GeneralizedTime = 22,
    GraphicString = 23,
    VisibleString = 24,
    GeneralString = 25,
    UniversalString = 26,
    CharacterString = 27,
    BMPString = 28
}
export declare enum ASN1Class {
    Universal = 0,
    Application = 1,
    ContextSpecific = 2,
    Private = 3
}
export declare enum ASN1Form {
    Primitive = 0,
    Constructed = 1
}
export declare const ASN1_UNIVERSAL_TAG: {
    readonly BOOLEAN: 1;
    readonly INTEGER: 2;
    readonly BIT_STRING: 3;
    readonly OCTET_STRING: 4;
    readonly NULL: 5;
    readonly OBJECT_IDENTIFIER: 6;
    readonly OBJECT_DESCRIPTOR: 7;
    readonly EXTERNAL: 8;
    readonly REAL: 9;
    readonly ENUMERATED: 10;
    readonly EMBEDDED_PDV: 11;
    readonly UTF8_STRING: 12;
    readonly RELATIVE_OBJECT_IDENTIFIER: 13;
    readonly TIME: 14;
    readonly SEQUENCE: 16;
    readonly SET: 17;
    readonly NUMERIC_STRING: 18;
    readonly PRINTABLE_STRING: 19;
    readonly TELETEX_STRING: 20;
    readonly VIDEOTEX_STRING: 21;
    readonly IA5_STRING: 22;
    readonly UTC_TIME: 23;
    readonly GENERALIZED_TIME: 24;
    readonly GRAPHIC_STRING: 25;
    readonly VISIBLE_STRING: 26;
    readonly GENERAL_STRING: 27;
    readonly UNIVERSAL_STRING: 28;
    readonly CHARACTER_STRING: 29;
    readonly BMP_STRING: 30;
};
export declare class ASN1ParseError extends Error {
    constructor();
}
export declare class ASN1DecodeError extends Error {
    constructor();
}
export declare class ASN1EncodeError extends Error {
    constructor();
}
export declare class ASN1LeftoverBytesError extends Error {
    constructor(count: number);
}
