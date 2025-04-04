import Helper from './Helper.js';
export default class Trailer extends Phaser.GameObjects.Sprite 
{    
    constructor(scene, x, y, texture) 
    {
        super(scene, x, y, texture);
        //the tx is a more useful way of figuring out where the player is in the world, this.x is the world coord, but this is a grid based game, and the player could be at position (60,10) in order to figure out where the player is you would need to know what the gridstep is, and that the grid does not start at 0,0, it has an offset, so (60,10) could be (2,0) tile position if the gridstep is 25 and the offset is (10,10)
        this.tx=(this.x-mapOffSetX)/gridStep;
        this.ty=(this.y-mapOffSetY)/gridStep;
        scene.add.existing(this);
        this.scene=scene;
        this.setScale(4);
        this.setTint(0x555555);
    }
    kill(v)
    {
        //if we want to deposit the rubble from the trailer then the creature can do that and define where the rubble should be dropped
        if(v)
        {
            this.scene.addTrailerRubble(v);
            //remove the sprite
            this.destroy();
        }
        else
        {
            //if we kill the trailer we need to drop the rubble where the trailer was 
            this.scene.addTrailerRubble({tx:this.tx,ty:this.ty});
            this.destroy();
        }
    }
}