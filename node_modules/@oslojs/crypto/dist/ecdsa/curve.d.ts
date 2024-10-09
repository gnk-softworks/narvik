export declare class ECDSAPoint {
    x: bigint;
    y: bigint;
    constructor(x: bigint, y: bigint);
}
declare class JacobianPoint {
    x: bigint;
    y: bigint;
    z: bigint;
    constructor(x: bigint, y: bigint, z: bigint);
    isAtInfinity(): boolean;
}
export declare class ECDSANamedCurve {
    p: bigint;
    a: bigint;
    b: bigint;
    g: ECDSAPoint;
    n: bigint;
    cofactor: bigint;
    size: number;
    objectIdentifier: string;
    constructor(p: bigint, a: bigint, b: bigint, gx: bigint, gy: bigint, n: bigint, cofactor: bigint, size: number, objectIdentifier: string);
    add(point1: ECDSAPoint, point2: ECDSAPoint): ECDSAPoint | null;
    private addJacobian;
    double(point: ECDSAPoint): ECDSAPoint | null;
    private doubleJacobian;
    toAffine(point: JacobianPoint): ECDSAPoint | null;
    fromAffine(point: ECDSAPoint): JacobianPoint;
    multiply(k: bigint, point: ECDSAPoint): ECDSAPoint | null;
    isOnCurve(point: ECDSAPoint): boolean;
}
export {};
