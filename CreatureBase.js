import Helper from './Helper.js';
export default class CreatureBase extends Phaser.GameObjects.Sprite 
{    
    constructor(scene, x, y, texture,index,colour,map) 
    {
        super(scene, x, y, texture);
        scene.add.existing(this);
        //the tx is a more useful way of figuring out where the player is in the world, this.x is the world coord, but this is a grid based game, and the player could be at position (60,10) in order to figure out where the player is you would need to know what the gridstep is, and that the grid does not start at 0,0, it has an offset, so (60,10) could be (2,0) tile position if the gridstep is 25 and the offset is (10,10)
        this.tx=(this.x-mapOffSetX)/gridStep;
        this.ty=(this.y-mapOffSetY)/gridStep;
        this.resources=0;
        this.map=map;
        this.addToMap();
        this.setScale(gridStep);
        this.setTint(colour);
    }
    addToMap()
    {
        this.map.setCreatureBaseIndex({tx:this.tx,ty:this.ty},this.index);
    }
    createCreature()
    {
        this.scene.addCreatureToWaitingRoom(this.tx,this.ty);
    }

}