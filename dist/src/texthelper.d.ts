import { Sprite } from 'three';
/**
 * Generate a sprite with text specified in the message
 * @param message the text
 * @param parameters the text graphical options
 * 	Supported fields: "fontface", "fontsize", "scaleFactor", "depthTest"
 */
export declare function makeTextSprite(message: string, parameters?: any): Sprite;
