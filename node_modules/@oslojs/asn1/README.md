# @oslojs/asn1

**Documentation: https://asn1.oslojs.dev**

A JavaScript library for encoding and decoding ASN.1 with Distinguished Encoding Rules (DER) by [Oslo](https://oslojs.dev).

- Runtime-agnostic
- No third-party dependencies
- Fully typed

```ts
import { parseASN1NoLeftoverBytes } from "@oslojs/asn1";

const parsed = parseASN1NoLeftoverBytes(encoded);
const oid = parsed.sequence().at(0).objectIdentifier();
if (!oid.is("1.2.840.10045.4.3.2")) {
	throw new Error("Invalid OID");
}
```

> This library only supports DER and not CER or BER.

## Installation

```
npm i @oslojs/asn1
```
