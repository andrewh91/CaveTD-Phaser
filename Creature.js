import Helper from './Helper.js';
export default class Creature extends Phaser.GameObjects.Sprite 
{    
    //this many milliseconds must pass before the player is allowed to make a move
    static playerMoveTimerStep=160;
    constructor(scene, x, y, texture,index,colour,map) 
    {
        super(scene, x, y, texture);
        
        scene.add.existing(this);
        this.index=index;
        //pass in a reference to the map data, so we can query the map to see if there is a wall etc
        this.map=map;
        //i've made the player image be the same size as the value it can move in one go 
        this.setScale(gridStep);
        //this is a simple way to give the player a colour based on it's index, so each player should look a little different
        this.setTint(colour);
        this.playerMoveTimer=0;
        this.playerMoveTimer=Creature.playerMoveTimerStep;
        this.text = scene.add.text(this.x, this.y, 'c'+this.index, { fontSize: '20px', fill: '#fff'});
        Helper.centreText(this);
    }
    update(delta)
    {

    }
}