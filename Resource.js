import Helper from './Helper.js';
export default class Resource extends Phaser.GameObjects.Sprite 
{    
    constructor(scene, x, y, texture,index,health) 
    {
        super(scene, x, y, texture);
        //the tx is a more useful way of figuring out where the player is in the world, this.x is the world coord, but this is a grid based game, and the player could be at position (60,10) in order to figure out where the player is you would need to know what the gridstep is, and that the grid does not start at 0,0, it has an offset, so (60,10) could be (2,0) tile position if the gridstep is 25 and the offset is (10,10)
        this.tx=(this.x-mapOffSetX)/gridStep;
        this.ty=(this.y-mapOffSetY)/gridStep;
        this.scene=scene;
        this.scene.add.existing(this);
        this.scene=scene;
        this.setScale(4);
        this.setTint(0x5555ff);
        this.health=health;
        this.index=index;
        this.scene.setResourceMarkerOnMap({tx:this.tx,ty:this.ty},this.health);
        //problem:newlyDiscovered
        //this bool will help a creature decide what to do when it picks up a resource off a dead creatuer
        this.newlyDiscovered = true;
    }
    collect()
    {
        this.health--;
        let returnValue=false;
        if(this.newlyDiscovered)
        {
            returnValue = true;
        }
        this.newlyDiscovered=false;
        this.scene.decrementResourceMarkerOnMap({tx:this.tx,ty:this.ty});
        if(this.health<=0)
        {
            //i'm not going to do this here, the resource can remain, although it will have no health, the creatures that travel to it will be responsibile for deleting the resourceMarkers
            //this.scene.addResourceMarkerToMap({tx:this.tx,ty:this.ty},false);
            //this.destroy;
        }
        return returnValue;
    }
}