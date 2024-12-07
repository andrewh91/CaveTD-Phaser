export default class Tile extends Phaser.GameObjects.Sprite {
    constructor(scene, texture,index,colour) {
    super(scene, gridStep+gridStep*(index%mapWidth), gridStep+gridStep*Math.floor(index/mapWidth), texture);
    
    scene.add.existing(this);
    this.index=index;
    //gridstep is a global variable
    this.setScale(gridStep);
    //this is a simple way to give the image a colour based on it's index, so each image should look a little different
    this.setTint(colour);
    }
}
