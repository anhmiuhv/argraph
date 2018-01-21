(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('three'), require('d3-scale')) :
	typeof define === 'function' && define.amd ? define(['exports', 'three', 'd3-scale'], factory) :
	(factory((global['three-ar'] = {}),global.THREE,global.d3Scale));
}(this, (function (exports,three,d3Scale) { 'use strict';

const DELTA_SCALEFACTOR = 11;
/**
 * Generate a sprite with text specified in the message
 * @param message the text
 * @param parameters the text graphical options
 * 	Supported fields: "fontface", "fontsize", "scaleFactor", "depthTest"
 */
function makeTextSprite(message, parameters = {}) {
    if (parameters === undefined)
        parameters = {};
    var fontface = parameters.hasOwnProperty("fontface") ?
        parameters["fontface"] : "Arial";
    var fontsize = parameters.hasOwnProperty("fontsize") ?
        parameters["fontsize"] : 23;
    var borderThickness = parameters.hasOwnProperty("borderThickness") ?
        parameters["borderThickness"] : 4;
    var borderColor = parameters.hasOwnProperty("borderColor") ?
        parameters["borderColor"] : { r: 255, g: 255, b: 255, a: 1.0 };
    var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
        parameters["backgroundColor"] : { r: 255, g: 255, b: 255, a: 1.0 };
    var scaleFactor = parameters.hasOwnProperty("scaleFactor") ?
        parameters["scaleFactor"] : 1;
    var depthTest = parameters.hasOwnProperty("depthTest") ?
        parameters["depthTest"] : true;
    var canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    var context = canvas.getContext('2d');
    context.font = "Normal " + fontsize + "px " + fontface;
    // get size data (height depends only on font size)
    var metrics = context.measureText(message);
    // background color
    // border color
    context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
        + borderColor.b + "," + borderColor.a + ")";
    context.lineWidth = borderThickness;
    // 1.4 is extra height factor for text below baseline: g,j,p,q.
    // text color
    context.fillStyle = "rgba(255, 255, 255, 1.0)";
    context.textAlign = 'center';
    context.fillText(message, canvas.width / 2, canvas.height / 2);
    // canvas contents will be used for a texture
    var texture = new three.CanvasTexture(canvas);
    var spriteMaterial = new three.SpriteMaterial({ map: texture });
    spriteMaterial.depthTest = depthTest;
    var sprite = new three.Sprite(spriteMaterial);
    sprite.scale.set((1 / DELTA_SCALEFACTOR) / scaleFactor, (1 / DELTA_SCALEFACTOR) / scaleFactor, 1);
    return sprite;
}
var PIXEL_RATIO = (function () {
    var ctx = document.createElement("canvas").getContext("2d"), dpr = window.devicePixelRatio || 1, bsr = ctx.webkitBackingStorePixelRatio ||
        ctx.mozBackingStorePixelRatio ||
        ctx.msBackingStorePixelRatio ||
        ctx.oBackingStorePixelRatio ||
        ctx.backingStorePixelRatio || 1;
    return dpr / bsr;
})();

/**
 * The 3D graph object
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
            return new three.Vector3(this.scalez(v.z), this.scaley(v.y), this.scalex(v.x));
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

(function (PlaneHelper) {
    /**
     * Generate Graph from graph info
     * @param graphinfo The GraphInfo
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
        var graph = new three.Group();
        const threshold = 1.5;
        //do scaling ticks
        let scalex = d3Scale.scaleLinear().domain([lowx, highx]);
        let scaley = d3Scale.scaleLinear().domain([lowy, highy]);
        let scalez = d3Scale.scaleLinear().domain([lowz, highz]);
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
        let right = new three.Vector3(deltaz / 2, 0, 0);
        let left = new three.Vector3(-deltaz / 2, 0, 0);
        let rl = generatePlane(deltax, deltay, scalex, scaley, right, left, false);
        const planeright = rl[0];
        const planeleft = rl[1];
        rl.forEach(function (e) {
            e.rotation.y = -Math.PI / 2;
        });
        graph.add(...rl);
        let top = new three.Vector3(0, deltay / -2, 0);
        let bottom = new three.Vector3(0, deltay / 2, 0);
        let tb = generatePlane(deltaz, deltax, scalez, scalex, top, bottom, true);
        const planetop = tb[0];
        planetop.name = 'planetop';
        const planebottom = tb[1];
        planebottom.name = 'planebottom';
        tb.forEach(function (e) {
            e.rotation.x = Math.PI / 2;
        });
        graph.add(...tb);
        let front = new three.Vector3(0, 0, deltax / 2);
        let back = new three.Vector3(0, 0, -deltax / 2);
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
     * generate plane helper
     * @param deltax how big it is on x axis
     * @param deltay how big it is on y axis
     * @param scalex the d3 scale object for x axis
     * @param scaley the d3 scale object for y axis
     * @param posfront position of one plane
     * @param posback position of other plane
     * @param xy If this is the top and bottom plane
     */
    function generatePlane(deltax, deltay, scalex, scaley, posfront, posback, xy) {
        const material = new three.MeshBasicMaterial({ color: 0x0074D9, transparent: true, opacity: 0.3, side: three.DoubleSide });
        let geometry = new three.PlaneGeometry(deltax, deltay);
        let planeback = new three.Group();
        planeback.add(new three.Mesh(geometry, material));
        planeback.position.copy(posback);
        let smalllinematerial = new three.LineBasicMaterial({
            color: 0xffffff,
            linewidth: 1
        });
        //Point of the axis
        let xtop = new three.Geometry();
        let xbottom = new three.Geometry();
        let yleft = new three.Geometry();
        let yright = new three.Geometry();
        let smalllinegeometry = new three.Geometry();
        let rangex = scalex.range([-deltax / 2, deltax / 2]);
        let ticksx = rangex.ticks(4);
        for (let i of ticksx) {
            smalllinegeometry.vertices.push(new three.Vector3(rangex(i), deltay / -2, 0), new three.Vector3(rangex(i), deltay / 2, 0));
            xtop.vertices.push(new three.Vector3(rangex(i), deltay / 2, 0));
            xbottom.vertices.push(new three.Vector3(rangex(i), deltay / -2, 0));
        }
        let rangey = scaley.range([-deltay / 2, deltay / 2]);
        let ticksy = rangey.ticks(4);
        for (let i of ticksy) {
            smalllinegeometry.vertices.push(new three.Vector3(-deltax / 2, rangey(i), 0), new three.Vector3(deltax / 2, rangey(i), 0));
            yleft.vertices.push(new three.Vector3(-deltax / 2, rangey(i), 0));
            yright.vertices.push(new three.Vector3(deltax / 2, rangey(i), 0));
        }
        let line = new three.LineSegments(smalllinegeometry, smalllinematerial);
        planeback.add(line);
        const invi = new three.Material();
        invi.visible = false;
        const xt = new three.Points(xtop, invi);
        xt.name = "xtop";
        xt.userData = ticksx;
        const xb = new three.Points(xbottom, invi);
        xb.name = 'xbottom';
        xb.userData = ticksx;
        const yl = new three.Points(yleft, invi);
        yl.name = 'yleft';
        yl.userData = ticksy;
        const yr = new three.Points(yright, invi);
        yr.name = 'yright';
        yr.userData = ticksy;
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
     * Add axis to the graph
     * @param graph the graph
     * @param title title, default to 'x, 'y', 'z'
     */
    function addaxis(graph, title = { x: 'x', y: 'y', z: 'z' }) {
        addyaxis(graph.therest(), graph.scaleFactor, title.y);
        addxzaxis(graph.topbottom(), graph.scaleFactor, title);
    }
    PlaneHelper.addaxis = addaxis;
    /**
     * Add the y axis to the graph plane
     * @param therest the y axis graph plane
     * @param scaleFactor the scale factor of the graph object
     * @param title
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
            let average = new three.Vector3();
            for (let r of yl.geometry.vertices) {
                const sprite = makeTextSprite(tick[count], { scaleFactor: scaleFactor });
                sprite.position.copy(r).add(new three.Vector3(-0.4, 0, 0).multiplyScalar(invert));
                average.add(sprite.position);
                yl.add(sprite);
                count++;
            }
            average.multiplyScalar(1 / lengtyl).add(new three.Vector3(-0.4, 0, 0).multiplyScalar(invert));
            let sprite = makeTextSprite(title, { scaleFactor: scaleFactor });
            sprite.position.copy(average);
            yl.add(sprite);
            average = new three.Vector3();
            count = 0;
            for (let r of yr.geometry.vertices) {
                const sprite = makeTextSprite(tick[count], { scaleFactor: scaleFactor });
                sprite.position.copy(r).add(new three.Vector3(0.4, 0, 0).multiplyScalar(invert));
                average.add(sprite.position);
                yr.add(sprite);
                count++;
            }
            average.multiplyScalar(1 / lengthyr).add(new three.Vector3(0.4, 0, 0).multiplyScalar(invert));
            sprite = makeTextSprite(title, { scaleFactor: scaleFactor });
            sprite.position.copy(average);
            yr.add(sprite);
        }
    }
    /**
     * Add the x and z axis to the graph plane
     * @param topbottom the topbottom axis plane
     * @param scaleFactor the scale factor of the graph object
     * @param title the title for x and z axis
     */
    function addxzaxis(topbottom, scaleFactor, title = { x: 'x', z: 'z' }) {
        const invert = (1 / scaledelta) / scaleFactor;
        let averageOut = (average, length, offset, title) => {
            average.multiplyScalar(1 / length).add(offset.multiplyScalar(invert));
            let sprite = makeTextSprite(title, { scaleFactor: scaleFactor });
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
            let average = new three.Vector3();
            let offset = new three.Vector3(0, 0.3, 0.3 * direction);
            let count = 0;
            for (let r of xt.geometry.vertices) {
                const sprite = makeTextSprite(ticksx[count], { scaleFactor: scaleFactor });
                sprite.position.copy(r).add(offset.clone().multiplyScalar(invert));
                xt.add(sprite);
                average.add(sprite.position);
                count++;
            }
            let sprite = averageOut(average, lengtxt, offset, title.x);
            xt.add(sprite);
            count = 0;
            average = new three.Vector3();
            offset = new three.Vector3(0, -0.3, 0.3 * direction);
            for (let r of xb.geometry.vertices) {
                const sprite = makeTextSprite(ticksx[count], { scaleFactor: scaleFactor });
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
            average = new three.Vector3();
            offset = new three.Vector3(-0.3, 0, 0.3 * direction);
            for (let r of yl.geometry.vertices) {
                const sprite = makeTextSprite(ticksy[count], { scaleFactor: scaleFactor });
                sprite.position.copy(r).add(offset.clone().multiplyScalar(invert));
                average.add(sprite.position);
                yl.add(sprite);
                count++;
            }
            sprite = averageOut(average, lengtyl, offset, title.z);
            yl.add(sprite);
            count = 0;
            average = new three.Vector3();
            offset = new three.Vector3(0.3, 0, 0.3 * direction);
            for (let r of yr.geometry.vertices) {
                const sprite = makeTextSprite(ticksy[count], { scaleFactor: scaleFactor });
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
})(exports.PlaneHelper || (exports.PlaneHelper = {}));

/**
 * Scatterplot info class
 */
class GraphInfo {
    constructor(data) {
        this.vertices = data.map((d) => {
            return d.clone();
        });
        this.lowx = this.lowy = this.lowz = 2000000000;
        this.highx = this.highy = this.highz = -2000000000;
        for (let i of this.vertices) {
            this.lowx = Math.min(this.lowx, i.x);
            this.lowy = Math.min(this.lowy, i.y);
            this.lowz = Math.min(this.lowz, i.z);
            this.highx = Math.max(this.highx, i.x);
            this.highy = Math.max(this.highy, i.y);
            this.highz = Math.max(this.highz, i.z);
        }
        if (this.highx === this.lowx) {
            this.highx += 1;
            this.lowx -= 1;
        }
        if (this.highy === this.lowy) {
            this.highy += 1;
            this.lowy -= 1;
        }
        if (this.highz === this.lowz) {
            this.highz += 1;
            this.lowz -= 1;
        }
    }
    getAllLimits() {
        return [this.lowx, this.highx, this.lowy, this.highy, this.lowz, this.highz];
    }
    scaler(value, axis = exports.Axis.x) {
        switch (axis) {
            case exports.Axis.x:
                return d3Scale.scaleLinear().domain([this.lowx, this.highx]).range([0, 1])(value);
            case exports.Axis.y:
                return d3Scale.scaleLinear().domain([this.lowy, this.highy]).range([0, 1])(value);
            case exports.Axis.z:
                return d3Scale.scaleLinear().domain([this.lowz, this.highz]).range([0, 1])(value);
            default:
                return d3Scale.scaleLinear().domain([this.lowx, this.highx]).range([0, 1])(value);
        }
    }
}
/**
 * Surface plot info object
 */
class SurfaceInfo extends GraphInfo {
    /**
     * create a surface info object from height map matrix
     * @param surface height map matrix
     */
    constructor(surface) {
        var data = [];
        for (let x = 0; x < surface.length; x++) {
            for (let y = 0; y < surface[0].length; y++) {
                data.push(new three.Vector3(y, surface[x][y], x));
            }
        }
        super(data);
        this.height = surface.length;
        this.width = surface[0].length;
    }
}

(function (Axis) {
    Axis[Axis["x"] = 0] = "x";
    Axis[Axis["y"] = 1] = "y";
    Axis[Axis["z"] = 2] = "z";
})(exports.Axis || (exports.Axis = {}));

var colorScale={
	"jet":[{"index":0,"rgb":[0,0,131]},{"index":0.125,"rgb":[0,60,170]},{"index":0.375,"rgb":[5,255,255]},{"index":0.625,"rgb":[255,255,0]},{"index":0.875,"rgb":[250,0,0]},{"index":1,"rgb":[128,0,0]}],

	"hsv":[{"index":0,"rgb":[255,0,0]},{"index":0.169,"rgb":[253,255,2]},{"index":0.173,"rgb":[247,255,2]},{"index":0.337,"rgb":[0,252,4]},{"index":0.341,"rgb":[0,252,10]},{"index":0.506,"rgb":[1,249,255]},{"index":0.671,"rgb":[2,0,253]},{"index":0.675,"rgb":[8,0,253]},{"index":0.839,"rgb":[255,0,251]},{"index":0.843,"rgb":[255,0,245]},{"index":1,"rgb":[255,0,6]}],

	"hot":[{"index":0,"rgb":[0,0,0]},{"index":0.3,"rgb":[230,0,0]},{"index":0.6,"rgb":[255,210,0]},{"index":1,"rgb":[255,255,255]}],

	"cool":[{"index":0,"rgb":[0,255,255]},{"index":1,"rgb":[255,0,255]}],

	"spring":[{"index":0,"rgb":[255,0,255]},{"index":1,"rgb":[255,255,0]}],

	"summer":[{"index":0,"rgb":[0,128,102]},{"index":1,"rgb":[255,255,102]}],

	"autumn":[{"index":0,"rgb":[255,0,0]},{"index":1,"rgb":[255,255,0]}],

	"winter":[{"index":0,"rgb":[0,0,255]},{"index":1,"rgb":[0,255,128]}],

	"bone":[{"index":0,"rgb":[0,0,0]},{"index":0.376,"rgb":[84,84,116]},{"index":0.753,"rgb":[169,200,200]},{"index":1,"rgb":[255,255,255]}],

	"copper":[{"index":0,"rgb":[0,0,0]},{"index":0.804,"rgb":[255,160,102]},{"index":1,"rgb":[255,199,127]}],

	"greys":[{"index":0,"rgb":[0,0,0]},{"index":1,"rgb":[255,255,255]}],

	"yignbu":[{"index":0,"rgb":[8,29,88]},{"index":0.125,"rgb":[37,52,148]},{"index":0.25,"rgb":[34,94,168]},{"index":0.375,"rgb":[29,145,192]},{"index":0.5,"rgb":[65,182,196]},{"index":0.625,"rgb":[127,205,187]},{"index":0.75,"rgb":[199,233,180]},{"index":0.875,"rgb":[237,248,217]},{"index":1,"rgb":[255,255,217]}],

	"greens":[{"index":0,"rgb":[0,68,27]},{"index":0.125,"rgb":[0,109,44]},{"index":0.25,"rgb":[35,139,69]},{"index":0.375,"rgb":[65,171,93]},{"index":0.5,"rgb":[116,196,118]},{"index":0.625,"rgb":[161,217,155]},{"index":0.75,"rgb":[199,233,192]},{"index":0.875,"rgb":[229,245,224]},{"index":1,"rgb":[247,252,245]}],

	"yiorrd":[{"index":0,"rgb":[128,0,38]},{"index":0.125,"rgb":[189,0,38]},{"index":0.25,"rgb":[227,26,28]},{"index":0.375,"rgb":[252,78,42]},{"index":0.5,"rgb":[253,141,60]},{"index":0.625,"rgb":[254,178,76]},{"index":0.75,"rgb":[254,217,118]},{"index":0.875,"rgb":[255,237,160]},{"index":1,"rgb":[255,255,204]}],

	"bluered":[{"index":0,"rgb":[0,0,255]},{"index":1,"rgb":[255,0,0]}],

	"rdbu":[{"index":0,"rgb":[5,10,172]},{"index":0.35,"rgb":[106,137,247]},{"index":0.5,"rgb":[190,190,190]},{"index":0.6,"rgb":[220,170,132]},{"index":0.7,"rgb":[230,145,90]},{"index":1,"rgb":[178,10,28]}],

	"picnic":[{"index":0,"rgb":[0,0,255]},{"index":0.1,"rgb":[51,153,255]},{"index":0.2,"rgb":[102,204,255]},{"index":0.3,"rgb":[153,204,255]},{"index":0.4,"rgb":[204,204,255]},{"index":0.5,"rgb":[255,255,255]},{"index":0.6,"rgb":[255,204,255]},{"index":0.7,"rgb":[255,153,255]},{"index":0.8,"rgb":[255,102,204]},{"index":0.9,"rgb":[255,102,102]},{"index":1,"rgb":[255,0,0]}],

	"rainbow":[{"index":0,"rgb":[150,0,90]},{"index":0.125,"rgb":[0,0,200]},{"index":0.25,"rgb":[0,25,255]},{"index":0.375,"rgb":[0,152,255]},{"index":0.5,"rgb":[44,255,150]},{"index":0.625,"rgb":[151,255,0]},{"index":0.75,"rgb":[255,234,0]},{"index":0.875,"rgb":[255,111,0]},{"index":1,"rgb":[255,0,0]}],

	"portland":[{"index":0,"rgb":[12,51,131]},{"index":0.25,"rgb":[10,136,186]},{"index":0.5,"rgb":[242,211,56]},{"index":0.75,"rgb":[242,143,56]},{"index":1,"rgb":[217,30,30]}],

	"blackbody":[{"index":0,"rgb":[0,0,0]},{"index":0.2,"rgb":[230,0,0]},{"index":0.4,"rgb":[230,210,0]},{"index":0.7,"rgb":[255,255,255]},{"index":1,"rgb":[160,200,255]}],

	"earth":[{"index":0,"rgb":[0,0,130]},{"index":0.1,"rgb":[0,180,180]},{"index":0.2,"rgb":[40,210,40]},{"index":0.4,"rgb":[230,230,50]},{"index":0.6,"rgb":[120,70,20]},{"index":1,"rgb":[255,255,255]}],

	"electric":[{"index":0,"rgb":[0,0,0]},{"index":0.15,"rgb":[30,0,100]},{"index":0.4,"rgb":[120,0,100]},{"index":0.6,"rgb":[160,90,0]},{"index":0.8,"rgb":[230,200,0]},{"index":1,"rgb":[255,250,220]}],

	"alpha": [{"index":0, "rgb": [255,255,255,0]},{"index":1, "rgb": [255,255,255,1]}],

	"viridis": [{"index":0,"rgb":[68,1,84]},{"index":0.13,"rgb":[71,44,122]},{"index":0.25,"rgb":[59,81,139]},{"index":0.38,"rgb":[44,113,142]},{"index":0.5,"rgb":[33,144,141]},{"index":0.63,"rgb":[39,173,129]},{"index":0.75,"rgb":[92,200,99]},{"index":0.88,"rgb":[170,220,50]},{"index":1,"rgb":[253,231,37]}],

	"inferno": [{"index":0,"rgb":[0,0,4]},{"index":0.13,"rgb":[31,12,72]},{"index":0.25,"rgb":[85,15,109]},{"index":0.38,"rgb":[136,34,106]},{"index":0.5,"rgb":[186,54,85]},{"index":0.63,"rgb":[227,89,51]},{"index":0.75,"rgb":[249,140,10]},{"index":0.88,"rgb":[249,201,50]},{"index":1,"rgb":[252,255,164]}],

	"magma": [{"index":0,"rgb":[0,0,4]},{"index":0.13,"rgb":[28,16,68]},{"index":0.25,"rgb":[79,18,123]},{"index":0.38,"rgb":[129,37,129]},{"index":0.5,"rgb":[181,54,122]},{"index":0.63,"rgb":[229,80,100]},{"index":0.75,"rgb":[251,135,97]},{"index":0.88,"rgb":[254,194,135]},{"index":1,"rgb":[252,253,191]}],

	"plasma": [{"index":0,"rgb":[13,8,135]},{"index":0.13,"rgb":[75,3,161]},{"index":0.25,"rgb":[125,3,168]},{"index":0.38,"rgb":[168,34,150]},{"index":0.5,"rgb":[203,70,121]},{"index":0.63,"rgb":[229,107,93]},{"index":0.75,"rgb":[248,148,65]},{"index":0.88,"rgb":[253,195,40]},{"index":1,"rgb":[240,249,33]}],

	"warm": [{"index":0,"rgb":[125,0,179]},{"index":0.13,"rgb":[172,0,187]},{"index":0.25,"rgb":[219,0,170]},{"index":0.38,"rgb":[255,0,130]},{"index":0.5,"rgb":[255,63,74]},{"index":0.63,"rgb":[255,123,0]},{"index":0.75,"rgb":[234,176,0]},{"index":0.88,"rgb":[190,228,0]},{"index":1,"rgb":[147,255,0]}],

	"cool": [{"index":0,"rgb":[125,0,179]},{"index":0.13,"rgb":[116,0,218]},{"index":0.25,"rgb":[98,74,237]},{"index":0.38,"rgb":[68,146,231]},{"index":0.5,"rgb":[0,204,197]},{"index":0.63,"rgb":[0,247,146]},{"index":0.75,"rgb":[0,255,88]},{"index":0.88,"rgb":[40,255,8]},{"index":1,"rgb":[147,255,0]}],

	"rainbow-soft": [{"index":0,"rgb":[125,0,179]},{"index":0.1,"rgb":[199,0,180]},{"index":0.2,"rgb":[255,0,121]},{"index":0.3,"rgb":[255,108,0]},{"index":0.4,"rgb":[222,194,0]},{"index":0.5,"rgb":[150,255,0]},{"index":0.6,"rgb":[0,255,55]},{"index":0.7,"rgb":[0,246,150]},{"index":0.8,"rgb":[50,167,222]},{"index":0.9,"rgb":[103,51,235]},{"index":1,"rgb":[124,0,186]}],

	"bathymetry": [{"index":0,"rgb":[40,26,44]},{"index":0.13,"rgb":[59,49,90]},{"index":0.25,"rgb":[64,76,139]},{"index":0.38,"rgb":[63,110,151]},{"index":0.5,"rgb":[72,142,158]},{"index":0.63,"rgb":[85,174,163]},{"index":0.75,"rgb":[120,206,163]},{"index":0.88,"rgb":[187,230,172]},{"index":1,"rgb":[253,254,204]}],

	"cdom": [{"index":0,"rgb":[47,15,62]},{"index":0.13,"rgb":[87,23,86]},{"index":0.25,"rgb":[130,28,99]},{"index":0.38,"rgb":[171,41,96]},{"index":0.5,"rgb":[206,67,86]},{"index":0.63,"rgb":[230,106,84]},{"index":0.75,"rgb":[242,149,103]},{"index":0.88,"rgb":[249,193,135]},{"index":1,"rgb":[254,237,176]}],

	"chlorophyll": [{"index":0,"rgb":[18,36,20]},{"index":0.13,"rgb":[25,63,41]},{"index":0.25,"rgb":[24,91,59]},{"index":0.38,"rgb":[13,119,72]},{"index":0.5,"rgb":[18,148,80]},{"index":0.63,"rgb":[80,173,89]},{"index":0.75,"rgb":[132,196,122]},{"index":0.88,"rgb":[175,221,162]},{"index":1,"rgb":[215,249,208]}],

	"density": [{"index":0,"rgb":[54,14,36]},{"index":0.13,"rgb":[89,23,80]},{"index":0.25,"rgb":[110,45,132]},{"index":0.38,"rgb":[120,77,178]},{"index":0.5,"rgb":[120,113,213]},{"index":0.63,"rgb":[115,151,228]},{"index":0.75,"rgb":[134,185,227]},{"index":0.88,"rgb":[177,214,227]},{"index":1,"rgb":[230,241,241]}],

	"freesurface-blue": [{"index":0,"rgb":[30,4,110]},{"index":0.13,"rgb":[47,14,176]},{"index":0.25,"rgb":[41,45,236]},{"index":0.38,"rgb":[25,99,212]},{"index":0.5,"rgb":[68,131,200]},{"index":0.63,"rgb":[114,156,197]},{"index":0.75,"rgb":[157,181,203]},{"index":0.88,"rgb":[200,208,216]},{"index":1,"rgb":[241,237,236]}],

	"freesurface-red": [{"index":0,"rgb":[60,9,18]},{"index":0.13,"rgb":[100,17,27]},{"index":0.25,"rgb":[142,20,29]},{"index":0.38,"rgb":[177,43,27]},{"index":0.5,"rgb":[192,87,63]},{"index":0.63,"rgb":[205,125,105]},{"index":0.75,"rgb":[216,162,148]},{"index":0.88,"rgb":[227,199,193]},{"index":1,"rgb":[241,237,236]}],

	"oxygen": [{"index":0,"rgb":[64,5,5]},{"index":0.13,"rgb":[106,6,15]},{"index":0.25,"rgb":[144,26,7]},{"index":0.38,"rgb":[168,64,3]},{"index":0.5,"rgb":[188,100,4]},{"index":0.63,"rgb":[206,136,11]},{"index":0.75,"rgb":[220,174,25]},{"index":0.88,"rgb":[231,215,44]},{"index":1,"rgb":[248,254,105]}],

	"par": [{"index":0,"rgb":[51,20,24]},{"index":0.13,"rgb":[90,32,35]},{"index":0.25,"rgb":[129,44,34]},{"index":0.38,"rgb":[159,68,25]},{"index":0.5,"rgb":[182,99,19]},{"index":0.63,"rgb":[199,134,22]},{"index":0.75,"rgb":[212,171,35]},{"index":0.88,"rgb":[221,210,54]},{"index":1,"rgb":[225,253,75]}],

	"phase": [{"index":0,"rgb":[145,105,18]},{"index":0.13,"rgb":[184,71,38]},{"index":0.25,"rgb":[186,58,115]},{"index":0.38,"rgb":[160,71,185]},{"index":0.5,"rgb":[110,97,218]},{"index":0.63,"rgb":[50,123,164]},{"index":0.75,"rgb":[31,131,110]},{"index":0.88,"rgb":[77,129,34]},{"index":1,"rgb":[145,105,18]}],

	"salinity": [{"index":0,"rgb":[42,24,108]},{"index":0.13,"rgb":[33,50,162]},{"index":0.25,"rgb":[15,90,145]},{"index":0.38,"rgb":[40,118,137]},{"index":0.5,"rgb":[59,146,135]},{"index":0.63,"rgb":[79,175,126]},{"index":0.75,"rgb":[120,203,104]},{"index":0.88,"rgb":[193,221,100]},{"index":1,"rgb":[253,239,154]}],

	"temperature": [{"index":0,"rgb":[4,35,51]},{"index":0.13,"rgb":[23,51,122]},{"index":0.25,"rgb":[85,59,157]},{"index":0.38,"rgb":[129,79,143]},{"index":0.5,"rgb":[175,95,130]},{"index":0.63,"rgb":[222,112,101]},{"index":0.75,"rgb":[249,146,66]},{"index":0.88,"rgb":[249,196,65]},{"index":1,"rgb":[232,250,91]}],

	"turbidity": [{"index":0,"rgb":[34,31,27]},{"index":0.13,"rgb":[65,50,41]},{"index":0.25,"rgb":[98,69,52]},{"index":0.38,"rgb":[131,89,57]},{"index":0.5,"rgb":[161,112,59]},{"index":0.63,"rgb":[185,140,66]},{"index":0.75,"rgb":[202,174,88]},{"index":0.88,"rgb":[216,209,126]},{"index":1,"rgb":[233,246,171]}],

	"velocity-blue": [{"index":0,"rgb":[17,32,64]},{"index":0.13,"rgb":[35,52,116]},{"index":0.25,"rgb":[29,81,156]},{"index":0.38,"rgb":[31,113,162]},{"index":0.5,"rgb":[50,144,169]},{"index":0.63,"rgb":[87,173,176]},{"index":0.75,"rgb":[149,196,189]},{"index":0.88,"rgb":[203,221,211]},{"index":1,"rgb":[254,251,230]}],

	"velocity-green": [{"index":0,"rgb":[23,35,19]},{"index":0.13,"rgb":[24,64,38]},{"index":0.25,"rgb":[11,95,45]},{"index":0.38,"rgb":[39,123,35]},{"index":0.5,"rgb":[95,146,12]},{"index":0.63,"rgb":[152,165,18]},{"index":0.75,"rgb":[201,186,69]},{"index":0.88,"rgb":[233,216,137]},{"index":1,"rgb":[255,253,205]}],

	"cubehelix": [{"index":0,"rgb":[0,0,0]},{"index":0.07,"rgb":[22,5,59]},{"index":0.13,"rgb":[60,4,105]},{"index":0.2,"rgb":[109,1,135]},{"index":0.27,"rgb":[161,0,147]},{"index":0.33,"rgb":[210,2,142]},{"index":0.4,"rgb":[251,11,123]},{"index":0.47,"rgb":[255,29,97]},{"index":0.53,"rgb":[255,54,69]},{"index":0.6,"rgb":[255,85,46]},{"index":0.67,"rgb":[255,120,34]},{"index":0.73,"rgb":[255,157,37]},{"index":0.8,"rgb":[241,191,57]},{"index":0.87,"rgb":[224,220,93]},{"index":0.93,"rgb":[218,241,142]},{"index":1,"rgb":[227,253,198]}]
};

function lerp(v0, v1, t) {
    return v0*(1-t)+v1*t
}
var lerp_1 = lerp;

var colormap = createColormap;

function createColormap (spec) {
    /*
     * Default Options
     */
    var indicies, rgba, fromrgba, torgba,
        nsteps, cmap, colormap, format,
        nshades, colors, alpha, index, i;

    if ( !spec ) spec = {};

    nshades = (spec.nshades || 72) - 1;
    format = spec.format || 'hex';

    colormap = spec.colormap;
    if (!colormap) colormap = 'jet';

    if (typeof colormap === 'string') {
        colormap = colormap.toLowerCase();

        if (!colorScale[colormap]) {
            throw Error(colormap + ' not a supported colorscale');
        }

        cmap = colorScale[colormap];

    } else if (Array.isArray(colormap)) {
        cmap = colormap.slice();

    } else {
        throw Error('unsupported colormap option', colormap);
    }

    if (cmap.length > nshades) {
        throw new Error(
            colormap+' map requires nshades to be at least size '+cmap.length
        );
    }

    if (!Array.isArray(spec.alpha)) {

        if (typeof spec.alpha === 'number') {
            alpha = [spec.alpha, spec.alpha];

        } else {
            alpha = [1, 1];
        }

    } else if (spec.alpha.length !== 2) {
        alpha = [1, 1];

    } else {
        alpha = spec.alpha.slice();
    }

    // map index points from 0..1 to 0..n-1
    indicies = cmap.map(function(c) {
        return Math.round(c.index * nshades);
    });

    // Add alpha channel to the map
    alpha[0] = Math.min(Math.max(alpha[0], 0), 1);
    alpha[1] = Math.min(Math.max(alpha[1], 0), 1);

    var steps = cmap.map(function(c, i) {
        var index = cmap[i].index;

        var rgba = cmap[i].rgb.slice();

        // if user supplies their own map use it
        if (rgba.length === 4 && rgba[3] >= 0 && rgba[3] <= 1) {
            return rgba
        }
        rgba[3] = alpha[0] + (alpha[1] - alpha[0])*index;

        return rgba
    });


    /*
     * map increasing linear values between indicies to
     * linear steps in colorvalues
     */
    var colors = [];
    for (i = 0; i < indicies.length-1; ++i) {
        nsteps = indicies[i+1] - indicies[i];
        fromrgba = steps[i];
        torgba = steps[i+1];

        for (var j = 0; j < nsteps; j++) {
            var amt = j / nsteps;
            colors.push([
                Math.round(lerp_1(fromrgba[0], torgba[0], amt)),
                Math.round(lerp_1(fromrgba[1], torgba[1], amt)),
                Math.round(lerp_1(fromrgba[2], torgba[2], amt)),
                lerp_1(fromrgba[3], torgba[3], amt)
            ]);
        }
    }

    //add 1 step as last value
    colors.push(cmap[cmap.length - 1].rgb.concat(alpha[1]));

    if (format === 'hex') colors = colors.map( rgb2hex );
    else if (format === 'rgbaString') colors = colors.map( rgbaStr );
    else if (format === 'float') colors = colors.map( rgb2float );

    return colors;
}

function rgb2float (rgba) {
    return [
        rgba[0] / 255,
        rgba[1] / 255,
        rgba[2] / 255,
        rgba[3]
    ]
}

function rgb2hex (rgba) {
    var dig, hex = '#';
    for (var i = 0; i < 3; ++i) {
        dig = rgba[i];
        dig = dig.toString(16);
        hex += ('00' + dig).substr( dig.length );
    }
    return hex;
}

function rgbaStr (rgba) {
    return 'rgba(' + rgba.join(',') + ')';
}

var colormap_1 = colormap.createColormap;

(function (RenderHelper) {
    /**
     * Render sphere
     * @param scene scene object
     * @param graphinfo graph info object
     * @param graph graph object
     */
    function renderSphere(scene, graphinfo, graph) {
        var directionalLight = new three.DirectionalLight(0xffffff, 0.5);
        scene.add(directionalLight);
        var light = new three.AmbientLight(0x404040, 0.8); // soft white AmbientLight
        scene.add(light);
        var geometry = new three.SphereGeometry(0.015 / graph.scaleFactor, 20, 20, 0, Math.PI * 2, 0, Math.PI * 2);
        var material = new three.MeshLambertMaterial({ color: 0xd3d3d3 });
        let pos = graph.getVerticesForDisplay(graphinfo.vertices);
        var count = 0;
        for (let i of pos) {
            var mesh = new three.Mesh(geometry, material);
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
        let geometry = new three.BufferGeometry();
        const array = [].concat(...graph.getVerticesForDisplay(graphinfo.vertices).map((v) => {
            return v.toArray();
        }));
        geometry.addAttribute('position', new three.BufferAttribute(array, graphinfo.vertices.length));
        let mat = new three.PointsMaterial({ size: 0.05, color: 0x7FDBFF });
        let particles = new three.Points(geometry, mat);
        graph.graph.add(particles);
    }
    RenderHelper.renderPoints = renderPoints;
    /**
     * render a 3D surface plot with color
     * @param scene The Scene of you program
     * @param surfaceinfo The surface info
     * @param graph The Graph object in your scene
     * @param params Graphical params
     * Supported fields: "colormap"
     */
    function renderSurface(scene, surfaceinfo, graph, params = {}) {
        function getColor(hex) {
            var color = new three.Color(hex);
            return color;
        }
        var geometry = new three.Geometry();
        var colors = [];
        var height = surfaceinfo.height, width = surfaceinfo.width;
        let count = 0;
        let cmap = colormap_1({ colormap: params.colormap || "viridis", nshades: height * width });
        graph.getVerticesForDisplay(surfaceinfo.vertices).forEach(function (col) {
            geometry.vertices.push(col);
            let ratio = Math.round(surfaceinfo.scaler(surfaceinfo.vertices[count].y, exports.Axis.y) * cmap.length);
            colors.push(getColor(cmap[ratio]));
            count++;
        });
        var offset = function (x, y) {
            return x + y * width;
        };
        for (var x = 0; x < width - 1; x++) {
            for (var y = 0; y < height - 1; y++) {
                var vec0 = new three.Vector3(), vec1 = new three.Vector3(), n_vec = new three.Vector3();
                // one of two triangle polygons in one rectangle
                vec0.subVectors(geometry.vertices[offset(x, y)], geometry.vertices[offset(x + 1, y)]);
                vec1.subVectors(geometry.vertices[offset(x, y)], geometry.vertices[offset(x, y + 1)]);
                n_vec.crossVectors(vec0, vec1).normalize();
                geometry.faces.push(new three.Face3(offset(x, y), offset(x + 1, y), offset(x, y + 1), n_vec, [colors[offset(x, y)], colors[offset(x + 1, y)], colors[offset(x, y + 1)]]));
                geometry.faces.push(new three.Face3(offset(x, y), offset(x, y + 1), offset(x + 1, y), n_vec.negate(), [colors[offset(x, y)], colors[offset(x, y + 1)], colors[offset(x + 1, y)]]));
                // the other one
                vec0.subVectors(geometry.vertices[offset(x + 1, y)], geometry.vertices[offset(x + 1, y + 1)]);
                vec1.subVectors(geometry.vertices[offset(x, y + 1)], geometry.vertices[offset(x + 1, y + 1)]);
                n_vec.crossVectors(vec0, vec1).normalize();
                geometry.faces.push(new three.Face3(offset(x + 1, y), offset(x + 1, y + 1), offset(x, y + 1), n_vec, [colors[offset(x + 1, y)], colors[offset(x + 1, y + 1)], colors[offset(x, y + 1)]]));
                geometry.faces.push(new three.Face3(offset(x + 1, y), offset(x, y + 1), offset(x + 1, y + 1), n_vec.negate(), [colors[offset(x + 1, y)], colors[offset(x, y + 1)], colors[offset(x + 1, y + 1)]]));
            }
        }
        var material = new three.MeshLambertMaterial({ vertexColors: three.VertexColors });
        var mesh = new three.Mesh(geometry, material);
        graph.graph.add(mesh);
        const ligt = new three.AmbientLight("white");
        scene.add(ligt);
    }
    RenderHelper.renderSurface = renderSurface;
})(exports.RenderHelper || (exports.RenderHelper = {}));

(function (EventHelper) {
    /**
     * Event callback for graph. show the axis coordinates on the points
     */
    class GeneralThreeEvent {
        constructor(camera, graph) {
            this.camera = camera;
            this.graph = graph;
        }
        genrateOnTouch() {
            return (e) => {
                let mouse = new three.Vector2();
                if (!e.touches) {
                    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
                    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
                }
                else {
                    mouse.x = (e.touches[0].pageX / window.innerWidth) * 2 - 1;
                    mouse.y = -(e.touches[0].pageY / window.innerHeight) * 2 + 1;
                }
                let hideText = () => {
                    if (this.INTERSECTED)
                        this.INTERSECTED.children.length > 0 && (this.INTERSECTED.children[0].visible = false);
                };
                // find intersections
                let raycaster = new three.Raycaster();
                raycaster.setFromCamera(mouse, this.camera);
                let intersects = raycaster.intersectObjects(this.graph.graph.children);
                console.log(intersects);
                hideText();
                if (intersects.length > 0
                    && this.INTERSECTED != intersects[0].object && 'oriData' in intersects[0].object.userData) {
                    this.INTERSECTED = intersects[0].object;
                    const data = this.INTERSECTED.userData.oriData;
                    if (this.INTERSECTED.children.length > 0) {
                        this.INTERSECTED.children[0].visible = true;
                        return;
                    }
                    const sprite = makeTextSprite(`x:${data.x}, y:${data.y}, z:${data.z}`, { fontsize: 12, scaleFactor: this.graph.scaleFactor, depthTest: false });
                    sprite.position.add(new three.Vector3(0, 0.2, 0));
                    this.INTERSECTED.add(sprite);
                }
                else {
                    this.INTERSECTED = null;
                }
            };
        }
    }
    EventHelper.GeneralThreeEvent = GeneralThreeEvent;
    /**
     * Zoom functions for Augmented Reality graph. Extended from GeneralThreeEvent
     */
    class ZoomableThreeEvent {
        constructor(camera, graph) {
            this.camera = camera;
            this.graph = graph;
        }
        genrateOnTouch() {
            let generalCallback = new GeneralThreeEvent(this.camera, this.graph).genrateOnTouch();
            return (e) => {
                switch (e.touches.length) {
                    case 1:
                        generalCallback(e);
                        this.prevPos = new three.Vector2(e.touches[0].clientX, e.touches[0].clientY);
                        break;
                    case 2:
                        this.prevDiff = Math.pow(e.touches[0].clientX - e.touches[1].clientX, 2) + Math.pow(e.touches[0].clientY - e.touches[1].clientY, 2);
                        break;
                    default:
                        // code...
                        break;
                }
            };
        }
        generateOnMove() {
            return (e) => {
                if (e.touches.length == 1) {
                    var element = this.domElement === document ? this.domElement.body : this.domElement;
                    element = element || document.body;
                    let deltaX = Math.abs(e.touches[0].clientX - this.prevPos.x) / (element.clientWidth);
                    if (e.touches[0].clientX > this.prevPos.x) {
                        this.graph.graph.rotateY(100 / 180 * Math.PI * deltaX);
                    }
                    else {
                        this.graph.graph.rotateY(-100 / 180 * Math.PI * deltaX);
                    }
                    let deltaY = Math.abs(e.touches[0].clientY - this.prevPos.y) / (element.clientHeight);
                    if (e.touches[0].clientY > this.prevPos.y) {
                        this.graph.graph.translateY(-1 * deltaY);
                    }
                    else {
                        this.graph.graph.translateY(1 * deltaY);
                    }
                    this.prevPos = new three.Vector2(e.touches[0].clientX, e.touches[0].clientY);
                }
                if (e.touches.length == 2) {
                    // Calculate the distance between the two pointers
                    var curDiff = Math.pow(e.touches[0].clientX - e.touches[1].clientX, 2) + Math.pow(e.touches[0].clientY - e.touches[1].clientY, 2);
                    if (this.prevDiff > 0) {
                        if (curDiff > this.prevDiff) {
                            this.graph.graph.scale.multiplyScalar(1.05);
                        }
                        if (curDiff < this.prevDiff) {
                            // The distance between the two pointers has decreased
                            this.graph.graph.scale.multiplyScalar(0.95);
                        }
                    }
                    this.prevDiff = curDiff;
                }
            };
        }
        generateOnUp() {
            return (e) => {
            };
        }
    }
    EventHelper.ZoomableThreeEvent = ZoomableThreeEvent;
})(exports.EventHelper || (exports.EventHelper = {}));

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
})(exports.AnimationHelper || (exports.AnimationHelper = {}));

exports.Graph = Graph;
exports.makeTextSprite = makeTextSprite;
exports.GraphInfo = GraphInfo;
exports.SurfaceInfo = SurfaceInfo;

Object.defineProperty(exports, '__esModule', { value: true });

})));
