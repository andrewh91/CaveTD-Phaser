var players=[];
var vehicles=[];
var creatures=[];
var creatureIndex;
var priorityArray;
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
var pathfindingUpdateCounter=1;
var pathfindingUpdateMax=4;
var movementUpdateCounter=1;
var movementUpdateMax=4;
var pathfindingN=0;
var movementN=0;
var pathfindingSegmentSize;
var movementSegmentSize;


var latestKey;
import UIScene from './uiScene.js';
import {drawBorders} from './uiScene.js';
import Player from './player.js';
import Helper from './Helper.js';
import Vehicle from './Vehicle.js';
import {manageCamera} from './splitScreen.js';
import Tile from'./Tile.js';
import MapData from'./MapData.js';
import SavedMaps from './SavedMaps.js';
import Creature from './Creature.js';
import PriorityArray from './PriorityArray.js';
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
        //this.addVehicle(mapOffSetX+gridStep*3,mapOffSetY+gridStep*2);
        //this.addVehicle(mapOffSetX+gridStep*3,mapOffSetY+gridStep*4);

        selectedPlayer=-1;
        //one player by default
        this.addPlayer(mapOffSetX+gridStep,mapOffSetY);
        priorityArray=new PriorityArray();
        //this.setUpCreatures();
        this.setUpCreatures1();


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
            players: players, scene: this,uiScene:ui,mapData:mapData,vehicles:vehicles,creatures:creatures,priorityArray:priorityArray
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
        mapData.loadFromText(savedMaps.mapsArray[2]);
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
    update(time,delta)
    {
        this.updatePopup(delta);
        //run the player update method for each player
        for(let i = 0;i<players.length;i++)
        {
            players[i].update(delta);
        }
        if(Creature.playerMoveTimer>0)
        {
            Creature.playerMoveTimer-=delta;
        }
        else
        {
            //i've split the pathfinding and movement updates into segments, this way instead of doing all pathfinding and movements after every x seconds, it does a quarter of the pathfinding every x/8 seconds and after doing that 4 times, it does a quarter of the movement every x/8 seconds, so everythign is still happening in the same order, but not all at once, in theory i think this would result in a better performance but i don't know yet, you can increase the pathfindingUpdateMax and movementUpdateMax value to have it perform even more frequently
            //if this is the first segment of the update
            if(pathfindingUpdateCounter==1)
            {
                //this will clear the priority arrays but not the concat array
                priorityArray.clear();
                //we will loop over the creatures stored in the priorityArray.concat, but we only want to do a fraction of it per segmented update, so divide that array size into equal chunks - so if there are 17 creatures and the pathfindingUpdateMax is 4, then that's 4 creatures per pathfinding update segment - that would leave 1 creature as a remainder don't worry about any remainder that is handled later
                pathfindingSegmentSize = Math.floor(priorityArray.concat.length/pathfindingUpdateMax);
                pathfindingN=0;
            }
            //if we have not reached the end of the pathfinding update segment yet then loop through the segment size
            if(pathfindingUpdateCounter<pathfindingUpdateMax)
            {
                //update the pathfinding for all the creatures, this will give them a proposedPosition and add them to one of the 5 priority arrays. the first time this is run the creatures will all be in the stationary part of the priority array, but after that we will run through these in priority order.
                for( ; pathfindingN < pathfindingSegmentSize*pathfindingUpdateCounter ; pathfindingN ++)
                {
                    creatures[priorityArray.concat[pathfindingN].index].updatePathfinding(delta);
                } 
            }
            //else if we have reached the end of the pathfinding update segment then we should loop through the full priorityArray.concat.length, because there might be a few creatures left over as a remainder
            else if(pathfindingUpdateCounter==pathfindingUpdateMax)
            {
                for( ; pathfindingN < priorityArray.concat.length ; pathfindingN ++)
                {
                    creatures[priorityArray.concat[pathfindingN].index].updatePathfinding(delta);
                } 
            }
            //if we have incremented past the pathfinding update max then we are finished pathfinding, and are onto the movement updates now, it's a similar process, set up the segment size, then loop through, at the end of all the movement segemnts we reset the values so that we will start again at the pathfinding segment next time
            else 
            {
                if(movementUpdateCounter==1)
                {
                    //once the pathfinding is complete all creatures' index numbers will be added to the 5 priority arrays, this method will concat all index numbers into one big array
                    priorityArray.loopThroughAll();
                    movementSegmentSize = Math.floor(priorityArray.concat.length/movementUpdateMax);
                    movementN=0;
                }
                if(movementUpdateCounter<movementUpdateMax)
                {
                    //go through all the creatures and update their position, in order of the priority array
                    for( ; movementN < movementSegmentSize*movementUpdateCounter ; movementN ++)
                    {
                        creatures[priorityArray.concat[movementN].index].updatePosition(delta);
                    }
                }
                else if(movementUpdateCounter==movementUpdateMax)
                {
                    //go through all the creatures and update their position, in order of the priority array
                    for( ; movementN < priorityArray.concat.length ; movementN ++)
                    {
                        creatures[priorityArray.concat[movementN].index].updatePosition(delta);
                    }
                    //after each creature has moved, clear the priority array and reset the timing of the updates for creature movement
                    priorityArray.clear();
                    priorityArray.incrementPriority();
                    //reset these to 0, they will be incremented to 1 very shortly - before they are used again
                    pathfindingUpdateCounter=0;
                    movementUpdateCounter=0;
                }
                movementUpdateCounter++;
            }
            Creature.playerMoveTimer=Creature.playerMoveTimerStep/(pathfindingUpdateMax+movementUpdateMax);
            pathfindingUpdateCounter++;
        }
        
    }
    addPlayer(x,y)
    {
        selectedPlayer++;
        let p = new Player(this, x,y, 'dot',selectedPlayer,Helper.incrementColour(selectedPlayer,3),mapData);
        players.push(p);
        //the player's index is stored at the player's position in the map, make sure to update that 
        mapData.setPlayer(Helper.translatePosToMapPos({x:p.x,y:p.y}),p.index);
    }
    addVehicle(x,y)
    {
        vehicleIndex++;
        let v = new Vehicle(this,x ,y ,'dot','rubble',vehicleIndex,Helper.incrementColour(vehicleIndex,3),mapData);
        vehicles.push(v);
        //store the vehicle's index in the map at the vehicle's position 
        mapData.setVehicle(Helper.translatePosToMapPos({x:v.x,y:v.y}),v.index);
    }
    addCreature(x,y)
    {
        creatureIndex++;
        let c = new Creature(this, x,y, 'dot',creatureIndex,Helper.incrementColour(creatureIndex,3),mapData,priorityArray);
        creatures.push(c);
        mapData.setCreature(Helper.translatePosToMapPos({x:c.x,y:c.y}),c.index);
        //add the creature to the priority array, just so i can loop through the priority array to begin with, rather than looping through the creature array in the first update
        priorityArray.addAndSort(priorityArray.stationary,{index:creatureIndex,p:undefined},STATIONARY);
    }
    setUpCreatures1()
    {
        creatureIndex=-1;
/*
        this.addCreature(mapOffSetX+gridStep*(mapWidth-2),mapOffSetY+gridStep*(mapHeight-2));
        creatures[creatureIndex].setGoal({x:mapOffSetX+gridStep*0,y:mapOffSetY+gridStep*0});
*/
        this.addCreature(mapOffSetX+gridStep*10,mapOffSetY+gridStep*(mapHeight-2));
        creatures[creatureIndex].setGoal({x:mapOffSetX+gridStep*0,y:mapOffSetY+gridStep*0});

        priorityArray.loopThroughAll();
    }
    setUpCreatures()
    {
        creatureIndex=-1;
        //these 2 creatures are on the top row and should hit each other 
        this.addCreature(mapOffSetX+gridStep*20,mapOffSetY+gridStep*0);
        creatures[creatureIndex].setGoal({x:mapOffSetX+gridStep*1,y:mapOffSetY+gridStep*0});
        this.addCreature(mapOffSetX+gridStep*11,mapOffSetY+gridStep*0);
        creatures[creatureIndex].setGoal({x:mapOffSetX+gridStep*26,y:mapOffSetY+gridStep*0});
        //this is a continuous row of creatures that go east, notice that they get in each others way (without the priority array)
        this.addCreature(mapOffSetX+gridStep*3,mapOffSetY+gridStep*16);
        creatures[creatureIndex].setGoal({x:mapOffSetX+gridStep*16,y:mapOffSetY+gridStep*16});
        this.addCreature(mapOffSetX+gridStep*4,mapOffSetY+gridStep*16);
        creatures[creatureIndex].setGoal({x:mapOffSetX+gridStep*16,y:mapOffSetY+gridStep*16});
        this.addCreature(mapOffSetX+gridStep*5,mapOffSetY+gridStep*16);
        creatures[creatureIndex].setGoal({x:mapOffSetX+gridStep*16,y:mapOffSetY+gridStep*16});
        //this is a continuous row of creatures that go west, notice that these ones do not get in each other's way
        this.addCreature(mapOffSetX+gridStep*14,mapOffSetY+gridStep*16);
        creatures[creatureIndex].setGoal({x:mapOffSetX+gridStep*3,y:mapOffSetY+gridStep*16});
        this.addCreature(mapOffSetX+gridStep*15,mapOffSetY+gridStep*16);
        creatures[creatureIndex].setGoal({x:mapOffSetX+gridStep*3,y:mapOffSetY+gridStep*16});
        this.addCreature(mapOffSetX+gridStep*16,mapOffSetY+gridStep*16);
        creatures[creatureIndex].setGoal({x:mapOffSetX+gridStep*3,y:mapOffSetY+gridStep*16});
        //a dotted line moving down
        this.addCreature(mapOffSetX+gridStep*5,mapOffSetY+gridStep*1);
        creatures[creatureIndex].setGoal({x:mapOffSetX+gridStep*5,y:mapOffSetY+gridStep*11});
        this.addCreature(mapOffSetX+gridStep*5,mapOffSetY+gridStep*3);
        creatures[creatureIndex].setGoal({x:mapOffSetX+gridStep*5,y:mapOffSetY+gridStep*11});
        this.addCreature(mapOffSetX+gridStep*5,mapOffSetY+gridStep*5);
        creatures[creatureIndex].setGoal({x:mapOffSetX+gridStep*5,y:mapOffSetY+gridStep*11});
        //a dotted line moving east
        this.addCreature(mapOffSetX+gridStep*0,mapOffSetY+gridStep*7);
        creatures[creatureIndex].setGoal({x:mapOffSetX+gridStep*11,y:mapOffSetY+gridStep*7});
        this.addCreature(mapOffSetX+gridStep*2,mapOffSetY+gridStep*7);
        creatures[creatureIndex].setGoal({x:mapOffSetX+gridStep*11,y:mapOffSetY+gridStep*7});
        this.addCreature(mapOffSetX+gridStep*4,mapOffSetY+gridStep*7);
        creatures[creatureIndex].setGoal({x:mapOffSetX+gridStep*11,y:mapOffSetY+gridStep*7});
        //4 creatures colliding from 4 directions
        this.addCreature(mapOffSetX+gridStep*17,mapOffSetY+gridStep*11);
        creatures[creatureIndex].setGoal({x:mapOffSetX+gridStep*17,y:mapOffSetY+gridStep*17});
        this.addCreature(mapOffSetX+gridStep*17,mapOffSetY+gridStep*17);
        creatures[creatureIndex].setGoal({x:mapOffSetX+gridStep*17,y:mapOffSetY+gridStep*11});
        this.addCreature(mapOffSetX+gridStep*14,mapOffSetY+gridStep*14);
        creatures[creatureIndex].setGoal({x:mapOffSetX+gridStep*20,y:mapOffSetY+gridStep*14});
        this.addCreature(mapOffSetX+gridStep*20,mapOffSetY+gridStep*14);
        creatures[creatureIndex].setGoal({x:mapOffSetX+gridStep*14,y:mapOffSetY+gridStep*14});

        //a continuous line of creatures going down
        this.addCreature(mapOffSetX+gridStep*25,mapOffSetY+gridStep*1);
        creatures[creatureIndex].setGoal({x:mapOffSetX+gridStep*25,y:mapOffSetY+gridStep*18});
        this.addCreature(mapOffSetX+gridStep*25,mapOffSetY+gridStep*2);
        creatures[creatureIndex].setGoal({x:mapOffSetX+gridStep*25,y:mapOffSetY+gridStep*18});
        this.addCreature(mapOffSetX+gridStep*25,mapOffSetY+gridStep*3);
        creatures[creatureIndex].setGoal({x:mapOffSetX+gridStep*25,y:mapOffSetY+gridStep*18});
        this.addCreature(mapOffSetX+gridStep*25,mapOffSetY+gridStep*4);
        creatures[creatureIndex].setGoal({x:mapOffSetX+gridStep*25,y:mapOffSetY+gridStep*18});
        this.addCreature(mapOffSetX+gridStep*25,mapOffSetY+gridStep*5);
        creatures[creatureIndex].setGoal({x:mapOffSetX+gridStep*25,y:mapOffSetY+gridStep*18});
        this.addCreature(mapOffSetX+gridStep*25,mapOffSetY+gridStep*6);
        creatures[creatureIndex].setGoal({x:mapOffSetX+gridStep*25,y:mapOffSetY+gridStep*18});
        this.addCreature(mapOffSetX+gridStep*25,mapOffSetY+gridStep*7);
        creatures[creatureIndex].setGoal({x:mapOffSetX+gridStep*25,y:mapOffSetY+gridStep*18});
        //one creature trying to go across
        this.addCreature(mapOffSetX+gridStep*26,mapOffSetY+gridStep*7);
        creatures[creatureIndex].setGoal({x:mapOffSetX+gridStep*20,y:mapOffSetY+gridStep*7});

        //once we added all the creatures loopThroughAll in the priority array to set teh concat array
        priorityArray.loopThroughAll();
    }
    //sometimes the creatures will swap position with another creature, but creature's don't have access to each other so do it here
    updateCreaturePos(id,v)
    {
        creatures[id].moveCreature(v);        
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


const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: [Game, UIScene]
    
};

const game = new Phaser.Game(config);
