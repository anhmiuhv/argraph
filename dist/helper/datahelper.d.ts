import { Vector3 } from 'three';
/**
 * Scatterplot info class
 */
export declare class GraphInfo {
    lowx: number;
    highx: number;
    lowy: number;
    highy: number;
    lowz: number;
    highz: number;
    vertices: Vector3[];
    constructor(data: Vector3[]);
    getAllLimits(): number[];
    scaler(value: number, axis?: Axis): number;
}
/**
 * Surface plot info object
 */
export declare class SurfaceInfo extends GraphInfo {
    height: number;
    width: number;
    /**
     * create a surface info object from height map matrix
     * @param surface height map matrix
     */
    constructor(surface: number[][]);
}
export declare enum Axis {
    x = 0,
    y = 1,
    z = 2,
}
