
import Player from './player.js';
export default class Vehicle extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, texture,index,colour,map) {
    super(scene, x, y, texture);
    
    scene.add.existing(this);
    this.index=index;
    //i've made the player image be the same size as the value it can move in one go 
    this.setScale(gridStep);
    //this is a simple way to give the player a colour based on it's index, so each player should look a little different
    this.setTint(colour);
    this.text = scene.add.text(this.x, this.y, 'v'+this.index, { fontSize: '20px', fill: '#fff'});
    this.centreText();
    this.playerIndex=-1;
    this.map=map;
    }
    update(delta)
    {

    }
    moveVehicle(v)
    {
        //update the old position of the player in the map
        this.map.setVehicle(Player.translatePosToMapPos({x:this.x,y:this.y}),-1);
        this.x=v.x;
        this.y=v.y;
        this.centreText();
        //update the new position of the player in the map
        this.map.setVehicle(Player.translatePosToMapPos(v),this.index);
    }
    centreText()
    {
        this.text.setPosition(this.x-this.text.width/2,this.y-this.text.height/2);
    }
}