import { Mesh, Vector2, Raycaster, Camera, Vector3, Quaternion, Object3D } from 'three'
import {makeTextSprite} from './texthelper'
import { Graph } from "./planehelper"

export interface ThreeEvent extends Event {
  clientX: number;
  clientY: number;
  deltaY: number;
  button: THREE.MOUSE;
  touches: Array<Touch>;
  keyCode: number;
  pointerId: number;
}


export namespace EventHelper {
    export class GeneralThreeEvent {
        INTERSECTED: Mesh;
        camera: Camera;
        graph: Graph;

        constructor(camera: Camera, graph: Graph) {
            this.camera = camera;
            this.graph = graph;
        }

        genrateOnTouch(this: GeneralThreeEvent) {
            return (e: ThreeEvent) => {
                let mouse = new Vector2();
                
                if (!e.touches) {
                    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
                    mouse.y = - (e.clientY / window.innerHeight) * 2 + 1;
                } else {
                    mouse.x = (e.touches[0].pageX / window.innerWidth) * 2 - 1;
                    mouse.y = - (e.touches[0].pageY / window.innerHeight) * 2 + 1;
                }

                let hideText = () => {
                    if (this.INTERSECTED)
                        this.INTERSECTED.children.length > 0 && (this.INTERSECTED.children[0].visible = false);
                }
                
                // find intersections
                let raycaster = new Raycaster();
                raycaster.setFromCamera(mouse, this.camera);
                let intersects = raycaster.intersectObjects(this.graph.graph.children);
                console.log(intersects);
                hideText();
                
                if (intersects.length > 0
                    && this.INTERSECTED != intersects[0].object && 'oriData' in intersects[0].object.userData) {
                        this.INTERSECTED = intersects[0].object as Mesh;
                        const data = this.INTERSECTED.userData.oriData;
                        if (this.INTERSECTED.children.length > 0) {
                            this.INTERSECTED.children[0].visible = true;
                            return;
                        }
                        const sprite = makeTextSprite(`x:${data.x}, y:${data.y}, z:${data.z}`, { fontsize: 12, scaleFactor: this.graph.scaleFactor, depthTest: false });
                        sprite.position.add(new Vector3(0, 0.2, 0));
                        this.INTERSECTED.add(sprite);
                        
                    } else {
                        this.INTERSECTED = null;
                    }
                   
                }
            }
        }

        export class ZoomableThreeEvent {
            
            prevDiff: number;
            prevPos: Vector2;
            camera: Camera;
            graph: Graph;
            domElement: HTMLElement | Document;
            constructor(camera: Camera, graph: Graph) {
                this.camera = camera;
                this.graph = graph;
            }
            
          
            genrateOnTouch(this: ZoomableThreeEvent) {
                let generalCallback = new GeneralThreeEvent(this.camera, this.graph).genrateOnTouch();
                
                return (e: ThreeEvent) => {
                    switch (e.touches.length) {
                        case 1:
                            generalCallback(e);
                            this.prevPos = new Vector2(e.touches[0].clientX, e.touches[0].clientY);
                            break;
                        case 2:
                            this.prevDiff = Math.pow(e.touches[0].clientX - e.touches[1].clientX, 2) + Math.pow(e.touches[0].clientY - e.touches[1].clientY, 2) 
                            break;
                        default:
                            // code...
                            break;
                    }
                }
            }

            generateOnMove(this: ZoomableThreeEvent) {
                return (e: ThreeEvent) => {
                     if (e.touches.length == 1) {
                         var element = this.domElement === document ? this.domElement.body : this.domElement as HTMLElement;
                         element = element || document.body;
                         let deltaX = Math.abs(e.touches[0].clientX - this.prevPos.x) / (element.clientWidth) 
                         if (e.touches[0].clientX > this.prevPos.x) {

                             this.graph.graph.rotateY(100/180 * Math.PI * deltaX)
                         } else {
                             this.graph.graph.rotateY(-100/180 * Math.PI * deltaX)
                         }
                         let deltaY = Math.abs(e.touches[0].clientY - this.prevPos.y) / (element.clientHeight) 

                         if (e.touches[0].clientY > this.prevPos.y) {
                             this.graph.graph.translateY(-1 * deltaY)
                         } else {
                             this.graph.graph.translateY(1 * deltaY)
                         }
                         this.prevPos = new Vector2(e.touches[0].clientX, e.touches[0].clientY);
                        
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
                }
            }

            generateOnUp(this: ZoomableThreeEvent) {
                return (e: ThreeEvent) => {
                     
                }
            }


    }
}