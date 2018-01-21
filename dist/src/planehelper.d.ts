import { Scene, Group, Vector3 } from 'three';
import { ScaleContinuousNumeric } from 'd3-scale';
import { GraphInfo } from './datahelper';
/**
 * The 3D graph object
 */
export declare class Graph {
    graph: Group;
    deltax: number;
    deltay: number;
    deltaz: number;
    scalex: ScaleContinuousNumeric<number, number>;
    scaley: ScaleContinuousNumeric<number, number>;
    scalez: ScaleContinuousNumeric<number, number>;
    planetop: Group;
    planebottom: Group;
    planeright: Group;
    planeleft: Group;
    planefront: Group;
    planeback: Group;
    scaleFactor: number;
    constructor(graph: Group, delta: number[], scale: ScaleContinuousNumeric<number, number>[], allplane: Group[], scaleFactor: number);
    injectScene(scene: Scene): void;
    getVerticesForDisplay(vertices: Vector3[]): Vector3[];
    topbottom(): Group[];
    therest(): Group[];
    allplane(): Group[];
}
export declare namespace PlaneHelper {
    /**
     * Generate Graph from graph info
     * @param graphinfo The GraphInfo
     */
    function addplane(graphinfo: GraphInfo): Graph;
    /**
     * Add axis to the graph
     * @param graph the graph
     * @param title title, default to 'x, 'y', 'z'
     */
    function addaxis(graph: Graph, title?: {
        x: string;
        y: string;
        z: string;
    }): void;
}
