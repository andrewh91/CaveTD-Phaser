export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'uiScene' });
    }

    preload() {
        
    }

    create() {
        // Create a UI layer
        this.uiLayer = this.add.layer();
        this.graphics = this.add.graphics();

    }
}
export function drawBorders(scene)
{

    var array = scene.scene.scene.cameras.cameras;
    var ui = scene.scene.get('uiScene');
    // i think i should destory the existing ones so that i don't draw anything twice
    ui.graphics.destroy();
    ui.graphics = ui.add.graphics();
    //pass in the camera array from the game scene, and the ui will draw borders around each camera
    for(let i =0 ; i < array.length ; i ++ )
    {
        ui.graphics.lineStyle(5, 0xff0000); 
        ui.graphics.strokeRect(array[i].x, array[i].y, array[i].width-1, array[i].height-1); 
        ui.graphics.setScrollFactor(0); 
        ui.uiLayer.add(ui.graphics); 
    }
}