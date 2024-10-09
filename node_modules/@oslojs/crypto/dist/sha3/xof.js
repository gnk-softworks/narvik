import { SHA3XOF } from "./sha3.js";
export function shake128(size, data) {
    const hash = new SHAKE128(size);
    hash.update(data);
    return hash.digest();
}
export function shake256(size, data) {
    const hash = new SHAKE256(size);
    hash.update(data);
    return hash.digest();
}
export class SHAKE128 {
    blockSize = 168;
    size;
    sha3;
    constructor(size) {
        if (size < 1) {
            throw new TypeError("Invalid hash size");
        }
        this.size = size;
        this.sha3 = new SHA3XOF(this.blockSize, this.size);
    }
    update(data) {
        this.sha3.absorb(data);
    }
    digest() {
        return this.sha3.squeeze();
    }
}
export class SHAKE256 {
    blockSize = 136;
    size;
    sha3;
    constructor(size) {
        this.size = size;
        this.sha3 = new SHA3XOF(this.blockSize, this.size);
    }
    update(data) {
        this.sha3.absorb(data);
    }
    digest() {
        return this.sha3.squeeze();
    }
}
