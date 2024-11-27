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

        this.dialogBackground = this.add.graphics(); 
        this.dialogBackground.fillStyle(0x000000, 0.8); 
        this.dialogBackground.fillRect(100, 100, 600, 400); 
        this.dialogBackground.setScrollFactor(0); 
        this.uiLayer.add(this.dialogBackground);
        this.dialogBackground.depth=1;

        this.dialogText = this.add.text(120, 120, '', { fontSize: '32px', fill: '#fff', wordWrap: { width: 560 } }); 
        this.dialogText.setScrollFactor(0); 
        this.uiLayer.add(this.dialogText);
        this.dialogText.depth=1;

        this.hideDialog();
    }  
    showNewPlayerDialog() 
    { 
        this.dialogText.setText("New player created.");
        this.dialogBackground.setVisible(true); 
        this.dialogText.setVisible(true); 
    } 
    hideDialog() 
    { 
        this.dialogBackground.setVisible(false); 
        this.dialogText.setVisible(false); 
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