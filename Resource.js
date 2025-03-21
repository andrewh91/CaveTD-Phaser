export default class Resource extends Phaser.GameObjects.Sprite 
{    
    constructor(scene, x, y, texture,index) 
    {
        super(scene, x, y, texture);
        this.scene=scene;
        this.scene.add.existing(this);
        this.scene=scene;
        this.setScale(4);
        this.setTint(0x5555ff);
        this.health=10;
        this.index=index;
        this.scene.addResourceMarkerToMap({x:x,y:y},true);
    }
    collect()
    {
        this.health--;
        if(this.health<=0)
        {
            this.scene.addResourceMarkerToMap({x:this.x,y:this.y},false);
            this.destroy;
        }
    }
}