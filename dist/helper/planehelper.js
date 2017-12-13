"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const three_1 = require("three");
const d3_scale_1 = require("d3-scale");
const texthelper_1 = require("./texthelper");
/**
 *
 * this class contains the graph the informations for a graph
 *
 */
class Graph {
    constructor(graph, delta, scale, allplane, scaleFactor) {
        this.graph = graph;
        this.deltax = delta[0];
        this.deltay = delta[1];
        this.deltaz = delta[2];
        this.scalex = scale[0];
        this.scaley = scale[1];
        this.scalez = scale[2];
        this.planetop = allplane[0];
        this.planebottom = allplane[1];
        this.planeleft = allplane[2];
        this.planeright = allplane[3];
        this.planefront = allplane[4];
        this.planeback = allplane[5];
        this.scaleFactor = scaleFactor;
    }
    injectScene(scene) {
        scene.add(this.graph);
    }
    getVerticesForDisplay(vertices) {
        return vertices.map((v) => {
            return new three_1.Vector3(this.scalez(v.z), this.scaley(v.y), this.scalex(v.x));
        });
    }
    topbottom() {
        return [this.planetop, this.planebottom];
    }
    therest() {
        return [this.planeback, this.planefront, this.planeleft, this.planeright];
    }
    allplane() {
        return this.topbottom().concat(this.therest());
    }
}
exports.Graph = Graph;
var PlaneHelper;
(function (PlaneHelper) {
    /**
     *
     *  This function generate the axis plane, all variables are integers, low < high or function fail
     *
     */
    function addplane(graphinfo) {
        let lowx = Math.floor(graphinfo.lowx);
        let highx = Math.ceil(graphinfo.highx);
        let lowy = Math.floor(graphinfo.lowy);
        let highy = Math.ceil(graphinfo.highy);
        let lowz = Math.floor(graphinfo.lowz);
        let highz = Math.ceil(graphinfo.highz);
        if (lowx == highx) {
            lowx--;
            highx++;
        }
        if (lowy == highy) {
            lowy--;
            highy++;
        }
        if (lowz == highz) {
            lowz--;
            highz++;
        }
        var graph = new three_1.Group();
        const threshold = 1.5;
        //do scaling ticks
        let scalex = d3_scale_1.scaleLinear().domain([lowx, highx]);
        let scaley = d3_scale_1.scaleLinear().domain([lowy, highy]);
        let scalez = d3_scale_1.scaleLinear().domain([lowz, highz]);
        //Make the graph ratio look nice
        let deltax = highx - lowx;
        let deltay = highy - lowy;
        let deltaz = highz - lowz;
        let mi = Math.min(deltax, deltay, deltaz);
        if (deltax > mi * threshold) {
            lowx *= mi * threshold / deltax;
            highx *= mi * threshold / deltax;
            deltax = mi * threshold;
        }
        if (deltay > mi * threshold) {
            lowy *= mi * threshold / deltay;
            highy *= mi * threshold / deltay;
            deltay = mi * threshold;
        }
        if (deltaz > mi * threshold) {
            lowz *= mi * threshold / deltaz;
            highz *= mi * threshold / deltaz;
            deltaz = mi * threshold;
        }
        deltax = highx - lowx;
        deltay = highy - lowy;
        deltaz = highz - lowz;
        //start generating plane
        let right = new three_1.Vector3(deltaz / 2, 0, 0);
        let left = new three_1.Vector3(-deltaz / 2, 0, 0);
        let rl = generatePlane(deltax, deltay, scalex, scaley, right, left, false);
        const planeright = rl[0];
        const planeleft = rl[1];
        rl.forEach(function (e) {
            e.rotation.y = -Math.PI / 2;
        });
        graph.add(...rl);
        let top = new three_1.Vector3(0, deltay / -2, 0);
        let bottom = new three_1.Vector3(0, deltay / 2, 0);
        let tb = generatePlane(deltaz, deltax, scalez, scalex, top, bottom, true);
        const planetop = tb[0];
        planetop.name = 'planetop';
        const planebottom = tb[1];
        planebottom.name = 'planebottom';
        tb.forEach(function (e) {
            e.rotation.x = Math.PI / 2;
        });
        graph.add(...tb);
        let front = new three_1.Vector3(0, 0, deltax / 2);
        let back = new three_1.Vector3(0, 0, -deltax / 2);
        let fb = generatePlane(deltaz, deltay, scalez, scaley, front, back, false);
        const planefront = fb[0];
        const planeback = fb[1];
        graph.add(...fb);
        let m = Math.max(deltax, deltay, deltaz) || 1;
        graph.scale.multiplyScalar(0.5 / m);
        const alldelta = [deltax, deltay, deltaz];
        const allscale = [scalex.range([-deltax / 2, deltax / 2]),
            scaley.range([-deltay / 2, deltay / 2]),
            scalez.range([-deltaz / 2, deltaz / 2])];
        const allplane = [planetop, planebottom, planeleft, planeright, planefront, planeback];
        return new Graph(graph, alldelta, allscale, allplane, 0.5 / m);
    }
    PlaneHelper.addplane = addplane;
    /**
     *
     * helper function to generate a pair of planes
     *
     */
    function generatePlane(deltax, deltay, scalex, scaley, posfront, posback, xy) {
        const material = new three_1.MeshBasicMaterial({ color: 0x0074D9, transparent: true, opacity: 0.3, side: three_1.DoubleSide });
        let geometry = new three_1.PlaneGeometry(deltax, deltay);
        let planeback = new three_1.Group();
        planeback.add(new three_1.Mesh(geometry, material));
        planeback.position.copy(posback);
        let smalllinematerial = new three_1.LineBasicMaterial({
            color: 0xffffff,
            linewidth: 1
        });
        //Point of the axis
        let xtop = new three_1.Geometry();
        let xbottom = new three_1.Geometry();
        let yleft = new three_1.Geometry();
        let yright = new three_1.Geometry();
        let smalllinegeometry = new three_1.Geometry();
        let rangex = scalex.range([-deltax / 2, deltax / 2]);
        let ticksx = rangex.ticks(4);
        for (let i of ticksx) {
            smalllinegeometry.vertices.push(new three_1.Vector3(rangex(i), deltay / -2, 0), new three_1.Vector3(rangex(i), deltay / 2, 0));
            xtop.vertices.push(new three_1.Vector3(rangex(i), deltay / 2, 0));
            xbottom.vertices.push(new three_1.Vector3(rangex(i), deltay / -2, 0));
        }
        let rangey = scaley.range([-deltay / 2, deltay / 2]);
        let ticksy = rangey.ticks(4);
        for (let i of ticksy) {
            smalllinegeometry.vertices.push(new three_1.Vector3(-deltax / 2, rangey(i), 0), new three_1.Vector3(deltax / 2, rangey(i), 0));
            yleft.vertices.push(new three_1.Vector3(-deltax / 2, rangey(i), 0));
            yright.vertices.push(new three_1.Vector3(deltax / 2, rangey(i), 0));
        }
        let line = new three_1.LineSegments(smalllinegeometry, smalllinematerial);
        planeback.add(line);
        const invi = new three_1.Material();
        invi.visible = false;
        const xt = new three_1.Points(xtop, invi);
        xt.name = "xtop";
        xt.userData = ticksx;
        const xb = new three_1.Points(xbottom, invi);
        xb.name = 'xbottom';
        xb.userData = ticksx;
        const yl = new three_1.Points(yleft, invi);
        yl.name = 'yleft';
        yl.userData = ticksy;
        const yr = new three_1.Points(yright, invi);
        yr.name = 'yright';
        yr.userData = ticksy;
        let count = 0;
        planeback.add(yl, yr);
        if (xy) {
            planeback.add(xt, xb);
        }
        let planefront = planeback.clone();
        planefront.position.copy(posfront);
        return [planeback, planefront];
    }
    const scaledelta = 7;
    /**
     *
     * generate the label for the y-axis. Take in all the side planes
     *
     */
    function addyaxis(therest, scaleFactor, title = "y") {
        var invert = (1 / scaledelta) / scaleFactor;
        for (let i of therest) {
            const yl = i.getObjectByName("yleft");
            const yr = i.getObjectByName("yright");
            const lengtyl = yl.geometry.vertices.length;
            const lengthyr = yr.geometry.vertices.length;
            let count = 0;
            let tick = yl.userData;
            let average = new three_1.Vector3();
            for (let r of yl.geometry.vertices) {
                const sprite = texthelper_1.makeTextSprite(tick[count], { scaleFactor: scaleFactor });
                sprite.position.copy(r).add(new three_1.Vector3(-0.4, 0, 0).multiplyScalar(invert));
                average.add(sprite.position);
                yl.add(sprite);
                count++;
            }
            average.multiplyScalar(1 / lengtyl).add(new three_1.Vector3(-0.4, 0, 0).multiplyScalar(invert));
            let sprite = texthelper_1.makeTextSprite(title, { scaleFactor: scaleFactor });
            sprite.position.copy(average);
            yl.add(sprite);
            average = new three_1.Vector3();
            count = 0;
            for (let r of yr.geometry.vertices) {
                const sprite = texthelper_1.makeTextSprite(tick[count], { scaleFactor: scaleFactor });
                sprite.position.copy(r).add(new three_1.Vector3(0.4, 0, 0).multiplyScalar(invert));
                average.add(sprite.position);
                yr.add(sprite);
                count++;
            }
            average.multiplyScalar(1 / lengthyr).add(new three_1.Vector3(0.4, 0, 0).multiplyScalar(invert));
            sprite = texthelper_1.makeTextSprite(title, { scaleFactor: scaleFactor });
            sprite.position.copy(average);
            yr.add(sprite);
        }
    }
    PlaneHelper.addyaxis = addyaxis;
    /**
     *
     * generate label for the x and z axis. Take in the top and bottom plane
     *
     */
    function addxzaxis(topbottom, scaleFactor, title = { x: 'x', z: 'z' }) {
        const invert = (1 / scaledelta) / scaleFactor;
        let averageOut = (average, length, offset, title) => {
            average.multiplyScalar(1 / length).add(offset.multiplyScalar(invert));
            let sprite = texthelper_1.makeTextSprite(title, { scaleFactor: scaleFactor });
            sprite.position.copy(average);
            return sprite;
        };
        let direction = -1;
        for (let i of topbottom) {
            const xt = i.getObjectByName("xtop");
            const xb = i.getObjectByName("xbottom");
            const lengtxt = xt.geometry.vertices.length;
            const lengthxb = xb.geometry.vertices.length;
            const ticksx = xt.userData;
            let average = new three_1.Vector3();
            let offset = new three_1.Vector3(0, 0.3, 0.3 * direction);
            let count = 0;
            for (let r of xt.geometry.vertices) {
                const sprite = texthelper_1.makeTextSprite(ticksx[count], { scaleFactor: scaleFactor });
                sprite.position.copy(r).add(offset.clone().multiplyScalar(invert));
                xt.add(sprite);
                average.add(sprite.position);
                count++;
            }
            let sprite = averageOut(average, lengtxt, offset, title.x);
            xt.add(sprite);
            count = 0;
            average = new three_1.Vector3();
            offset = new three_1.Vector3(0, -0.3, 0.3 * direction);
            for (let r of xb.geometry.vertices) {
                const sprite = texthelper_1.makeTextSprite(ticksx[count], { scaleFactor: scaleFactor });
                sprite.position.copy(r).add(offset.clone().multiplyScalar(invert));
                xb.add(sprite);
                average.add(sprite.position);
                count++;
            }
            sprite = averageOut(average, lengthxb, offset, title.x);
            xb.add(sprite);
            const yl = i.getObjectByName("yleft");
            const yr = i.getObjectByName("yright");
            const lengtyl = yl.geometry.vertices.length;
            const lengthyr = yr.geometry.vertices.length;
            count = 0;
            const ticksy = yl.userData;
            average = new three_1.Vector3();
            offset = new three_1.Vector3(-0.3, 0, 0.3 * direction);
            for (let r of yl.geometry.vertices) {
                const sprite = texthelper_1.makeTextSprite(ticksy[count], { scaleFactor: scaleFactor });
                sprite.position.copy(r).add(offset.clone().multiplyScalar(invert));
                average.add(sprite.position);
                yl.add(sprite);
                count++;
            }
            sprite = averageOut(average, lengtyl, offset, title.z);
            yl.add(sprite);
            count = 0;
            average = new three_1.Vector3();
            offset = new three_1.Vector3(0.3, 0, 0.3 * direction);
            for (let r of yr.geometry.vertices) {
                const sprite = texthelper_1.makeTextSprite(ticksy[count], { scaleFactor: scaleFactor });
                sprite.position.copy(r).add(offset.clone().multiplyScalar(invert));
                yr.add(sprite);
                average.add(sprite.position);
                count++;
            }
            sprite = averageOut(average, lengthyr, offset, title.z);
            yr.add(sprite);
            direction = 1;
        }
    }
    PlaneHelper.addxzaxis = addxzaxis;
})(PlaneHelper = exports.PlaneHelper || (exports.PlaneHelper = {}));
