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
     * Add the y axis to the graph plane
     * @param therest the y axis graph plane
     * @param scaleFactor the scale factor of the graph object
     * @param title
     */
    function addyaxis(therest: Group[], scaleFactor: number, title?: string): void;
    /**
     * Add the x and z axis to the graph plane
     * @param topbottom the topbottom axis plane
     * @param scaleFactor the scale factor of the graph object
     * @param title the title for x and z axis
     */
    function addxzaxis(topbottom: Group[], scaleFactor: number, title?: {
        x: string;
        z: string;
    }): void;
}
