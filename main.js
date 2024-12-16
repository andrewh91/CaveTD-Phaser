var players=[];
var tiles=[];
var mapData;
var terrainColours= [];
var cursors;
var newCursors=[];
var createPlayerFlag=false;
var ui;
var colourArray=[0xff0000,0x00ff00,0x0000ff ];
var selectedPlayer=0;
//gridStep defines how much the player moves in one movement, also currently defines the size of the player
var gridStep =50;
var latestKey;
import UIScene from './uiScene.js';
import {drawBorders} from './uiScene.js';
import Player from './player.js';
import {manageCamera} from './splitScreen.js';
import Tile from'./Tile.js';
import MapData from'./MapData.js';
class Game extends Phaser.Scene
{
    constructor()
    {
        super({ key: 'game' });
    }
    preload ()
    {
        this.load.setBaseURL();
        this.load.image('dot', 'dot.png');
    }   

    create ()
    {
        this.mainCamera = this.cameras.main;

        selectedPlayer=-1;
        selectedPlayer++;
        this.setUpMap();
        //one player by default
        players.push(new Player(this, mapOffSetX,mapOffSetY, 'dot',selectedPlayer,incrementColour(selectedPlayer,3),mapData));
        this.input.keyboard.on('keydown-P', this.onPressP, this);
        this.input.keyboard.on('keydown-R', this.onPressR, this);
        this.scene.launch('uiScene');
        ui=this.scene.get("uiScene");

        //on any button press run this record key method
        this.input.keyboard.on('keydown', (event) => {
        this.recordKey(event);
        });

        //the players have code in the player class to default their movement keys to the arrow keys, but i've now set it so new players prompt for their key bindings
        cursors=(this.input.keyboard.addKeys(
            {up:Phaser.Input.Keyboard.KeyCodes.W,
            down:Phaser.Input.Keyboard.KeyCodes.S,
            left:Phaser.Input.Keyboard.KeyCodes.A,
            right:Phaser.Input.Keyboard.KeyCodes.D}));

        window.debug={
            players: players, scene: this,uiScene:ui,tileMap:mapData
        }
    }
    onPressP()
    {
        ui.showNewPlayerDialog();
        createPlayerFlag=true;
        /*make a new player at this player's position, and select it so the cursor keys move the new player*/
        let x = players[selectedPlayer].x;
        let y = players[selectedPlayer].y;
        selectedPlayer++;
        players.push(new Player(this, x,y, 'dot',selectedPlayer,incrementColour(selectedPlayer,3),mapData));
        selectedPlayer=players.length-1;
        addCamera(this,x,y);
    }
    onPressR()
    {
        removeCamera(this);
    }
    //this will run on any button press, only does something if createPlayerFlag is true. createPlayerFlag will turn true when we press 'p' and go back to false after we set up the key bindings for the new player
    recordKey(e)
    {
        if(createPlayerFlag)
        {
            console.log(e);
            //basically a dialog box will pop up when we have created a new player, it will prompt the user to define the 4 movement keys for the new player, then prompt them to press any key to confirm, when confirmed the dialogue will close. if i want to add additional keys i would need to adjust the numberOfKeys value, you would also need to amend what is passed to the updateCursors method, and amend the cursors variable of the player 
            //i have now added one action button, which is space by default
            let numberOfKeys=5;
            if(newCursors.length==numberOfKeys)
            {
                ui.updateDialog(e.key);
                newCursors.push(e.keyCode);
                ui.updateDialog('Press any key to confirm.');
            }
            else if(newCursors.length>numberOfKeys)
            {  
                ui.updateDialog(e.key);
                newCursors.push(e.keyCode);
                //newcursors[0] will be p as that's what we pushed to create a new player
                cursors=(this.input.keyboard.addKeys({left:newCursors[1],right:newCursors[2],up:newCursors[3],down:newCursors[4],space:newCursors[5]}));
                players[players.length-1].updateCursors(cursors.left,cursors.right,cursors.up,cursors.down, cursors.space);
                console.log(newCursors);
                console.log(players[players.length-1].cursors);
                console.log(cursors);
                newCursors=[];
                createPlayerFlag=false;
                ui.hideDialog();
            } 
            else if(newCursors.length==0)
            {
                //ignore the first one as that will just be the p key which created the player in the first place
                newCursors.push(e.keyCode);
            }
            else
            {
                ui.updateDialog(e.key);
                newCursors.push(e.keyCode);
            }
        }
        latestKey=e;
    }
    setUpMap()
    {
        mapData = new MapData();
        for(let i = 0 ; i < mapWidth*mapHeight ; i ++ )
        {
           mapData.tiles.push(new Tile(this,'dot',i,mapData.terrainColours[emptyTerrain],emptyTerrain));
        }
        //the map is 27 across by 18 down, 
        mapData.setTerrain({x:0 ,y:0 },wallTerrain);
        mapData.setTerrain({x:26,y:0 },wallTerrain);
        mapData.setTerrain({x:0 ,y:17},wallTerrain);
        mapData.setTerrain({x:26,y:17},wallTerrain);
    }
    
    update (time,delta)
    {
        //run the player update method for each player
        for(let i = 0;i<players.length;i++)
        {
            players[i].update(delta);
        }
    }
    
}
//I want additional players to be able to join at any time, that means we need to add a new camera and adjust the size of existing cameras on the fly. but you could also use this when you're not adding a new camera, maybe a gameplay feature would be to have another camera to keep an eye on something
function addCamera(scene,x,y)
{
    //add a new camera, and adjust the other cameras to fit, the default size will be changed soon enough so these figures don't matter too much
    let newCamera = scene.cameras.add(0,0,800,600).setZoom(1);
    
    //this is my code to organise the on screen position and size of the cameras
    manageCamera(scene);
    //target the camera at the given position
    newCamera.setScroll(x-newCamera.width/2,y-newCamera.height/2);
    console.log(newCamera);
    //redraw the border in the ui - a red border is currently drawn around each camera
    drawBorders(scene);
}
//removes the most recent extra camera - will not remove the camera if there is only one left
function removeCamera(scene)
{
    if(scene.scene.scene.cameras.cameras.length>1)
    {
        scene.scene.scene.cameras.remove(scene.scene.scene.cameras.cameras[scene.scene.scene.cameras.cameras.length-1]);
        //once you take a camera away you need to rearrange the remaining ones and redraw the borders too
        manageCamera(scene);
        drawBorders(scene);
    }
}
function incrementColour(i,d)
{
    //this should give d^3 variety of numbers - or d^3-1 if you don't want black
    //if i == 0 then that would give colour black
    //we could plus 1 to avoid black being first, but that would just make it the last colour instead
    //so mod on the total number of colours
    i=i%(d*d*d-1);
    //then plus 1, now the incrementing colour will not be black
    i=i+1;
    return Math.floor((Math.floor((i/(d*d)))%d)*(256*256*256)/d +  (Math.floor((i/d)%d))*(256*256)/d +  (i%d)*(256)/d);
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: [Game, UIScene]
    
};

const game = new Phaser.Game(config);
