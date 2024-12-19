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
    //gridstep is a global variable
    this.setScale(gridStep);
    this.setTint(colour);
    }
}
