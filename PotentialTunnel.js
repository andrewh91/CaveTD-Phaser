export default class PotentialTunnel extends Phaser.GameObjects.Sprite 
{    
    constructor(scene, x, y, texture,index) 
    {
        super(scene, x, y, texture);
        
        scene.add.existing(this);
        this.index=index;
        this.setScale(10);
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
    }
}