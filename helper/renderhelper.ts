import {Graph} from "./planehelper"
import {GraphInfo, SurfaceInfo, Axis} from "./datahelper"
import { VertexColors, Face3, Vector3, Geometry, Color, Points, PointsMaterial, BufferAttribute, BufferGeometry, Scene, DirectionalLight, AmbientLight, SphereGeometry, MeshLambertMaterial, Mesh} from 'three'
import colormap from 'colormap';

export namespace RenderHelper {
    /**
     * Render sphere
     * @param scene scene object
     * @param graphinfo graph info object
     * @param graph graph object
     */
    export function renderSphere(scene: Scene, graphinfo: GraphInfo, graph: Graph) {
        var directionalLight = new DirectionalLight( 0xffffff, 0.5 );
        scene.add(directionalLight);
        var light = new AmbientLight( 0x404040, 0.8 ); // soft white AmbientLight
        scene.add( light );
        var geometry = new SphereGeometry(0.015 /  graph.scaleFactor,20,20 ,0, Math.PI * 2, 0, Math.PI * 2);
        var material = new MeshLambertMaterial({color: 0xd3d3d3});
        
        let pos = graph.getVerticesForDisplay(graphinfo.vertices);
        var count = 0;
        for ( let i of pos ) {
            var mesh = new Mesh( geometry, material );
            mesh.name = "sphere " + count;
            mesh.position.set( i.x, i.y, i.z);
            mesh.userData = Object.assign(mesh,mesh.userData, {oriData: graphinfo.vertices[count]});
            graph.graph.add( mesh );
            count++;
        }
    }

    /**
     * render points cloud
     * @param scene scene object
     * @param graphinfo graph info object
     * @param graph graph object
     */
    export function renderPoints(scene: Scene, graphinfo: GraphInfo, graph: Graph) {
        let geometry = new BufferGeometry();
        const array = (<number[]>[]).concat(...graph.getVerticesForDisplay(graphinfo.vertices).map((v)=> {
            return v.toArray();
        }));
        geometry.addAttribute('position', new BufferAttribute(array, graphinfo.vertices.length));
        let mat = new PointsMaterial({ size:0.05, color: 0x7FDBFF });
        let particles = new Points( geometry , mat );
        graph.graph.add(particles);
    }


    export function renderSurface(scene: Scene, surfaceinfo: SurfaceInfo, graph: Graph, params: any = {}) {
        function getColor(hex: string) {
            var color = new Color(hex);

            return color;
        }

        var geometry = new Geometry();
        var colors: Color[] = [];

        var height = surfaceinfo.height, width = surfaceinfo.width;
        let count = 0;
        let cmap = colormap({ colormap: params.colormap || "viridis", nshades: height * width })
        graph.getVerticesForDisplay(surfaceinfo.vertices).forEach(function (col) {

            geometry.vertices.push(col)
            let ratio = Math.round(surfaceinfo.scaler(surfaceinfo.vertices[count].y, Axis.y) * cmap.length)
            colors.push(getColor(cmap[ratio] as string));
            count++;
        });

        var offset = function (x: number, y: number) {
            return x + y * width;
        }

        for (var x = 0; x < width - 1; x++) {
            for (var y = 0; y < height - 1; y++) {
                var vec0 = new Vector3(), vec1 = new Vector3(), n_vec = new Vector3();
                // one of two triangle polygons in one rectangle
                vec0.subVectors(geometry.vertices[offset(x, y)], geometry.vertices[offset(x + 1, y)]);
                vec1.subVectors(geometry.vertices[offset(x, y)], geometry.vertices[offset(x, y + 1)]);
                n_vec.crossVectors(vec0, vec1).normalize();
                geometry.faces.push(new Face3(offset(x, y), offset(x + 1, y), offset(x, y + 1), n_vec, [colors[offset(x, y)], colors[offset(x + 1, y)], colors[offset(x, y + 1)]]));
                geometry.faces.push(new Face3(offset(x, y), offset(x, y + 1), offset(x + 1, y), n_vec.negate(), [colors[offset(x, y)], colors[offset(x, y + 1)], colors[offset(x + 1, y)]]));
                // the other one
                vec0.subVectors(geometry.vertices[offset(x + 1, y)], geometry.vertices[offset(x + 1, y + 1)]);
                vec1.subVectors(geometry.vertices[offset(x, y + 1)], geometry.vertices[offset(x + 1, y + 1)]);
                n_vec.crossVectors(vec0, vec1).normalize();
                geometry.faces.push(new Face3(offset(x + 1, y), offset(x + 1, y + 1), offset(x, y + 1), n_vec, [colors[offset(x + 1, y)], colors[offset(x + 1, y + 1)], colors[offset(x, y + 1)]]));
                geometry.faces.push(new Face3(offset(x + 1, y), offset(x, y + 1), offset(x + 1, y + 1), n_vec.negate(), [colors[offset(x + 1, y)], colors[offset(x, y + 1)], colors[offset(x + 1, y + 1)]]));
            }
        }

        var material = new MeshLambertMaterial({ vertexColors: VertexColors });
        var mesh = new Mesh(geometry, material);
        graph.graph.add(mesh);
        const ligt = new AmbientLight("white")
        scene.add(ligt);
    }
}