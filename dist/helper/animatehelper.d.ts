import { Object3D, Camera } from 'three';
import { Graph } from './planehelper';
export declare namespace AnimationHelper {
    /**
     * This helps show the closes x,y,z axis
     * @param graph Graph object
     * @param camera Camera object
     */
    function hideAxis(graph: Graph, camera: Camera): void;
    function hidePlane(allplane: Object3D[], camera: Camera, debug?: boolean): void;
}
