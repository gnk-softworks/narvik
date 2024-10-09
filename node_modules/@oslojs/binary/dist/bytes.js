export function compareBytes(a, b) {
    if (a.byteLength !== b.byteLength) {
        return false;
    }
    for (let i = 0; i < b.byteLength; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}
export function concatenateBytes(a, b) {
    const result = new Uint8Array(a.byteLength + b.byteLength);
    result.set(a);
    result.set(b, a.byteLength);
    return result;
}
export class DynamicBuffer {
    value;
    capacity;
    length = 0;
    constructor(capacity) {
        this.value = new Uint8Array(capacity);
        this.capacity = capacity = capacity;
    }
    write(bytes) {
        if (this.length + bytes.byteLength <= this.capacity) {
            this.value.set(bytes, this.length);
            this.length += bytes.byteLength;
            return;
        }
        while (this.length + bytes.byteLength > this.capacity) {
            if (this.capacity === 0) {
                this.capacity = 1;
            }
            else {
                this.capacity = this.capacity * 2;
            }
        }
        const newValue = new Uint8Array(this.capacity);
        newValue.set(this.value.subarray(0, this.length));
        newValue.set(bytes, this.length);
        this.value = newValue;
        this.length += bytes.byteLength;
    }
    writeByte(byte) {
        if (this.length + 1 <= this.capacity) {
            this.value[this.length] = byte;
            this.length += 1;
            return;
        }
        if (this.capacity === 0) {
            this.capacity = 1;
        }
        else {
            this.capacity = this.capacity * 2;
        }
        const newValue = new Uint8Array(this.capacity);
        newValue.set(this.value.subarray(0, this.length));
        newValue[this.length] = byte;
        this.value = newValue;
        this.length += 1;
    }
    readInto(target) {
        if (target.byteLength < this.length) {
            throw new TypeError("Not enough space");
        }
        target.set(this.value.subarray(0, this.length));
    }
    bytes() {
        return this.value.slice(0, this.length);
    }
    clear() {
        this.length = 0;
    }
}
