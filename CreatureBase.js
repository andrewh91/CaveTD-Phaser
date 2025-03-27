import Helper from './Helper.js';
export default class CreatureBase extends Phaser.GameObjects.Sprite 
{    
    constructor(scene, x, y, texture,index,colour,map) 
    {
        super(scene, x, y, texture);
        scene.add.existing(this);
        this.resources=0;
        this.map=map;
        this.addToMap();
        this.setScale(gridStep);
        this.setTint(colour);
    }
    addToMap()
    {
        this.map.setCreatureBaseIndex(Helper.translatePosToMapPos({x:this.x,y:this.y}),this.index);
    }
    createCreature()
    {
        this.scene.addCreatureToWaitingRoom(this.x,this.y);
    }

}