"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const three_1 = require("three");
const texthelper_1 = require("./texthelper");
var EventHelper;
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
                let mouse = new three_1.Vector2();
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
                let raycaster = new three_1.Raycaster();
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
                    const sprite = texthelper_1.makeTextSprite(`x:${data.x}, y:${data.y}, z:${data.z}`, { fontsize: 12, scaleFactor: this.graph.scaleFactor, depthTest: false });
                    sprite.position.add(new three_1.Vector3(0, 0.2, 0));
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
                        this.prevPos = new three_1.Vector2(e.touches[0].clientX, e.touches[0].clientY);
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
                    this.prevPos = new three_1.Vector2(e.touches[0].clientX, e.touches[0].clientY);
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
})(EventHelper = exports.EventHelper || (exports.EventHelper = {}));
