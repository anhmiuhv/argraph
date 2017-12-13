import { Object3D, Camera } from 'three';
import { Graph } from './planehelper';
export declare namespace AnimationHelper {
    function hideAxis(graph: Graph, camera: Camera): void;
    function hidePlane(allplane: Object3D[], camera: Camera, debug?: boolean): void;
}
