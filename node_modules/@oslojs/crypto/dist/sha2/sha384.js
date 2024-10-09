import { SharedSHA512 } from "./sha512.js";
export function sha384(data) {
    const hash = new SHA384();
    hash.update(data);
    return hash.digest();
}
export class SHA384 {
    blockSize = 128;
    size = 48;
    sha512 = new SharedSHA512(new BigUint64Array([
        0xcbbb9d5dc1059ed8n,
        0x629a292a367cd507n,
        0x9159015a3070dd17n,
        0x152fecd8f70e5939n,
        0x67332667ffc00b31n,
        0x8eb44a8768581511n,
        0xdb0c2e0d64f98fa7n,
        0x47b5481dbefa4fa4n
    ]));
    update(data) {
        this.sha512.update(data);
    }
    digest() {
        const result = new Uint8Array(48);
        this.sha512.putDigest(result);
        return result;
    }
}
