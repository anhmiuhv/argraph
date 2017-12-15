"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const datahelper_1 = require("./datahelper");
const three_1 = require("three");
const colormap_1 = require("colormap");
var RenderHelper;
(function (RenderHelper) {
    /**
     * Render sphere
     * @param scene scene object
     * @param graphinfo graph info object
     * @param graph graph object
     */
    function renderSphere(scene, graphinfo, graph) {
        var directionalLight = new three_1.DirectionalLight(0xffffff, 0.5);
        scene.add(directionalLight);
        var light = new three_1.AmbientLight(0x404040, 0.8); // soft white AmbientLight
        scene.add(light);
        var geometry = new three_1.SphereGeometry(0.015 / graph.scaleFactor, 20, 20, 0, Math.PI * 2, 0, Math.PI * 2);
        var material = new three_1.MeshLambertMaterial({ color: 0xd3d3d3 });
        let pos = graph.getVerticesForDisplay(graphinfo.vertices);
        var count = 0;
        for (let i of pos) {
            var mesh = new three_1.Mesh(geometry, material);
            mesh.name = "sphere " + count;
            mesh.position.set(i.x, i.y, i.z);
            mesh.userData = Object.assign(mesh, mesh.userData, { oriData: graphinfo.vertices[count] });
            graph.graph.add(mesh);
            count++;
        }
    }
    RenderHelper.renderSphere = renderSphere;
    /**
     * render points cloud
     * @param scene scene object
     * @param graphinfo graph info object
     * @param graph graph object
     */
    function renderPoints(scene, graphinfo, graph) {
        let geometry = new three_1.BufferGeometry();
        const array = [].concat(...graph.getVerticesForDisplay(graphinfo.vertices).map((v) => {
            return v.toArray();
        }));
        geometry.addAttribute('position', new three_1.BufferAttribute(array, graphinfo.vertices.length));
        let mat = new three_1.PointsMaterial({ size: 0.05, color: 0x7FDBFF });
        let particles = new three_1.Points(geometry, mat);
        graph.graph.add(particles);
    }
    RenderHelper.renderPoints = renderPoints;
    function renderSurface(scene, surfaceinfo, graph, params = {}) {
        function getColor(hex) {
            var color = new three_1.Color(hex);
            return color;
        }
        var geometry = new three_1.Geometry();
        var colors = [];
        var height = surfaceinfo.height, width = surfaceinfo.width;
        let count = 0;
        let cmap = colormap_1.default({ colormap: params.colormap || "viridis", nshades: height * width });
        graph.getVerticesForDisplay(surfaceinfo.vertices).forEach(function (col) {
            geometry.vertices.push(col);
            let ratio = Math.round(surfaceinfo.scaler(surfaceinfo.vertices[count].y, datahelper_1.Axis.y) * cmap.length);
            colors.push(getColor(cmap[ratio]));
            count++;
        });
        var offset = function (x, y) {
            return x + y * width;
        };
        for (var x = 0; x < width - 1; x++) {
            for (var y = 0; y < height - 1; y++) {
                var vec0 = new three_1.Vector3(), vec1 = new three_1.Vector3(), n_vec = new three_1.Vector3();
                // one of two triangle polygons in one rectangle
                vec0.subVectors(geometry.vertices[offset(x, y)], geometry.vertices[offset(x + 1, y)]);
                vec1.subVectors(geometry.vertices[offset(x, y)], geometry.vertices[offset(x, y + 1)]);
                n_vec.crossVectors(vec0, vec1).normalize();
                geometry.faces.push(new three_1.Face3(offset(x, y), offset(x + 1, y), offset(x, y + 1), n_vec, [colors[offset(x, y)], colors[offset(x + 1, y)], colors[offset(x, y + 1)]]));
                geometry.faces.push(new three_1.Face3(offset(x, y), offset(x, y + 1), offset(x + 1, y), n_vec.negate(), [colors[offset(x, y)], colors[offset(x, y + 1)], colors[offset(x + 1, y)]]));
                // the other one
                vec0.subVectors(geometry.vertices[offset(x + 1, y)], geometry.vertices[offset(x + 1, y + 1)]);
                vec1.subVectors(geometry.vertices[offset(x, y + 1)], geometry.vertices[offset(x + 1, y + 1)]);
                n_vec.crossVectors(vec0, vec1).normalize();
                geometry.faces.push(new three_1.Face3(offset(x + 1, y), offset(x + 1, y + 1), offset(x, y + 1), n_vec, [colors[offset(x + 1, y)], colors[offset(x + 1, y + 1)], colors[offset(x, y + 1)]]));
                geometry.faces.push(new three_1.Face3(offset(x + 1, y), offset(x, y + 1), offset(x + 1, y + 1), n_vec.negate(), [colors[offset(x + 1, y)], colors[offset(x, y + 1)], colors[offset(x + 1, y + 1)]]));
            }
        }
        var material = new three_1.MeshLambertMaterial({ vertexColors: three_1.VertexColors });
        var mesh = new three_1.Mesh(geometry, material);
        graph.graph.add(mesh);
        const ligt = new three_1.AmbientLight("white");
        scene.add(ligt);
    }
    RenderHelper.renderSurface = renderSurface;
})(RenderHelper = exports.RenderHelper || (exports.RenderHelper = {}));