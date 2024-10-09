import { SHA3 } from "./sha3.js";
export function sha3_224(data) {
    const hash = new SHA3_224();
    hash.update(data);
    return hash.digest();
}
export function sha3_256(data) {
    const hash = new SHA3_256();
    hash.update(data);
    return hash.digest();
}
export function sha3_384(data) {
    const hash = new SHA3_384();
    hash.update(data);
    return hash.digest();
}
export function sha3_512(data) {
    const hash = new SHA3_512();
    hash.update(data);
    return hash.digest();
}
export class SHA3_224 {
    blockSize = 144;
    size = 28;
    sha3 = new SHA3(this.blockSize, this.size);
    update(data) {
        this.sha3.absorb(data);
    }
    digest() {
        return this.sha3.squeeze();
    }
}
export class SHA3_256 {
    blockSize = 136;
    size = 32;
    sha3 = new SHA3(this.blockSize, this.size);
    update(data) {
        this.sha3.absorb(data);
    }
    digest() {
        return this.sha3.squeeze();
    }
}
export class SHA3_384 {
    blockSize = 104;
    size = 48;
    sha3 = new SHA3(this.blockSize, this.size);
    update(data) {
        this.sha3.absorb(data);
    }
    digest() {
        return this.sha3.squeeze();
    }
}
export class SHA3_512 {
    blockSize = 72;
    size = 64;
    sha3 = new SHA3(this.blockSize, this.size);
    update(data) {
        this.sha3.absorb(data);
    }
    digest() {
        return this.sha3.squeeze();
    }
}
