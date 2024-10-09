import { bigIntFromTwosComplementBytes, bigIntTwosComplementBytes, variableLengthQuantityBytes, variableLengthQuantityFromBytes } from "./integer.js";
import { decodeASCII } from "./string.js";
import { bigIntBytes, bigIntFromBytes, compareBytes, DynamicBuffer } from "@oslojs/binary";
export function parseASN1NoLeftoverBytes(data) {
    const [decoded, size] = parseASN1(data);
    if (data.byteLength !== size) {
        throw new ASN1LeftoverBytesError(data.byteLength - size);
    }
    return decoded;
}
export function parseASN1(data) {
    if (data.byteLength < 2) {
        throw new ASN1ParseError();
    }
    let asn1Class;
    if (data[0] >> 6 === 0b00) {
        asn1Class = ASN1Class.Universal;
    }
    else if (data[0] >> 6 === 0b01) {
        asn1Class = ASN1Class.Application;
    }
    else if (data[0] >> 6 === 0b10) {
        asn1Class = ASN1Class.ContextSpecific;
    }
    else if (data[0] >> 6 === 0b11) {
        asn1Class = ASN1Class.Private;
    }
    else {
        // unreachable
        throw new ASN1ParseError();
    }
    let encodingForm;
    if (((data[0] >> 5) & 0x01) === 0) {
        encodingForm = ASN1Form.Primitive;
    }
    else if (((data[0] >> 5) & 0x01) === 1) {
        encodingForm = ASN1Form.Constructed;
    }
    else {
        // unreachable
        throw new ASN1ParseError();
    }
    let offset = 0;
    let tag;
    if ((data[0] & 0x1f) < 31) {
        tag = data[0] & 0x1f;
        offset++;
    }
    else {
        offset++;
        let decodedTag;
        let tagSize;
        try {
            [decodedTag, tagSize] = variableLengthQuantityFromBytes(data.slice(offset), 2);
        }
        catch {
            throw new ASN1ParseError();
        }
        if (decodedTag > 16384n) {
            throw new ASN1ParseError();
        }
        tag = Number(decodedTag);
        offset += tagSize;
    }
    if (data.byteLength < offset) {
        throw new ASN1ParseError();
    }
    if (data[offset] === 0x80) {
        // indefinite form
        throw new ASN1ParseError();
    }
    let contentLength = 0;
    if (data[offset] >> 7 === 0) {
        contentLength = data[offset] & 0x7f;
        offset++;
    }
    else {
        const contentLengthSize = data[offset] & 0x7f;
        offset++;
        if (contentLengthSize < 1 || data.byteLength < offset + contentLengthSize) {
            throw new ASN1ParseError();
        }
        const decodedContentLength = bigIntFromBytes(data.slice(offset, offset + contentLengthSize));
        offset += contentLengthSize;
        contentLength = Number(decodedContentLength);
    }
    if (data.length < offset + contentLength) {
        throw new ASN1ParseError();
    }
    const value = data.slice(offset, offset + contentLength);
    const result = new ASN1Value(asn1Class, encodingForm, tag, value);
    return [result, offset + contentLength];
}
export function encodeASN1(value) {
    const encodedContents = value.contents();
    let firstByte = 0x00;
    if (value.class === ASN1Class.Universal) {
        firstByte |= 0x00;
    }
    else if (value.class === ASN1Class.Application) {
        firstByte |= 0x40;
    }
    else if (value.class === ASN1Class.ContextSpecific) {
        firstByte |= 0x80;
    }
    else if (value.class === ASN1Class.Private) {
        firstByte |= 0xc0;
    }
    if (value.form === ASN1Form.Primitive) {
        firstByte |= 0x00;
    }
    else if (value.form === ASN1Form.Constructed) {
        firstByte |= 0x20;
    }
    const buffer = new DynamicBuffer(1);
    if (value.tag < 0x1f) {
        firstByte |= value.tag;
        buffer.writeByte(firstByte);
    }
    else {
        firstByte |= 0x1f;
        buffer.writeByte(firstByte);
        const encodedTagNumber = variableLengthQuantityBytes(BigInt(value.tag));
        buffer.write(encodedTagNumber);
    }
    if (encodedContents.byteLength < 128) {
        buffer.writeByte(encodedContents.byteLength);
    }
    else {
        const encodedContentsLength = bigIntBytes(BigInt(encodedContents.byteLength));
        if (encodedContentsLength.byteLength > 126) {
            throw new ASN1EncodeError();
        }
        buffer.writeByte(encodedContentsLength.byteLength | 0x80);
        buffer.write(encodedContentsLength);
    }
    buffer.write(encodedContents);
    return buffer.bytes();
}
export class ASN1Value {
    class;
    form;
    tag;
    _contents;
    constructor(asn1Class, form, tag, value) {
        this.class = asn1Class;
        this.form = form;
        this.tag = tag;
        this._contents = value;
    }
    universalType() {
        if (this.class === ASN1Class.Universal && this.tag in ASN1_UNIVERSAL_TAG_MAP) {
            return ASN1_UNIVERSAL_TAG_MAP[this.tag];
        }
        throw new ASN1DecodeError();
    }
    contents() {
        return this._contents;
    }
    boolean() {
        if (this.universalType() !== ASN1UniversalType.Boolean) {
            throw new ASN1DecodeError();
        }
        if (this.form !== ASN1Form.Primitive) {
            throw new ASN1DecodeError();
        }
        if (this._contents.byteLength !== 1) {
            throw new ASN1DecodeError();
        }
        if (this._contents[0] === 0x00) {
            return new ASN1Boolean(false);
        }
        if (this._contents[0] === 0xff) {
            return new ASN1Boolean(true);
        }
        throw new ASN1DecodeError();
    }
    integer() {
        if (this.universalType() !== ASN1UniversalType.Integer) {
            throw new ASN1DecodeError();
        }
        if (this.form !== ASN1Form.Primitive) {
            throw new ASN1DecodeError();
        }
        if (this._contents.byteLength < 1) {
            throw new ASN1DecodeError();
        }
        return new ASN1Integer(bigIntFromTwosComplementBytes(this._contents));
    }
    bitString() {
        if (this.universalType() !== ASN1UniversalType.BitString) {
            throw new ASN1DecodeError();
        }
        if (this.form !== ASN1Form.Primitive) {
            throw new ASN1DecodeError();
        }
        if (this._contents.byteLength < 1) {
            throw new ASN1DecodeError();
        }
        const unusedBits = this._contents[0];
        if (unusedBits > 7) {
            throw new ASN1DecodeError();
        }
        const value = this._contents.slice(1);
        if (unusedBits > 0 && value.byteLength === 0) {
            throw new ASN1DecodeError();
        }
        return new ASN1BitString(value, value.byteLength * 8 - unusedBits);
    }
    octetString() {
        if (this.universalType() !== ASN1UniversalType.OctetString) {
            throw new ASN1DecodeError();
        }
        if (this.form !== ASN1Form.Primitive) {
            throw new ASN1DecodeError();
        }
        return new ASN1OctetString(this._contents);
    }
    null() {
        if (this.universalType() !== ASN1UniversalType.Null) {
            throw new ASN1DecodeError();
        }
        if (this.form !== ASN1Form.Primitive) {
            throw new ASN1DecodeError();
        }
        if (this._contents.byteLength > 0) {
            throw new ASN1DecodeError();
        }
        return new ASN1Null();
    }
    objectIdentifier() {
        if (this.universalType() !== ASN1UniversalType.ObjectIdentifier) {
            throw new ASN1DecodeError();
        }
        if (this.form !== ASN1Form.Primitive) {
            throw new ASN1DecodeError();
        }
        if (this._contents.byteLength < 1) {
            throw new ASN1DecodeError();
        }
        return new ASN1ObjectIdentifier(this._contents);
    }
    real() {
        if (this.universalType() !== ASN1UniversalType.Real) {
            throw new ASN1DecodeError();
        }
        if (this.form !== ASN1Form.Primitive) {
            throw new ASN1DecodeError();
        }
        if (this._contents.length === 0) {
            return new ASN1RealZero();
        }
        if (this._contents[0] >> 7 === 1) {
            // Binary
            let base;
            if (((this._contents[0] >> 4) & 0x03) === 0x00) {
                base = RealBinaryEncodingBase.Base2;
            }
            else if (((this._contents[0] >> 4) & 0x03) === 0x01) {
                base = RealBinaryEncodingBase.Base8;
            }
            else if (((this._contents[0] >> 4) & 0x03) === 0x02) {
                base = RealBinaryEncodingBase.Base16;
            }
            else {
                throw new ASN1DecodeError();
            }
            const scalingFactor = (this._contents[0] >> 2) & 0x03;
            let exponent;
            let encodedExponentSize;
            if ((this._contents[0] & 0x03) === 0x00) {
                if (this._contents.byteLength < 2) {
                    throw new ASN1DecodeError();
                }
                exponent = bigIntFromTwosComplementBytes(this._contents.slice(1, 2));
                encodedExponentSize = 1;
            }
            else if ((this._contents[0] & 0x03) === 0x01) {
                if (this._contents.byteLength < 3) {
                    throw new ASN1DecodeError();
                }
                exponent = bigIntFromTwosComplementBytes(this._contents.slice(1, 3));
                encodedExponentSize = 2;
            }
            else if ((this._contents[0] & 0x03) === 0x02) {
                if (this._contents.byteLength < 4) {
                    throw new ASN1DecodeError();
                }
                exponent = bigIntFromTwosComplementBytes(this._contents.slice(1, 4));
                encodedExponentSize = 3;
            }
            else if ((this._contents[0] & 0x03) === 0x03) {
                if (this._contents.byteLength < 2) {
                    throw new ASN1DecodeError();
                }
                const exponentSize = this._contents[1];
                // in DER, it should really be at least 4
                if (exponentSize < 1) {
                    throw new ASN1DecodeError();
                }
                if (this._contents.byteLength < 2 + exponentSize) {
                    throw new ASN1DecodeError();
                }
                exponent = bigIntFromTwosComplementBytes(this._contents.slice(2, 2 + exponentSize));
                encodedExponentSize = 1 + exponentSize;
            }
            else {
                // unreachable
                throw new ASN1DecodeError();
            }
            if (this._contents.byteLength === 1 + encodedExponentSize) {
                throw new ASN1DecodeError();
            }
            const N = bigIntFromBytes(this._contents.slice(1 + encodedExponentSize));
            let mantissa = N * BigInt(2 ** scalingFactor);
            if (((this._contents[0] >> 6) & 0x01) === 0x01) {
                mantissa = mantissa * -1n;
            }
            return new ASN1RealBinaryEncoding(mantissa, base, exponent);
        }
        if (this._contents[0] == 0x01) {
            return new ASN1RealDecimalEncoding(RealDecimalEncodingFormat.ISO6093NR1, this._contents.slice(1));
        }
        if (this._contents[0] == 0x02) {
            return new ASN1RealDecimalEncoding(RealDecimalEncodingFormat.ISO6093NR2, this._contents.slice(1));
        }
        if (this._contents[0] == 0x03) {
            return new ASN1RealDecimalEncoding(RealDecimalEncodingFormat.ISO6093NR3, this._contents.slice(1));
        }
        if (this._contents[0] === 0x40) {
            return new ASN1SpecialReal(SpecialReal.PlusInfinity);
        }
        if (this._contents[0] === 0x41) {
            return new ASN1SpecialReal(SpecialReal.MinusInfinity);
        }
        // unreachable
        throw new ASN1DecodeError();
    }
    enumerated() {
        if (this.universalType() !== ASN1UniversalType.Enumerated) {
            throw new ASN1DecodeError();
        }
        if (this.form !== ASN1Form.Primitive) {
            throw new ASN1DecodeError();
        }
        if (this._contents.byteLength < 1) {
            throw new ASN1DecodeError();
        }
        return new ASN1Enumerated(bigIntFromTwosComplementBytes(this._contents));
    }
    utf8String() {
        if (this.universalType() !== ASN1UniversalType.UTF8String) {
            throw new ASN1DecodeError();
        }
        if (this.form !== ASN1Form.Primitive) {
            throw new ASN1DecodeError();
        }
        return new ASN1UTF8String(this._contents);
    }
    sequence() {
        if (this.universalType() !== ASN1UniversalType.Sequence) {
            throw new ASN1DecodeError();
        }
        if (this.form !== ASN1Form.Constructed) {
            throw new ASN1DecodeError();
        }
        const elements = [];
        let readBytes = 0;
        while (readBytes !== this._contents.byteLength) {
            const [parsedElement, parsedElementSize] = parseASN1(this._contents.slice(readBytes));
            elements.push(parsedElement);
            readBytes += parsedElementSize;
        }
        return new ASN1Sequence(elements);
    }
    set() {
        if (this.universalType() !== ASN1UniversalType.Set) {
            throw new ASN1DecodeError();
        }
        if (this.form !== ASN1Form.Constructed) {
            throw new ASN1DecodeError();
        }
        const elements = [];
        let readBytes = 0;
        while (readBytes !== this._contents.byteLength) {
            const [parsedElement, parsedElementSize] = parseASN1(this._contents.slice(readBytes));
            elements.push(parsedElement);
            readBytes += parsedElementSize;
        }
        return new ASN1Set(elements);
    }
    numericString() {
        if (this.universalType() !== ASN1UniversalType.NumericString) {
            throw new ASN1DecodeError();
        }
        if (this.form !== ASN1Form.Primitive) {
            throw new ASN1DecodeError();
        }
        return new ASN1NumericString(this._contents);
    }
    printableString() {
        if (this.universalType() !== ASN1UniversalType.PrintableString) {
            throw new ASN1DecodeError();
        }
        if (this.form !== ASN1Form.Primitive) {
            throw new ASN1DecodeError();
        }
        return new ASN1PrintableString(this._contents);
    }
    ia5String() {
        if (this.universalType() !== ASN1UniversalType.IA5String) {
            throw new ASN1DecodeError();
        }
        if (this.form !== ASN1Form.Primitive) {
            throw new ASN1DecodeError();
        }
        return new ASN1IA5String(this._contents);
    }
    utcTime() {
        if (this.universalType() !== ASN1UniversalType.UTCTime) {
            throw new ASN1DecodeError();
        }
        if (this.form !== ASN1Form.Primitive) {
            throw new ASN1DecodeError();
        }
        let decodedString = decodeASCII(this._contents);
        if (decodedString.length !== 13 || !decodedString.endsWith("Z")) {
            throw new ASN1DecodeError();
        }
        decodedString = decodedString.replace("Z", "");
        return new ASN1UTCTime(Number(decodedString.slice(0, 2)), Number(decodedString.slice(2, 4)), Number(decodedString.slice(4, 6)), Number(decodedString.slice(6, 8)), Number(decodedString.slice(8, 10)), Number(decodedString.slice(10, 12)));
    }
    generalizedTime() {
        if (this.universalType() !== ASN1UniversalType.GeneralizedTime) {
            throw new ASN1DecodeError();
        }
        if (this.form !== ASN1Form.Primitive) {
            throw new ASN1DecodeError();
        }
        let decodedString = decodeASCII(this._contents);
        if (!decodedString.endsWith("Z")) {
            throw new ASN1DecodeError();
        }
        decodedString = decodedString.replace("Z", "");
        let wholePart;
        let decimalPart = null;
        if (decodedString.includes(".")) {
            [wholePart, decimalPart] = decodedString.split(".");
        }
        else {
            wholePart = decodedString;
        }
        if (wholePart.length !== 14) {
            throw new ASN1DecodeError();
        }
        let milliseconds = 0;
        if (decimalPart !== null) {
            if (decimalPart.length > 3) {
                throw new ASN1DecodeError();
            }
            milliseconds = Number(decimalPart.padEnd(3, "0"));
        }
        return new ASN1GeneralizedTime(Number(wholePart.slice(0, 4)), Number(wholePart.slice(4, 6)), Number(wholePart.slice(6, 8)), Number(wholePart.slice(8, 10)), Number(wholePart.slice(10, 12)), Number(wholePart.slice(12, 14)), milliseconds);
    }
}
export class ASN1Boolean {
    class = ASN1Class.Universal;
    form = ASN1Form.Primitive;
    tag = ASN1_UNIVERSAL_TAG.BOOLEAN;
    value;
    constructor(value) {
        this.value = value;
    }
    contents() {
        if (this.value) {
            return new Uint8Array([0xff]);
        }
        return new Uint8Array([0x00]);
    }
}
export class ASN1Integer {
    class = ASN1Class.Universal;
    form = ASN1Form.Primitive;
    tag = ASN1_UNIVERSAL_TAG.INTEGER;
    value;
    constructor(value) {
        this.value = value;
    }
    contents() {
        return bigIntTwosComplementBytes(this.value);
    }
}
export class ASN1BitString {
    class = ASN1Class.Universal;
    form = ASN1Form.Primitive;
    tag = ASN1_UNIVERSAL_TAG.BIT_STRING;
    bytes;
    length;
    constructor(bytes, length) {
        if (length > bytes.byteLength * 8) {
            throw new TypeError("Data too small");
        }
        if (length <= (bytes.byteLength - 1) * 8) {
            throw new TypeError("Data too large");
        }
        this.bytes = bytes;
        this.length = length;
    }
    contents() {
        let remainingBitsInLastByte = 8 - (this.length % 8);
        if (remainingBitsInLastByte === 8) {
            remainingBitsInLastByte = 0;
        }
        const encoded = new Uint8Array(this.bytes.byteLength + 1);
        encoded[0] = remainingBitsInLastByte;
        encoded.set(this.bytes, 1);
        return encoded;
    }
}
export class ASN1Enumerated {
    class = ASN1Class.Universal;
    form = ASN1Form.Primitive;
    tag = ASN1_UNIVERSAL_TAG.ENUMERATED;
    value;
    constructor(value) {
        this.value = value;
    }
    contents() {
        return bigIntTwosComplementBytes(this.value);
    }
}
export class ASN1RealBinaryEncoding {
    class = ASN1Class.Universal;
    form = ASN1Form.Primitive;
    tag = ASN1_UNIVERSAL_TAG.REAL;
    mantissa;
    base;
    exponent;
    constructor(mantissa, base, exponent) {
        if (mantissa === 0n) {
            throw new TypeError("The mantissa cannot be zero");
        }
        this.mantissa = mantissa;
        this.base = base;
        this.exponent = exponent;
    }
    contents() {
        let N, scalingFactor;
        if (this.mantissa % 8n === 0n) {
            N = absBigInt(this.mantissa) / 8n;
            scalingFactor = 3;
        }
        else if (this.mantissa % 4n === 0n) {
            N = absBigInt(this.mantissa) / 4n;
            scalingFactor = 2;
        }
        else if (this.mantissa % 2n === 0n) {
            N = absBigInt(this.mantissa) / 2n;
            scalingFactor = 1;
        }
        else {
            N = absBigInt(this.mantissa);
            scalingFactor = 0;
        }
        let firstByte = 0x80;
        if (this.mantissa < 0) {
            firstByte |= 0x40;
        }
        if (this.base === RealBinaryEncodingBase.Base8) {
            firstByte |= 0x10;
        }
        else if (this.base === RealBinaryEncodingBase.Base16) {
            firstByte |= 0x20;
        }
        firstByte |= scalingFactor << 2;
        let encodedExponent;
        const exponentBytes = bigIntTwosComplementBytes(this.exponent);
        if (exponentBytes.byteLength === 1) {
            encodedExponent = new Uint8Array(1);
            encodedExponent.set(exponentBytes);
        }
        else if (exponentBytes.byteLength === 2) {
            firstByte |= 0x01;
            encodedExponent = new Uint8Array(2);
            encodedExponent.set(exponentBytes);
        }
        else if (exponentBytes.byteLength === 3) {
            firstByte |= 0x02;
            encodedExponent = new Uint8Array(3);
            encodedExponent.set(exponentBytes);
        }
        else {
            if (exponentBytes.byteLength > 255) {
                throw new ASN1DecodeError();
            }
            firstByte |= 0x03;
            encodedExponent = new Uint8Array(exponentBytes.byteLength + 1);
            encodedExponent[0] = exponentBytes.byteLength;
            encodedExponent.set(exponentBytes, 1);
        }
        const nBytes = bigIntBytes(N);
        const encoded = new Uint8Array(1 + encodedExponent.byteLength + nBytes.byteLength);
        encoded[0] = firstByte;
        encoded.set(encodedExponent, 1);
        encoded.set(nBytes, 1 + encodedExponent.byteLength);
        return encoded;
    }
}
function absBigInt(value) {
    if (value < 0) {
        return value * -1n;
    }
    return value;
}
export var RealBinaryEncodingBase;
(function (RealBinaryEncodingBase) {
    RealBinaryEncodingBase[RealBinaryEncodingBase["Base2"] = 0] = "Base2";
    RealBinaryEncodingBase[RealBinaryEncodingBase["Base8"] = 1] = "Base8";
    RealBinaryEncodingBase[RealBinaryEncodingBase["Base16"] = 2] = "Base16";
})(RealBinaryEncodingBase || (RealBinaryEncodingBase = {}));
export class ASN1RealDecimalEncoding {
    class = ASN1Class.Universal;
    form = ASN1Form.Primitive;
    tag = ASN1_UNIVERSAL_TAG.REAL;
    encodingFormat;
    value;
    constructor(encodingFormat, value) {
        this.encodingFormat = encodingFormat;
        this.value = value;
    }
    contents() {
        const encoded = new Uint8Array(1 + this.value.byteLength);
        if (this.encodingFormat === RealDecimalEncodingFormat.ISO6093NR1) {
            encoded[0] = 0x01;
        }
        else if (this.encodingFormat === RealDecimalEncodingFormat.ISO6093NR2) {
            encoded[0] = 0x02;
        }
        else if (this.encodingFormat === RealDecimalEncodingFormat.ISO6093NR3) {
            encoded[0] = 0x03;
        }
        encoded.set(this.value, 1);
        return encoded;
    }
    decodeText() {
        return new TextDecoder().decode(this.value);
    }
    decodeNumber() {
        return Number(this.decodeText());
    }
}
export var RealDecimalEncodingFormat;
(function (RealDecimalEncodingFormat) {
    RealDecimalEncodingFormat[RealDecimalEncodingFormat["ISO6093NR1"] = 0] = "ISO6093NR1";
    RealDecimalEncodingFormat[RealDecimalEncodingFormat["ISO6093NR2"] = 1] = "ISO6093NR2";
    RealDecimalEncodingFormat[RealDecimalEncodingFormat["ISO6093NR3"] = 2] = "ISO6093NR3";
})(RealDecimalEncodingFormat || (RealDecimalEncodingFormat = {}));
export class ASN1SpecialReal {
    class = ASN1Class.Universal;
    form = ASN1Form.Primitive;
    tag = ASN1_UNIVERSAL_TAG.REAL;
    value;
    constructor(value) {
        this.value = value;
    }
    contents() {
        switch (this.value) {
            case SpecialReal.PlusInfinity:
                return new Uint8Array([0x40]);
            case SpecialReal.MinusInfinity:
                return new Uint8Array([0x41]);
        }
    }
}
export var SpecialReal;
(function (SpecialReal) {
    SpecialReal[SpecialReal["PlusInfinity"] = 0] = "PlusInfinity";
    SpecialReal[SpecialReal["MinusInfinity"] = 1] = "MinusInfinity";
})(SpecialReal || (SpecialReal = {}));
export class ASN1RealZero {
    class = ASN1Class.Universal;
    form = ASN1Form.Primitive;
    tag = ASN1_UNIVERSAL_TAG.REAL;
    value = 0;
    contents() {
        return new Uint8Array(0);
    }
}
export class ASN1OctetString {
    class = ASN1Class.Universal;
    form = ASN1Form.Primitive;
    tag = ASN1_UNIVERSAL_TAG.OCTET_STRING;
    value;
    constructor(value) {
        this.value = value;
    }
    contents() {
        return this.value;
    }
}
export class ASN1Null {
    class = ASN1Class.Universal;
    form = ASN1Form.Primitive;
    tag = ASN1_UNIVERSAL_TAG.NULL;
    contents() {
        return new Uint8Array(0);
    }
}
export class ASN1Sequence {
    class = ASN1Class.Universal;
    form = ASN1Form.Constructed;
    tag = ASN1_UNIVERSAL_TAG.SEQUENCE;
    elements;
    constructor(elements) {
        this.elements = elements;
    }
    contents() {
        const buffer = new DynamicBuffer(0);
        for (const element of this.elements) {
            buffer.write(encodeASN1(element));
        }
        return buffer.bytes();
    }
    isSequenceOfSingleType(asn1Class, form, tag) {
        for (const element of this.elements) {
            if (element.class !== asn1Class || element.form !== form || element.tag !== tag) {
                return false;
            }
        }
        return true;
    }
    at(index) {
        if (index < this.elements.length) {
            return this.elements[index];
        }
        throw new Error("Invalid index");
    }
}
export class ASN1EncodableSequence {
    class = ASN1Class.Universal;
    form = ASN1Form.Constructed;
    tag = ASN1_UNIVERSAL_TAG.SEQUENCE;
    elements;
    constructor(elements) {
        this.elements = elements;
    }
    contents() {
        const buffer = new DynamicBuffer(0);
        for (const element of this.elements) {
            buffer.write(encodeASN1(element));
        }
        return buffer.bytes();
    }
}
export class ASN1Set {
    class = ASN1Class.Universal;
    form = ASN1Form.Constructed;
    tag = ASN1_UNIVERSAL_TAG.SET;
    elements;
    constructor(elements) {
        this.elements = elements;
    }
    contents() {
        const buffer = new DynamicBuffer(0);
        for (const element of this.elements) {
            buffer.write(encodeASN1(element));
        }
        return buffer.bytes();
    }
    isSetOfSingleType(asn1Class, form, tag) {
        for (const element of this.elements) {
            if (element.class !== asn1Class || element.form !== form || element.tag !== tag) {
                return false;
            }
        }
        return true;
    }
    at(index) {
        if (index < this.elements.length) {
            return this.elements[index];
        }
        throw new Error("Invalid index");
    }
}
export class ASN1EncodableSet {
    class = ASN1Class.Universal;
    form = ASN1Form.Constructed;
    tag = ASN1_UNIVERSAL_TAG.SET;
    elements;
    constructor(elements) {
        this.elements = elements;
    }
    contents() {
        const buffer = new DynamicBuffer(0);
        for (const element of this.elements) {
            buffer.write(encodeASN1(element));
        }
        return buffer.bytes();
    }
}
export class ASN1ObjectIdentifier {
    class = ASN1Class.Universal;
    form = ASN1Form.Primitive;
    tag = ASN1_UNIVERSAL_TAG.OBJECT_IDENTIFIER;
    encoded;
    constructor(encoded) {
        this.encoded = encoded;
    }
    contents() {
        return this.encoded;
    }
    is(objectIdentifier) {
        return compareBytes(encodeObjectIdentifier(objectIdentifier), this.encoded);
    }
}
// TODO?: relative object identifier
export class ASN1NumericString {
    class = ASN1Class.Universal;
    form = ASN1Form.Primitive;
    tag = ASN1_UNIVERSAL_TAG.NUMERIC_STRING;
    value;
    constructor(value) {
        this.value = value;
    }
    contents() {
        return this.value;
    }
    decodeText() {
        for (let i = 0; i < this.value.byteLength; i++) {
            if (this.value[i] === 0x20) {
                continue;
            }
            if (this.value[i] >= 0x30 && this.value[i] <= 0x39) {
                continue;
            }
            throw new TypeError("Invalid numeric string");
        }
        return new TextDecoder().decode(this.value);
    }
}
export class ASN1PrintableString {
    class = ASN1Class.Universal;
    form = ASN1Form.Primitive;
    tag = ASN1_UNIVERSAL_TAG.PRINTABLE_STRING;
    value;
    constructor(value) {
        this.value = value;
    }
    contents() {
        return this.value;
    }
    decodeText() {
        for (let i = 0; i < this.value.byteLength; i++) {
            if (this.value[i] === 0x20) {
                continue;
            }
            if (this.value[i] >= 0x27 && this.value[i] >= 0x29) {
                continue;
            }
            if (this.value[i] >= 0x2b && this.value[i] >= 0x2f) {
                continue;
            }
            if (this.value[i] >= 0x30 && this.value[i] <= 0x39) {
                continue;
            }
            if (this.value[i] === 0x3d) {
                continue;
            }
            if (this.value[i] === 0x3f) {
                continue;
            }
            if (this.value[i] >= 0x41 && this.value[i] <= 0x5a) {
                continue;
            }
            if (this.value[i] >= 0x61 && this.value[i] <= 0x7a) {
                continue;
            }
            throw new TypeError("Invalid printable string");
        }
        return new TextDecoder().decode(this.value);
    }
}
export class ASN1UTF8String {
    class = ASN1Class.Universal;
    form = ASN1Form.Primitive;
    tag = ASN1_UNIVERSAL_TAG.UTF8_STRING;
    value;
    constructor(value) {
        this.value = value;
    }
    contents() {
        return this.value;
    }
    decodeText() {
        return new TextDecoder().decode(this.value);
    }
}
export class ASN1IA5String {
    class = ASN1Class.Universal;
    form = ASN1Form.Primitive;
    tag = ASN1_UNIVERSAL_TAG.IA5_STRING;
    value;
    constructor(value) {
        this.value = value;
    }
    contents() {
        return this.value;
    }
    decodeText() {
        return decodeASCII(this.value);
    }
}
export class ASN1GeneralizedTime {
    class = ASN1Class.Universal;
    form = ASN1Form.Primitive;
    tag = ASN1_UNIVERSAL_TAG.GENERALIZED_TIME;
    year;
    month;
    date;
    hours;
    minutes;
    seconds;
    milliseconds;
    constructor(year, month, date, hours, minutes, seconds, milliseconds) {
        if (!Number.isInteger(year) || year < 0 || year > 9999) {
            throw new TypeError("Invalid year");
        }
        if (!Number.isInteger(month) || month < 1 || month > 12) {
            throw new TypeError("Invalid month");
        }
        if (!Number.isInteger(date) || date < 1 || date > 99) {
            throw new TypeError("Invalid date");
        }
        if (!Number.isInteger(hours) || hours < 0 || hours > 23) {
            throw new TypeError("Invalid hours");
        }
        if (!Number.isInteger(minutes) || minutes < 0 || minutes > 59) {
            throw new TypeError("Invalid minutes");
        }
        if (!Number.isInteger(seconds) || seconds < 0 || seconds > 59) {
            throw new TypeError("Invalid seconds");
        }
        if (!Number.isInteger(milliseconds) || milliseconds < 0 || milliseconds > 999) {
            throw new TypeError("Invalid milliseconds");
        }
        this.year = year;
        this.month = month;
        this.date = date;
        this.hours = hours;
        this.minutes = minutes;
        this.seconds = seconds;
        this.milliseconds = milliseconds;
    }
    contents() {
        let text = this.year.toString().padStart(4, "0");
        text += this.month.toString().padStart(2, "0");
        text += this.date.toString().padStart(2, "0");
        text += this.hours.toString().padStart(2, "0");
        text += this.minutes.toString().padStart(2, "0");
        text += this.seconds.toString().padStart(2, "0");
        if (this.milliseconds > 0) {
            text += (this.milliseconds / 1000).toString().replace("0", "");
        }
        text += "Z";
        return new TextEncoder().encode(text);
    }
    toDate() {
        const date = new Date();
        date.setUTCFullYear(this.year);
        date.setUTCMonth(this.month - 1);
        date.setUTCDate(this.date);
        date.setUTCHours(this.hours);
        date.setUTCMinutes(this.minutes);
        date.setUTCSeconds(this.seconds);
        date.setUTCMilliseconds(this.milliseconds);
        return date;
    }
}
export class ASN1UTCTime {
    class = ASN1Class.Universal;
    form = ASN1Form.Primitive;
    tag = ASN1_UNIVERSAL_TAG.UTC_TIME;
    year;
    month;
    date;
    hours;
    minutes;
    seconds;
    constructor(year, month, date, hours, minutes, seconds) {
        if (!Number.isInteger(year) || year < 0 || year > 99) {
            throw new TypeError("Invalid year");
        }
        if (!Number.isInteger(month) || month < 1 || month > 12) {
            throw new TypeError("Invalid month");
        }
        if (!Number.isInteger(date) || date < 1 || date > 99) {
            throw new TypeError("Invalid date");
        }
        if (!Number.isInteger(hours) || hours < 0 || hours > 23) {
            throw new TypeError("Invalid hours");
        }
        if (!Number.isInteger(minutes) || minutes < 0 || minutes > 59) {
            throw new TypeError("Invalid minutes");
        }
        if (!Number.isInteger(seconds) || seconds < 0 || seconds > 59) {
            throw new TypeError("Invalid seconds");
        }
        this.year = year;
        this.month = month;
        this.date = date;
        this.hours = hours;
        this.minutes = minutes;
        this.seconds = seconds;
    }
    contents() {
        let text = this.year.toString().padStart(2, "0");
        text += this.month.toString().padStart(2, "0");
        text += this.date.toString().padStart(2, "0");
        text += this.hours.toString().padStart(2, "0");
        text += this.minutes.toString().padStart(2, "0");
        text += this.seconds.toString().padStart(2, "0");
        text += "Z";
        return new TextEncoder().encode(text);
    }
    toDate(century) {
        if (century < 0 || century > 99) {
            throw new TypeError("Invalid century");
        }
        const date = new Date();
        date.setUTCFullYear(century * 100 + this.year);
        date.setUTCMonth(this.month - 1);
        date.setUTCDate(this.date);
        date.setUTCHours(this.hours);
        date.setUTCMinutes(this.minutes);
        date.setUTCSeconds(this.seconds);
        date.setUTCMilliseconds(0);
        return date;
    }
}
export function encodeObjectIdentifier(oid) {
    const parts = oid.split(".");
    const components = [];
    for (let i = 0; i < parts.length; i++) {
        const parsed = Number(parts[i]);
        if (!Number.isInteger(parsed) || parsed < 0) {
            throw new TypeError("Invalid object identifier");
        }
        components[i] = parsed;
    }
    if (components.length < 2) {
        throw new TypeError("Invalid object identifier");
    }
    const firstSubidentifier = components[0] * 40 + components[1];
    const buffer = new DynamicBuffer(0);
    buffer.write(variableLengthQuantityBytes(BigInt(firstSubidentifier)));
    for (let i = 2; i < components.length; i++) {
        buffer.write(variableLengthQuantityBytes(BigInt(components[i])));
    }
    return buffer.bytes();
}
export var ASN1UniversalType;
(function (ASN1UniversalType) {
    ASN1UniversalType[ASN1UniversalType["Boolean"] = 0] = "Boolean";
    ASN1UniversalType[ASN1UniversalType["Integer"] = 1] = "Integer";
    ASN1UniversalType[ASN1UniversalType["BitString"] = 2] = "BitString";
    ASN1UniversalType[ASN1UniversalType["OctetString"] = 3] = "OctetString";
    ASN1UniversalType[ASN1UniversalType["Null"] = 4] = "Null";
    ASN1UniversalType[ASN1UniversalType["ObjectIdentifier"] = 5] = "ObjectIdentifier";
    ASN1UniversalType[ASN1UniversalType["ObjectDescriptor"] = 6] = "ObjectDescriptor";
    ASN1UniversalType[ASN1UniversalType["External"] = 7] = "External";
    ASN1UniversalType[ASN1UniversalType["Real"] = 8] = "Real";
    ASN1UniversalType[ASN1UniversalType["Enumerated"] = 9] = "Enumerated";
    ASN1UniversalType[ASN1UniversalType["EmbeddedPDV"] = 10] = "EmbeddedPDV";
    ASN1UniversalType[ASN1UniversalType["UTF8String"] = 11] = "UTF8String";
    ASN1UniversalType[ASN1UniversalType["RelativeObjectIdentifier"] = 12] = "RelativeObjectIdentifier";
    ASN1UniversalType[ASN1UniversalType["Time"] = 13] = "Time";
    ASN1UniversalType[ASN1UniversalType["Sequence"] = 14] = "Sequence";
    ASN1UniversalType[ASN1UniversalType["Set"] = 15] = "Set";
    ASN1UniversalType[ASN1UniversalType["NumericString"] = 16] = "NumericString";
    ASN1UniversalType[ASN1UniversalType["PrintableString"] = 17] = "PrintableString";
    ASN1UniversalType[ASN1UniversalType["TeletexString"] = 18] = "TeletexString";
    ASN1UniversalType[ASN1UniversalType["VideotextString"] = 19] = "VideotextString";
    ASN1UniversalType[ASN1UniversalType["IA5String"] = 20] = "IA5String";
    ASN1UniversalType[ASN1UniversalType["UTCTime"] = 21] = "UTCTime";
    ASN1UniversalType[ASN1UniversalType["GeneralizedTime"] = 22] = "GeneralizedTime";
    ASN1UniversalType[ASN1UniversalType["GraphicString"] = 23] = "GraphicString";
    ASN1UniversalType[ASN1UniversalType["VisibleString"] = 24] = "VisibleString";
    ASN1UniversalType[ASN1UniversalType["GeneralString"] = 25] = "GeneralString";
    ASN1UniversalType[ASN1UniversalType["UniversalString"] = 26] = "UniversalString";
    ASN1UniversalType[ASN1UniversalType["CharacterString"] = 27] = "CharacterString";
    ASN1UniversalType[ASN1UniversalType["BMPString"] = 28] = "BMPString";
})(ASN1UniversalType || (ASN1UniversalType = {}));
export var ASN1Class;
(function (ASN1Class) {
    ASN1Class[ASN1Class["Universal"] = 0] = "Universal";
    ASN1Class[ASN1Class["Application"] = 1] = "Application";
    ASN1Class[ASN1Class["ContextSpecific"] = 2] = "ContextSpecific";
    ASN1Class[ASN1Class["Private"] = 3] = "Private";
})(ASN1Class || (ASN1Class = {}));
export var ASN1Form;
(function (ASN1Form) {
    ASN1Form[ASN1Form["Primitive"] = 0] = "Primitive";
    ASN1Form[ASN1Form["Constructed"] = 1] = "Constructed";
})(ASN1Form || (ASN1Form = {}));
export const ASN1_UNIVERSAL_TAG = {
    BOOLEAN: 1,
    INTEGER: 2,
    BIT_STRING: 3,
    OCTET_STRING: 4,
    NULL: 5,
    OBJECT_IDENTIFIER: 6,
    OBJECT_DESCRIPTOR: 7,
    EXTERNAL: 8,
    REAL: 9,
    ENUMERATED: 10,
    EMBEDDED_PDV: 11,
    UTF8_STRING: 12,
    RELATIVE_OBJECT_IDENTIFIER: 13,
    TIME: 14,
    SEQUENCE: 16,
    SET: 17,
    NUMERIC_STRING: 18,
    PRINTABLE_STRING: 19,
    TELETEX_STRING: 20,
    VIDEOTEX_STRING: 21,
    IA5_STRING: 22,
    UTC_TIME: 23,
    GENERALIZED_TIME: 24,
    GRAPHIC_STRING: 25,
    VISIBLE_STRING: 26,
    GENERAL_STRING: 27,
    UNIVERSAL_STRING: 28,
    CHARACTER_STRING: 29,
    BMP_STRING: 30
};
const ASN1_UNIVERSAL_TAG_MAP = {
    1: ASN1UniversalType.Boolean,
    2: ASN1UniversalType.Integer,
    3: ASN1UniversalType.BitString,
    4: ASN1UniversalType.OctetString,
    5: ASN1UniversalType.Null,
    6: ASN1UniversalType.ObjectIdentifier,
    7: ASN1UniversalType.ObjectDescriptor,
    8: ASN1UniversalType.External,
    9: ASN1UniversalType.Real,
    10: ASN1UniversalType.Enumerated,
    11: ASN1UniversalType.EmbeddedPDV,
    12: ASN1UniversalType.UTF8String,
    13: ASN1UniversalType.RelativeObjectIdentifier,
    14: ASN1UniversalType.Time,
    16: ASN1UniversalType.Sequence,
    17: ASN1UniversalType.Set,
    18: ASN1UniversalType.NumericString,
    19: ASN1UniversalType.PrintableString,
    20: ASN1UniversalType.TeletexString,
    21: ASN1UniversalType.VideotextString,
    22: ASN1UniversalType.IA5String,
    23: ASN1UniversalType.UTCTime,
    24: ASN1UniversalType.GeneralizedTime,
    25: ASN1UniversalType.GraphicString,
    26: ASN1UniversalType.VisibleString,
    27: ASN1UniversalType.GeneralString,
    28: ASN1UniversalType.UniversalString,
    29: ASN1UniversalType.CharacterString,
    30: ASN1UniversalType.BMPString
};
export class ASN1ParseError extends Error {
    constructor() {
        super("Failed to parse ASN.1");
    }
}
export class ASN1DecodeError extends Error {
    constructor() {
        super("Failed to decode ASN.1");
    }
}
export class ASN1EncodeError extends Error {
    constructor() {
        super("Failed to encode ASN.1");
    }
}
export class ASN1LeftoverBytesError extends Error {
    constructor(count) {
        super(`ASN.1 leftover bytes: ${count}`);
    }
}
