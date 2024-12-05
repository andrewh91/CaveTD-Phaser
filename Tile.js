export default class Tile extends Phaser.GameObjects.Sprite {
    constructor(scene, texture,index) {
    super(scene, gridStep+gridStep*(index%mapWidth), gridStep+gridStep*Math.floor(index/mapWidth), texture);
    
    scene.add.existing(this);
    this.index=index;
    //i've made the player image be the same size as the value it can move in one go 
    this.setScale(gridStep);
    //this is a simple way to give the player a colour based on it's index, so each player should look a little different
    this.setTint(0xffffff/33*(this.index+1));
    }
}