import {Vector2, Texture, CanvasTexture, SpriteMaterial, Sprite } from 'three';

const DELTA_SCALEFACTOR = 11;
/**
 * Generate a sprite with text specified in the message
 * @param message the text
 * @param parameters the text graphical options
 * 	Supported fields: "fontface", "fontsize", "scaleFactor", "depthTest"
 */
export function makeTextSprite( message: string, parameters: any = {} )
{
	if ( parameters === undefined ) parameters = {};
	
	var fontface = parameters.hasOwnProperty("fontface") ? 
		parameters["fontface"] : "Arial";
	
	var fontsize = parameters.hasOwnProperty("fontsize") ? 
		parameters["fontsize"] : 23;
	
	var borderThickness = parameters.hasOwnProperty("borderThickness") ? 
		parameters["borderThickness"] : 4;
	
	var borderColor = parameters.hasOwnProperty("borderColor") ?
		parameters["borderColor"] : { r:255, g:255, b:255, a:1.0 };
	
	var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
		parameters["backgroundColor"] : { r:255, g:255, b:255, a:1.0 };

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
	var metrics = context.measureText( message );

	
	// background color

	// border color
	context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
								  + borderColor.b + "," + borderColor.a + ")";

	context.lineWidth = borderThickness;
	// 1.4 is extra height factor for text below baseline: g,j,p,q.
	
	// text color
	context.fillStyle = "rgba(255, 255, 255, 1.0)";

	context.textAlign = 'center';


	context.fillText( message, canvas.width / 2, canvas.height / 2);
	
	// canvas contents will be used for a texture
	var texture = new CanvasTexture(canvas) ;


	var spriteMaterial = new SpriteMaterial( 
		{ map: texture } );
	spriteMaterial.depthTest = depthTest;
	var sprite = new Sprite( spriteMaterial );
	sprite.scale.set( (1/ DELTA_SCALEFACTOR) / scaleFactor, (1/DELTA_SCALEFACTOR) / scaleFactor, 1)
	return sprite;	
}

var PIXEL_RATIO = (function () {
	var ctx = document.createElement("canvas").getContext("2d") as any,
	dpr = window.devicePixelRatio || 1,
	bsr = ctx.webkitBackingStorePixelRatio ||
		  ctx.mozBackingStorePixelRatio ||
		  ctx.msBackingStorePixelRatio ||
		  ctx.oBackingStorePixelRatio ||
		  ctx.backingStorePixelRatio || 1;

    return dpr / bsr;
})();


var createHiDPICanvas = function(w: number, h: number, ratio: number = PIXEL_RATIO) {
    var can = document.createElement("canvas");
    can.width = w * ratio;
    can.height = h * ratio;
    can.style.width = w + "px";
    can.style.height = h + "px";
    can.getContext("2d").setTransform(ratio, 0, 0, ratio, 0, 0);
    return can;
}
