import { Scene, Group, Vector3 } from 'three';
import { ScaleContinuousNumeric } from 'd3-scale';
import { GraphInfo } from './datahelper';
/**
 *
 * this class contains the graph the informations for a graph
 *
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
     *
     *  This function generate the axis plane, all variables are integers, low < high or function fail
     *
     */
    function addplane(graphinfo: GraphInfo): Graph;
    /**
     *
     * generate the label for the y-axis. Take in all the side planes
     *
     */
    function addyaxis(therest: Group[], scaleFactor: number, title?: string): void;
    /**
     *
     * generate label for the x and z axis. Take in the top and bottom plane
     *
     */
    function addxzaxis(topbottom: Group[], scaleFactor: number, title?: {
        x: string;
        z: string;
    }): void;
}
