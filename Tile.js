export default class Tile extends Phaser.GameObjects.Sprite {
    constructor(scene, texture,index,colour,terrain) {
    super(scene, mapOffSetX+gridStep*(index%mapWidth), mapOffSetY+gridStep*Math.floor(index/mapWidth), texture);
    
    scene.add.existing(this);
    this.index=index;
    this.terrain=terrain;
    //gridstep is a global variable
    this.setScale(gridStep);
    this.setTint(colour);
    }
}
