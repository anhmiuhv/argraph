import { Mesh, Vector2, Camera } from 'three';
import { Graph } from "./planehelper";
export interface ThreeEvent extends Event {
    clientX: number;
    clientY: number;
    deltaY: number;
    button: THREE.MOUSE;
    touches: Array<Touch>;
    keyCode: number;
    pointerId: number;
}
export declare namespace EventHelper {
    class GeneralThreeEvent {
        INTERSECTED: Mesh;
        camera: Camera;
        graph: Graph;
        constructor(camera: Camera, graph: Graph);
        genrateOnTouch(this: GeneralThreeEvent): (e: ThreeEvent) => void;
    }
    class ZoomableThreeEvent {
        prevDiff: number;
        prevPos: Vector2;
        camera: Camera;
        graph: Graph;
        domElement: HTMLElement | Document;
        constructor(camera: Camera, graph: Graph);
        genrateOnTouch(this: ZoomableThreeEvent): (e: ThreeEvent) => void;
        generateOnMove(this: ZoomableThreeEvent): (e: ThreeEvent) => void;
        generateOnUp(this: ZoomableThreeEvent): (e: ThreeEvent) => void;
    }
}
