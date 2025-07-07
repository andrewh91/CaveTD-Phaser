import Helper from './Helper.js';
export default class Tile extends Phaser.GameObjects.Sprite {
    constructor(scene, texture,index,colour,terrain) {
    super(scene, mapOffSetX+gridStep*(index%mapWidth), mapOffSetY+gridStep*Math.floor(index/mapWidth), texture);
    
    scene.add.existing(this);
    //the tx is a more useful way of figuring out where the player is in the world, this.x is the world coord, but this is a grid based game, and the player could be at position (60,10) in order to figure out where the player is you would need to know what the gridstep is, and that the grid does not start at 0,0, it has an offset, so (60,10) could be (2,0) tile position if the gridstep is 25 and the offset is (10,10)
    this.tx=(this.x-mapOffSetX)/gridStep;
    this.ty=(this.y-mapOffSetY)/gridStep;
    this.index=index;
    //terrain will be 0 for path 1 for rubble and 2 or higher for walls
    this.terrain=terrain;
    //playerIndex will be -1 if there is no player there or it will be the player's index number
    this.playerIndex=-1;
    this.vehicleIndex=-1;
    this.creatureIndex=-1;
    //i want 4 values for contested
    this.contestedFromNorth=false;
    this.contestedFromSouth=false;
    this.contestedFromEast=false;
    this.contestedFromWest=false;
    //these are used by the explorer pathfinding
    this.exploredNumber=-1;
    this.resourceMarker=-1;
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
