import { Graph } from "./planehelper";
import { GraphInfo, SurfaceInfo } from "./datahelper";
import { Scene } from 'three';
export declare namespace RenderHelper {
    /**
     * Render sphere
     * @param scene scene object
     * @param graphinfo graph info object
     * @param graph graph object
     */
    function renderSphere(scene: Scene, graphinfo: GraphInfo, graph: Graph): void;
    /**
     * render points cloud
     * @param scene scene object
     * @param graphinfo graph info object
     * @param graph graph object
     */
    function renderPoints(scene: Scene, graphinfo: GraphInfo, graph: Graph): void;
    function renderSurface(scene: Scene, surfaceinfo: SurfaceInfo, graph: Graph, params?: any): void;
}
