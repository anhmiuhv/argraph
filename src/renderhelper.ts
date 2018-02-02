import {Graph} from "./planehelper"
import {GraphInfo, SurfaceInfo, Axis, FunctionInfo} from "./datahelper"
import { DoubleSide, VertexColors, Face3, Vector3, Geometry, Color, Points, PointsMaterial
    , BufferAttribute, BufferGeometry, Scene, DirectionalLight, AmbientLight, SphereGeometry
    , MeshLambertMaterial, Mesh, ParametricGeometry, MeshBasicMaterial, Group, Plane, ShaderMaterial, OneMinusDstAlphaFactor
} from 'three'
const createColormap = require("colormap")

export namespace RenderHelper {
    /**
     * Render sphere
     * @param scene scene object
     * @param graphinfo graph info object
     * @param graph graph object
     * @return many sphere
     */
    export function renderSphere(graphinfo: GraphInfo, graph: Graph) {
        var geometry = new SphereGeometry(0.015 /  graph.scaleFactor,20,20 ,0, Math.PI * 2, 0, Math.PI * 2);
        var material = new MeshLambertMaterial({color: 0xd3d3d3});
        
        let pos = graph.getVerticesForDisplay(graphinfo.vertices);
        var count = 0;
        let group = new Group();
        for ( let i of pos ) {
            var mesh = new Mesh( geometry, material );
            mesh.name = "sphere " + count;
            mesh.position.set( i.x, i.y, i.z);
            mesh.userData = Object.assign(mesh,mesh.userData, {oriData: graphinfo.vertices[count]});
            group.add( mesh );
            count++;
        }
        return group;
    }

    /**
     * render points cloud
     * @param scene scene object
     * @param graphinfo graph info object
     * @param graph graph object
     * @returns points
     */
    export function renderPoints(graphinfo: GraphInfo, graph: Graph) {
        let geometry = new BufferGeometry();
        const array = (<number[]>[]).concat(...graph.getVerticesForDisplay(graphinfo.vertices).map((v)=> {
            return v.toArray();
        }));
        geometry.addAttribute('position', new BufferAttribute(array, graphinfo.vertices.length));
        let mat = new PointsMaterial({ size:0.05, color: 0x7FDBFF });
        let particles = new Points( geometry , mat );
        return particles;
    }

    /**
     * render a 3D plot with the provided function
     * @param scene  the Scene of your program
     * @param functioninfo the function info object
     * @param graph  the Graph object in your scene
     * @param params Graphical params
     */
    export function renderFunction(functioninfo: FunctionInfo,  graph: Graph, params: any = {}) {
        const xRange = functioninfo.highx - functioninfo.lowx
        const yRange = functioninfo.highy - functioninfo.lowy
        const zRange = functioninfo.highz - functioninfo.lowz
        const meshFunction = (x: number, y: number) => {
            x = zRange * x + functioninfo.lowz
            y = yRange * y + functioninfo.lowy
            try {
                const z = functioninfo.mathFunction.eval({x: x, y: y})
                if (isNaN(z)) return new Vector3()
                
                return new Vector3(graph.scalez(x), graph.scaley(y), graph.scalex(z))
            } catch (e) {
                return new Vector3()
            }
        }
        let graphGeometry = new ParametricGeometry(meshFunction, functioninfo.numberOfPointsX, functioninfo.numberOfPointsY)
        let cmap = createColormap({ colormap: params.colormap || "viridis" })

        var colors: Color[] = [];
        for (var i = 0; i < graphGeometry.vertices.length; i++) {
            const point = graphGeometry.vertices[i];
            const color = getColor(cmap[Math.round((functioninfo.highz - point.z) / zRange * cmap.length)] as string);
            graphGeometry.colors[i] = color; // use this array for convenience
        }
        
        const faceIndices = ['a', 'b', 'c', 'd'];
        const newFaces: Face3[] =[]
        for (var i = 0; i < graphGeometry.faces.length; i++) {
            const face: Face3 = graphGeometry.faces[i];
            let added= true
            const numberOfSides = 3
            for (var j = 0; j < numberOfSides; j++) {
                const vertexIndex = (face as any)[faceIndices[j]];
                face.vertexColors[j] = graphGeometry.colors[vertexIndex];
                if (graphGeometry.vertices[vertexIndex].z < graph.scalez(functioninfo.lowz ) - 0.0005
                    || graphGeometry.vertices[vertexIndex].z > graph.scalez(functioninfo.highz) + 0.0005
                    || graphGeometry.vertices[vertexIndex].x < graph.scalex(functioninfo.lowx) - 0.0005
                    || graphGeometry.vertices[vertexIndex].x > graph.scalex(functioninfo.highx) + 0.0005) added = false;
            }
            if (added) newFaces.push(face);
        }

        graphGeometry.faces = newFaces;


        var material = new MeshBasicMaterial({ vertexColors: VertexColors, side: DoubleSide } );
            

        var mesh = new Mesh(graphGeometry, material);
        return mesh;
    }

    /**
     * render a 3D surface plot with color
     * @param scene The Scene of you program
     * @param surfaceinfo The surface info
     * @param graph The Graph object in your scene
     * @param params Graphical params
     * Supported fields: "colormap"
     * @returns Mesh of surface
     */
    export function renderSurface(surfaceinfo: SurfaceInfo, graph: Graph, params: any = {}) {
        

        var geometry = new Geometry();
        var colors: Color[] = [];

        var height = surfaceinfo.height, width = surfaceinfo.width;
        let count = 0;
        let cmap = createColormap({ colormap: params.colormap || "viridis" })
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
        return mesh;
    }
    function getColor(hex: string) {
        var color = new Color(hex);

        return color;
    }
}
