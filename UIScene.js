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
        this.dialogBackground.depth=9;
        //this is for the new player text
        this.dialogText = this.add.text(20, 120, '', { fontSize: '32px', fill: '#fff', wordWrap: { width: 560 } }); 
        this.dialogText.setScrollFactor(0); 
        this.uiLayer.add(this.dialogText);
        this.dialogText.depth=9;

        this.dialogKeys = this.add.text(620, 120, '\n\n', { fontSize: '32px', fill: '#fff', wordWrap: { width: 560 } }); 
        this.dialogKeys.setScrollFactor(0); 
        this.uiLayer.add(this.dialogKeys);
        this.dialogKeys.depth=9;

        this.hideDialog();
        //create popuptext to tell the user that a player has entered or extied a vehicle or if the vehicle is in move or dump mode
        this.popupText = this.add.text(20, 120, '', { fontSize: '32px', fill: '#fff', wordWrap: { width: 560 } }); 
        this.popupText.setScrollFactor(0); 
        this.uiLayer.add(this.popupText);
        this.popupText.depth=9;

        this.shoutOutText = this.add.text(20, 20, '', { fontSize: '32px', fill: '#fff', wordWrap: { width: 560 } });         
        this.shoutOutText.setScrollFactor(0); 
        this.uiLayer.add(this.shoutOutText);
        this.shoutOutText.depth=9;
        
    }  
    updatePopupText(t,v)
    {
        this.popupText.setText(t);
        this.popupText.setPosition(v.x,v.y);
        this.popupText.setVisible(true);
    }
    hidePopupText()
    {
        this.popupText.setVisible(false);
    }
    showNewPlayerDialog() 
    { 
        this.dialogText.setText("New player created.\nAssign movement keys.\nAssign LEFT key:\nAssign RIGHT key:\nAssign UP key:\nAssign DOWN key:\nAssign action key:\nAssign cancel key:");
        this.dialogBackground.setVisible(true); 
        this.dialogText.setVisible(true); 
        this.dialogKeys.setVisible(true); 
    } 
    updateDialog(t)
    {
        this.dialogKeys.text+=t+'\n';
    }
    hideDialog() 
    { 
        this.dialogBackground.setVisible(false); 
        this.dialogText.setVisible(false); 
        this.dialogKeys.setVisible(false);
        this.dialogKeys.text="\n\n";
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
//for testing purposes i want to draw the grid coords of the tile the mouse is over, to screen, for each camera
export function drawGridCoords(scene,creatures,mapData)
{
    for(let i = 0 ; i < scene.ui.cameraTextArray.length;i ++)
    {
        //this is the mouse pos on screen, subtract the map offset subtract the camera's position on screen (important for splitscreen) plus gridstep/2 (because tiles are drawn from the centre) all divded by gridstep
        //so this all boils down to showing you the coord of the tile you have moused over
        let x = Math.floor((scene.input.activePointer.x-mapOffSetX-scene.cameras.cameras[i].x+scene.cameras.cameras[i].scrollX+gridStep/2)/gridStep);
        let y = Math.floor((scene.input.activePointer.y-mapOffSetY-scene.cameras.cameras[i].y+scene.cameras.cameras[i].scrollY+gridStep/2)/gridStep);
        let creatureIndex=-1;
        try
        {
            creatureIndex = mapData.getCreatureIndex({tx:x,ty:y});
        }       
        catch(e)
        {

        }

        let dir = '';
        let contestedCurrent ='';
        let exploredNumber ='';
        let carryingResource ='no';
        let resourceMark ='';
        if(mapData.inBounds({tx:x,ty:y}))
        {
            contestedCurrent = mapData.getContestedFrom({tx:x,ty:y});
            exploredNumber = mapData.getExploredNumber({tx:x,ty:y});
            resourceMark = mapData.getResourceMarker({tx:x,ty:y});
        }
        if(creatureIndex>-1)
        {
            dir = creatures[creatureIndex].proposedDirection();
            dir=dir==0?'north':dir==1?'south':dir==2?'east':dir==3?'west':'stationary';
            carryingResource = creatures[creatureIndex].carryingResource;
        }
        scene.ui.cameraTextArray[i].setText(`
        X=${x}, 
        Y=${y},
        id=${creatureIndex},
        dir=${dir},
        contested=${contestedCurrent},
        explored=${exploredNumber},
        carryingR=${carryingResource},
        resourceMark=${resourceMark}
        `);
        
    }
}