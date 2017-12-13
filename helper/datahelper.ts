import { Vector3, Matrix3 } from 'three'
import  { scaleLinear } from 'd3-scale';

export class GraphInfo {
	lowx: number;
	highx: number;
	lowy: number;
	highy: number;
	lowz: number;
	highz: number;
	vertices: Vector3[];

	constructor(data: Vector3[]) {
		this.vertices = data.map((d) => {
			return d.clone();
		})
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

	getAllLimits() : number[] {
		return [this.lowx, this.highx, this.lowy, this.highy, this.lowz, this.highz]
	}

	scaler(value: number, axis = Axis.x): number {
		switch (axis) {
			case Axis.x:
				return scaleLinear().domain([this.lowx, this.highx]).range([0,1])(value)
			case Axis.y:
				return scaleLinear().domain([this.lowy, this.highy]).range([0, 1])(value)
			case Axis.z:
				return scaleLinear().domain([this.lowz, this.highz]).range([0, 1])(value)
			default:
				return scaleLinear().domain([this.lowx, this.highx]).range([0,1])(value)
		}
	}
}

export class SurfaceInfo extends GraphInfo{
	height: number;
	width: number;
	
	/**
	 * create a surface info object from height map matrix
	 * @param surface height map matrix
	 */
	constructor (surface: number[][]) {
		var data: Vector3[] = [];
		for (let x = 0; x < surface.length; x++) {
    		for (let y = 0; y < surface[0].length; y++  ) {
        		data.push(new Vector3(y, surface[x][y], x))
    		}
		}
		super(data);
		this.height = surface.length;
		this.width = surface[0].length;
	}

} 

export enum Axis {
	x,y,z
}