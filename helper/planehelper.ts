import { Object3D, Scene, Group, Vector3, MeshBasicMaterial, Geometry, Points, LineSegments, Material, PlaneGeometry, Mesh, LineBasicMaterial, DoubleSide } from 'three';
import  { ScaleContinuousNumeric , scaleLinear } from 'd3-scale';
import { makeTextSprite } from './texthelper'
import { GraphInfo } from './datahelper';


/**
 * The 3D graph object
 */
export class Graph {
	graph: Group
	deltax: number
	deltay: number
	deltaz: number
	scalex: ScaleContinuousNumeric<number, number>
	scaley: ScaleContinuousNumeric<number, number>
	scalez: ScaleContinuousNumeric<number, number>
	planetop: Group
	planebottom: Group
	planeright: Group
	planeleft: Group
	planefront: Group
	planeback: Group
	scaleFactor: number

	constructor(graph: Group, delta: number[], scale: ScaleContinuousNumeric<number, number>[], allplane: Group[], scaleFactor: number) {
		this.graph = graph;
		this.deltax = delta[0];
		this.deltay = delta[1];
		this.deltaz = delta[2];
		this.scalex = scale[0];
		this.scaley = scale[1]
		this.scalez = scale[2];
		this.planetop = allplane[0]
		this.planebottom = allplane[1]
		this.planeleft = allplane[2]
		this.planeright = allplane[3]
		this.planefront = allplane[4]
		this.planeback = allplane[5]
		this.scaleFactor = scaleFactor;
	}

	injectScene(scene: Scene) {
		scene.add(this.graph)
	}

	getVerticesForDisplay(vertices: Vector3[]): Vector3[] {
		return vertices.map((v) => {
			return new Vector3(this.scalez(v.z), this.scaley(v.y), this.scalex(v.x) );
		});
		
	}

	topbottom(): Group[] {
		return [this.planetop, this.planebottom];
	}

	therest(): Group[] {
		return [this.planeback, this.planefront, this.planeleft, this.planeright];
	}

	allplane() {
		return this.topbottom().concat (this.therest());
	}
}

export namespace PlaneHelper {
	/**
	 * Generate Graph from graph info
	 * @param graphinfo The GraphInfo
	 */
	export function addplane (graphinfo: GraphInfo) {
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

		var graph = new Group();
		const threshold = 1.5;

		//do scaling ticks
		let scalex = scaleLinear().domain([lowx, highx]);
		let scaley = scaleLinear().domain([lowy, highy]);
		let scalez = scaleLinear().domain([lowz, highz]);

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
			highy *= mi * threshold /deltay;
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

		let right = new Vector3(deltaz / 2 , 0, 0);
		let left = new Vector3(-deltaz / 2 , 0, 0);
		let rl = generatePlane(deltax, deltay, scalex, scaley, right, left, false);
		const planeright = rl[0];
		const planeleft = rl[1];
		rl.forEach(function(e){
			e.rotation.y = - Math.PI / 2;
		})
		graph.add(...rl);

		let top = new Vector3(0,deltay / -2,0 );
		let bottom = new Vector3(0, deltay / 2, 0);
		let tb = generatePlane(deltaz, deltax, scalez, scalex ,top, bottom, true);
		const planetop = tb[0];
		planetop.name = 'planetop';
		const planebottom = tb[1];
		planebottom.name = 'planebottom';
		tb.forEach(function(e){
			e.rotation.x = Math.PI / 2;
		});
		graph.add( ...tb);


		let front = new Vector3(0,0,deltax / 2);
		let back = new Vector3(0,0,-deltax / 2);
		let fb = generatePlane(deltaz, deltay, scalez, scaley, front, back , false);
		const planefront = fb[0];
		const planeback = fb[1];
		graph.add( ...fb );


		let m = Math.max(deltax, deltay, deltaz) || 1;


		graph.scale.multiplyScalar (0.5 / m);
		const alldelta = [deltax, deltay, deltaz];
		const allscale = [scalex.range([ -deltax/2,  deltax/2]),
						scaley.range([-deltay / 2, deltay / 2]),
						 scalez.range([-deltaz / 2, deltaz / 2])];
		const allplane = [planetop, planebottom, planeleft, planeright, planefront, planeback];
		return new Graph(graph, alldelta, allscale, allplane, 0.5 / m);
	}



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
	function generatePlane(deltax: number, deltay: number, scalex: ScaleContinuousNumeric<number, number>
		, scaley: ScaleContinuousNumeric<number, number>, posfront: Vector3, posback: Vector3, xy: boolean) {
		const material = new MeshBasicMaterial( {color: 0x0074D9, transparent: true, opacity: 0.3, side: DoubleSide} );
		let geometry = new PlaneGeometry(deltax, deltay);
		let planeback =  new Group()
		planeback.add(new Mesh( geometry, material ));
		planeback.position.copy(posback);


		let smalllinematerial = new LineBasicMaterial({
			color: 0xffffff,
			linewidth: 1
		});

		//Point of the axis
		let xtop = new Geometry();
		let xbottom = new Geometry();
		let yleft = new Geometry();
		let yright = new Geometry();

		let smalllinegeometry = new Geometry();
		let rangex = scalex.range([ -deltax/2,  deltax/2])
		let ticksx = rangex.ticks(4)
		for (let i of ticksx) {
			smalllinegeometry.vertices.push(
				new Vector3(rangex(i), deltay / -2, 0),
				new Vector3(rangex(i), deltay / 2, 0)
				);
			xtop.vertices.push(	new Vector3(rangex(i), deltay / 2, 0))
			xbottom.vertices.push(new Vector3(rangex(i), deltay / -2, 0))
		}

		let rangey = scaley.range([-deltay / 2, deltay / 2])
		let ticksy = rangey.ticks(4);
		for (let i of ticksy) {
			smalllinegeometry.vertices.push(
				new Vector3(-deltax / 2, rangey(i), 0),
				new Vector3(deltax / 2, rangey(i), 0)
				);
			yleft.vertices.push(new Vector3(-deltax / 2, rangey(i), 0));
			yright.vertices.push(new Vector3(deltax / 2, rangey(i), 0));
		}
		let line = new LineSegments(smalllinegeometry, smalllinematerial);

		planeback.add(line);
		const invi = new Material();
		invi.visible = false;
		const xt = new Points(xtop,invi);
		xt.name = "xtop";
		xt.userData = ticksx;
		const xb = new Points(xbottom,invi);
		xb.name = 'xbottom';
		xb.userData = ticksx;
		const yl = new Points(yleft, invi);
		yl.name = 'yleft';
		yl.userData = ticksy;
		const yr = new Points(yright,invi);
		yr.name = 'yright';
		yr.userData = ticksy;
		let count = 0;

		planeback.add(yl,yr);
		if (xy) {
			planeback.add(xt,xb);
		}

		let planefront =  planeback.clone();
		planefront.position.copy(posfront);
		return [planeback, planefront];
	}

	const scaledelta = 7;

	
	/**
	 * Add the y axis to the graph plane
	 * @param therest the y axis graph plane
	 * @param scaleFactor the scale factor of the graph object
	 * @param title 
	 */
	export function addyaxis(therest: Group[], scaleFactor: number, title = "y") {
		var invert = (1 / scaledelta)  / scaleFactor;
		for (let i of therest) {
			const yl = i.getObjectByName("yleft") as Points;
			const yr = i.getObjectByName("yright") as Points;
			const lengtyl = (yl.geometry as Geometry).vertices.length
			const lengthyr = (yr.geometry as Geometry).vertices.length
			let count = 0;
			let tick = yl.userData;
			let average = new Vector3();
			for (let r of (yl.geometry as Geometry).vertices) {
				const sprite = makeTextSprite(tick[count], {scaleFactor: scaleFactor})
				sprite.position.copy(r).add(new Vector3(-0.4,0,0).multiplyScalar(invert));
				average.add(sprite.position);
				yl.add(sprite);
				count++
			}
			average.multiplyScalar(1 / lengtyl).add(new Vector3(-0.4,0,0).multiplyScalar(invert));
			let sprite = makeTextSprite(title, {scaleFactor: scaleFactor})
			sprite.position.copy(average);
			yl.add(sprite);

			average = new Vector3();
			count = 0;
			for (let r of (yr.geometry as Geometry).vertices) {
				const sprite = makeTextSprite(tick[count], {scaleFactor: scaleFactor})
				sprite.position.copy(r).add(new Vector3(0.4,0,0).multiplyScalar(invert));
				average.add(sprite.position);
				yr.add(sprite);
				count++
			}
			average.multiplyScalar(1 / lengthyr).add(new Vector3(0.4,0,0).multiplyScalar(invert));
			sprite = makeTextSprite(title, {scaleFactor: scaleFactor})
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
	export function addxzaxis(topbottom: Group[], scaleFactor: number, title = {x: 'x', z:'z'}) {
		const invert = (1 / scaledelta)  / scaleFactor;
		let averageOut = (average: Vector3, length: number, offset: Vector3, title: string) => {
			average.multiplyScalar(1 / length).add(offset.multiplyScalar(invert));
			let sprite = makeTextSprite(title, {scaleFactor: scaleFactor})
			sprite.position.copy(average);
			return sprite;
		}

		let direction = -1;

		for (let i of topbottom) {
			const xt = i.getObjectByName("xtop") as Points;
			const xb = i.getObjectByName("xbottom") as Points;
			const lengtxt = (xt.geometry as Geometry).vertices.length
			const lengthxb = (xb.geometry as Geometry).vertices.length
			const ticksx = xt.userData;

			let average = new Vector3();
			let offset = new Vector3(0,0.3,0.3 * direction)
			let count = 0;
			for (let r of (xt.geometry as Geometry).vertices) {
				const sprite = makeTextSprite(ticksx[count], {scaleFactor: scaleFactor})
				sprite.position.copy(r).add(offset.clone().multiplyScalar(invert));
				xt.add(sprite);
				average.add(sprite.position);
				count++
			}
			let sprite = averageOut(average, lengtxt, offset, title.x);
			xt.add(sprite);

			

			count = 0;
			average = new Vector3();
			offset = new Vector3(0,-0.3,0.3 * direction);
			for (let r of (xb.geometry as Geometry).vertices) {
				const sprite = makeTextSprite(ticksx[count], {scaleFactor: scaleFactor})
				sprite.position.copy(r).add(offset.clone().multiplyScalar(invert));
				xb.add(sprite);
				average.add(sprite.position);
				count++
			}
			sprite = averageOut(average, lengthxb, offset, title.x)
			xb.add(sprite);

			const yl = i.getObjectByName("yleft") as Points;
			const yr = i.getObjectByName("yright") as Points;
			const lengtyl = (yl.geometry as Geometry).vertices.length
			const lengthyr = (yr.geometry as Geometry).vertices.length
			
			count = 0;
			const ticksy = yl.userData;
			average = new Vector3();
			offset = new Vector3(-0.3,0,0.3 * direction);
			for (let r of (yl.geometry as Geometry).vertices) {
				const sprite = makeTextSprite(ticksy[count], {scaleFactor: scaleFactor})
				sprite.position.copy(r).add(offset.clone().multiplyScalar(invert));
				average.add(sprite.position);
				yl.add(sprite);
				count++
			}
			sprite = averageOut(average, lengtyl, offset, title.z)
			yl.add(sprite);

			count = 0;
			average = new Vector3();
			offset = new Vector3(0.3,0,0.3 * direction)
			for (let r of (yr.geometry as Geometry).vertices) {
				const sprite = makeTextSprite(ticksy[count], {scaleFactor: scaleFactor})
				sprite.position.copy(r).add(offset.clone().multiplyScalar(invert));
				yr.add(sprite);
				average.add(sprite.position);
				count++
			}
			sprite = averageOut(average, lengthyr, offset, title.z)
			yr.add(sprite);
			direction = 1;

		}
	}
}
