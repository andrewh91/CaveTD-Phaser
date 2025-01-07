var players=[];
var vehicles=[];
var vehicleIndex;
var tiles=[];
var mapData;
var savedMaps;
var terrainColours= [];
var cursors;
var newCursors=[];
var createPlayerFlag=false;
var ui;
var colourArray=[0xff0000,0x00ff00,0x0000ff ];
var selectedPlayer;
//gridStep defines how much the player moves in one movement, also currently defines the size of the player
var gridStep =50;
var latestKey;
import UIScene from './uiScene.js';
import {drawBorders} from './uiScene.js';
import Player from './player.js';
import Vehicle from './Vehicle.js';
import {manageCamera} from './splitScreen.js';
import Tile from'./Tile.js';
import MapData from'./MapData.js';
import SavedMaps from './SavedMaps.js';
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
        this.load.image('rubble', 'dot.png');
    }   
    create ()
    {
        this.mainCamera = this.cameras.main;

        this.setUpMap();

        vehicleIndex=-1;
        this.addVehicle(mapOffSetX+gridStep*3,mapOffSetY+gridStep*2);
        this.addVehicle(mapOffSetX+gridStep*3,mapOffSetY+gridStep*4);

        selectedPlayer=-1;
        //one player by default
        this.addPlayer(mapOffSetX,mapOffSetY);
        this.input.keyboard.on('keydown-P', this.onPressP, this);
        this.input.keyboard.on('keydown-R', this.onPressR, this);
        this.scene.launch('uiScene');
        ui=this.scene.get("uiScene");
        this.popupTimer=0;
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
            players: players, scene: this,uiScene:ui,mapData:mapData,vehicles:vehicles
        }
    }
    onPressP()
    {
        ui.showNewPlayerDialog();
        createPlayerFlag=true;
        /*make a new player at this player's position, and select it so the cursor keys move the new player*/
        let x = players[selectedPlayer].x;
        let y = players[selectedPlayer].y;
        this.addPlayer(mapOffSetX,mapOffSetY);
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
            //also added a cancel button, need that to get out of vehicle, since i already have plans for the action button 
            let numberOfKeys=6;
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
                cursors=(this.input.keyboard.addKeys({left:newCursors[1],right:newCursors[2],up:newCursors[3],down:newCursors[4],space:newCursors[5],shift:newCursors[6]}));
                players[players.length-1].updateCursors(cursors.left,cursors.right,cursors.up,cursors.down, cursors.space,cursors.shift);
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
           mapData.tiles.push(new Tile(this,'dot',i,mapData.terrainColours[pathTerrain],pathTerrain));
        }
        //the map is 27 across by 18 down, 
        savedMaps = new SavedMaps();
        mapData.loadFromText(savedMaps.mapsArray[0]);
    }
    //this will be called by the player when the player presses shift on the vehicle 
    enterVehicle(p,v)
    {
        console.log("entered");
        //give the vehicle a player index to show it is occupied by this player
        vehicles[v].playerIndex=p;
        this.addPopup("Player "+p+" entered Vehicle "+v,{x:players[p].x,y:players[p].y},2000);
        
    }
    exitVehicle(v)
    {
        this.addPopup("Player "+vehicles[v].playerIndex+" exited Vehicle "+v,{x:vehicles[v].x,y:vehicles[v].y},2000);
        vehicles[v].playerIndex=-1;
    }
    addPopup(text,vector,time)
    {
        ui.updatePopupText(text,vector);
        this.popupTimer=time;
    }
    updatePopup(delta)
    {
        if(this.popupTimer==0)
        {

        }
        else if(this.popupTimer>0)
        {
            this.popupTimer-=delta;
        }
        else if(this.popupTimer<0)
        {
            ui.hidePopupText();
            //set this to 0 just so we don't call ui.hidePopupText all the time
            this.popupTimer=0;
        }
    }
    updateVehicle(index,v)
    {
        vehicles[index].moveVehicle(v);
    }
    isVehicleRubbleCapacityFull(index)
    {
        //try to add rubble, if it was already at capacity it will return true
        return vehicles[index].addRubble();
    }
    isVehicleRubbleCapacityEmpty(index)
    {
        //try to remove rubble, if it was already empty return true
        return vehicles[index].removeRubble();
    }
    rubbleEmpty(v)
    {
        return vehicles[v].rubbleEmpty();
    }
    update (time,delta)
    {
        this.updatePopup(delta);
        //run the player update method for each player
        for(let i = 0;i<players.length;i++)
        {
            players[i].update(delta);
        }
    }
    addPlayer(x,y)
    {
        selectedPlayer++;
        let p = new Player(this, x,y, 'dot',selectedPlayer,incrementColour(selectedPlayer,3),mapData);
        players.push(p);
        //the player's index is stored at the player's position in the map, make sure to update that 
        mapData.setPlayer(Player.translatePosToMapPos({x:p.x,y:p.y}),p.index);
    }
    addVehicle(x,y)
    {
        vehicleIndex++;
        let v = new Vehicle(this,x ,y ,'dot','rubble',vehicleIndex,incrementColour(vehicleIndex,3),mapData);
        vehicles.push(v);
        //store the vehicle's index in the map at the vehicle's position 
        mapData.setVehicle(Player.translatePosToMapPos({x:v.x,y:v.y}),v.index);
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
