import Helper from "./Helper.js";
export default class PotentialTunnel extends Phaser.GameObjects.Sprite 
{    
    constructor(scene, x, y, texture) 
    {
        super(scene, x, y, texture);        
        //the tx is a more useful way of figuring out where the player is in the world, this.x is the world coord, but this is a grid based game, and the player could be at position (60,10) in order to figure out where the player is you would need to know what the gridstep is, and that the grid does not start at 0,0, it has an offset, so (60,10) could be (2,0) tile position if the gridstep is 25 and the offset is (10,10)
        this.tx=(this.x-mapOffSetX)/gridStep;
        this.ty=(this.y-mapOffSetY)/gridStep;
        
        scene.add.existing(this);
        this.setScale(5);
        this.setTint(0xff0000);
        this.distanceToOriginatingCreature=0;
        this.alive=true;
        //when the distance between the creture and the tunnel reduces the tunnel becomes viable
        this.viable=false;
    }
    kill()
    {
        this.alive=false;
        this.distanceToOriginatingCreature=0;
        this.viable=false;
        this.x=undefined;
        this.y=undefined;
        this.tx=undefined;
        this.ty=undefined;
    }
}