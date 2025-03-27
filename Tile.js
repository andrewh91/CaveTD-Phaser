import Helper from './Helper.js';
export default class Tile extends Phaser.GameObjects.Sprite {
    constructor(scene, texture,index,colour,terrain) {
    super(scene, mapOffSetX+gridStep*(index%mapWidth), mapOffSetY+gridStep*Math.floor(index/mapWidth), texture);
    
    scene.add.existing(this);
    this.index=index;
    //terrain will be 0 for path 1 for rubble and 2 or higher for walls
    this.terrain=terrain;
    //playerIndex will be -1 if there is no player there or it will be the player's index number
    this.playerIndex=-1;
    this.vehicleIndex=-1;
    this.creatureIndex=-1;
    //i want 4 values for contested
    this.contestedNorth=false;
    this.contestedSouth=false;
    this.contestedEast=false;
    this.contestedWest=false;
    //these are used by the explorer pathfinding
    this.exploredNumber=-1;
    this.resourceMarker=false;
    //gridstep is a global variable
    this.setScale(gridStep);
    this.setTint(colour);
    this.resourceIndex=-1;
    this.creatureBaseIndex=-1;
    this.text = scene.add.text(this.x, this.y, '', { fontSize: '10px', fill: '#fff'});
    Helper.centreText(this);
    }
    updateText(t)
    {
        this.text.setText(t);
        Helper.centreText(this);
    }
}
