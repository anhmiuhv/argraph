"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var AnimationHelper;
(function (AnimationHelper) {
    /**
     * This helps show the closes x,y,z axis
     * @param graph Graph object
     * @param camera Camera object
     */
    function hideAxis(graph, camera) {
        let all = graph.allplane();
        hidex(all.slice(0, 2), camera);
        hidey(all.slice(2, 6), camera);
    }
    AnimationHelper.hideAxis = hideAxis;
    function hidex(topbottom, camera, debug = false) {
        let vis = topbottom.filter(function (e) { return e.visible; })[0];
        let xt = vis.getObjectByName('xtop');
        let xb = vis.getObjectByName('xbottom');
        if (xt && xb) {
            const xtv = xt.geometry.vertices[0].clone();
            const xbv = xb.geometry.vertices[0].clone();
            //same worldmatrix
            xtv.applyMatrix4(xt.matrixWorld);
            xbv.applyMatrix4(xb.matrixWorld);
            if (camera.position.distanceTo(xtv) > camera.position.distanceTo(xbv))
                xt.visible = false;
            else
                xt.visible = true;
            xb.visible = !xt.visible;
        }
        let yl = vis.getObjectByName('yleft');
        let yr = vis.getObjectByName('yright');
        if (yl && yr) {
            const ylv = yl.geometry.vertices[0].clone();
            const yrv = yr.geometry.vertices[0].clone();
            ylv.applyMatrix4(yl.matrixWorld);
            yrv.applyMatrix4(yr.matrixWorld);
            if (debug) {
                console.log(yl.matrixWorld);
            }
            if (camera.position.distanceTo(ylv) > camera.position.distanceTo(yrv))
                yl.visible = false;
            else
                yl.visible = true;
            yr.visible = !yl.visible;
        }
    }
    function hidey(therest, camera) {
        const nohidden = therest.filter((e) => { return e.visible; });
        const axis = [];
        for (var i of nohidden) {
            axis.push(i.getObjectByName('yleft'), i.getObjectByName('yright'));
        }
        let mi = 100000;
        let count = -1;
        const vertices = axis.map((x, i) => {
            return x.geometry.vertices[0].clone()
                .applyMatrix4(axis[i].matrixWorld)
                .project(camera);
        });
        for (let i = 0; i < vertices.length; i++) {
            if (mi > vertices[i].x) {
                mi = vertices[i].x;
                count = i;
            }
        }
        for (let i = 0; i < axis.length; i++) {
            if (i == count)
                axis[i].visible = true;
            else
                axis[i].visible = false;
        }
    }
    // this function hide the plane which is closest to the camera
    function hidePlane(allplane, camera, debug = false) {
        let arr = allplane.map((object) => {
            return new PairDist(object, camera);
        });
        const pos = camera.position;
        if (arr[0].b >= arr[1].b)
            arr[0].a.visible = true;
        else
            arr[0].a.visible = false;
        arr[1].a.visible = !arr[0].a.visible;
        if (arr[2].b >= arr[3].b)
            arr[2].a.visible = true;
        else
            arr[2].a.visible = false;
        arr[3].a.visible = !arr[2].a.visible;
        if (arr[4].b >= arr[5].b) {
            arr[4].a.visible = true;
        }
        else {
            arr[4].a.visible = false;
        }
        arr[5].a.visible = !arr[4].a.visible;
    }
    AnimationHelper.hidePlane = hidePlane;
    class PairDist {
        constructor(plane, camera) {
            this.a = plane;
            this.b = camera.position.distanceTo(plane.position.clone().setFromMatrixPosition(plane.matrixWorld));
        }
    }
})(AnimationHelper = exports.AnimationHelper || (exports.AnimationHelper = {}));
