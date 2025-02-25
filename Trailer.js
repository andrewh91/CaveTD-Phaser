export default class Trailer extends Phaser.GameObjects.Sprite 
{    
    constructor(scene, x, y, texture) 
    {
        super(scene, x, y, texture);
        
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
            this.scene.addTrailerRubble({x:this.x,y:this.y});
            this.destroy();
        }
    }
}