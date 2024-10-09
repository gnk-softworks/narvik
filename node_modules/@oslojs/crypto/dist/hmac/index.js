export class HMAC {
    k0;
    inner;
    outer;
    constructor(Algorithm, key) {
        const keyHash = new Algorithm();
        if (key.byteLength === keyHash.blockSize) {
            this.k0 = key;
        }
        else if (key.byteLength > keyHash.blockSize) {
            this.k0 = new Uint8Array(keyHash.blockSize);
            keyHash.update(key);
            this.k0.set(keyHash.digest());
        }
        else {
            this.k0 = new Uint8Array(keyHash.blockSize);
            this.k0.set(key);
        }
        this.inner = new Algorithm();
        const ipad = new Uint8Array(this.k0.byteLength).fill(0x36);
        for (let i = 0; i < ipad.byteLength; i++) {
            ipad[i] ^= this.k0[i];
        }
        this.inner.update(ipad);
        this.outer = new Algorithm();
        const opad = new Uint8Array(this.k0.byteLength).fill(0x5c);
        for (let i = 0; i < opad.byteLength; i++) {
            opad[i] ^= this.k0[i];
        }
        this.outer.update(opad);
    }
    update(message) {
        this.inner.update(message);
    }
    digest() {
        this.outer.update(this.inner.digest());
        return this.outer.digest();
    }
}
export function hmac(Algorithm, key, message) {
    const mac = new HMAC(Algorithm, key);
    mac.update(message);
    return mac.digest();
}
