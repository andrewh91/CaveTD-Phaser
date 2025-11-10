var players=[];
var vehicles=[];
var creatures=[];
var deadCreatures=[];
var creatureWaitingRoom=[];
var creatureBases=[];
var resources=[];
var creatureIndex;
var creatureBaseIndex;
var resourceIndex;
var priorityArray;
var vehicleIndex;
var tiles=[];
var mapData;
var savedMaps;
var terrainColours= [];
var cursors;
var newCursors=[];
var createPlayerFlag=false;
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
var shoutOutLog=[];
var bloodStainValue=1;

/* 20251107*/
var warriorGroupMap= new Map();
var warriorGroupCounter = 0;

var latestKey;
import UIScene, { drawGridCoords } from './uiScene.js';
import {drawBorders} from './uiScene.js';
import Player from './Player.js';
import Helper from './Helper.js';
import Vehicle from './Vehicle.js';
import {manageCamera} from './splitScreen.js';
import Tile from'./Tile.js';
import MapData from'./MapData.js';
import SavedMaps from './SavedMaps.js';
import Creature from './Creature.js';
import Resource from './Resource.js';
import PriorityArray from './PriorityArray.js';
import CreatureBase from './CreatureBase.js';
class Game extends Phaser.Scene
{
    constructor()
    {
        super({ key: 'game' });
    }
    preload()
    {
        this.load.setBaseURL();
        this.load.image('dot', 'dot.png');
        this.load.image('rubble', 'dot.png');
        this.load.image('trailer', 'trailer.png');
    }   
    create()
    {
        this.printControls();
        this.mainCamera = this.cameras.main;
        
        
        this.setUpMap();

        vehicleIndex=-1;
        this.addVehicle({tx:3,ty:2});
        //this.addVehicle({tx:4,ty:3});

        selectedPlayer=-1;
        //one player by default
        this.addPlayer({tx:1,ty:1});
        priorityArray=new PriorityArray();
        this.setUpResources();
        this.setUpCreatureBases();
        this.setUpCreatures5();
        this.setUpDeadCreatures();


        this.input.keyboard.on('keydown-P', this.onPressP, this);
        this.input.keyboard.on('keydown-R', this.onPressR, this);
        this.input.keyboard.on('keydown-K', this.onPressK, this);
        if(testing)
        {
            this.input.keyboard.on('keydown-C', this.onPressC, this);
        }
        this.scene.launch('uiScene');
        this.ui;
        this.ui=this.scene.get("uiScene");
        this.ui.cameraTextArray=[];
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
            players: players, scene: this,uiScene:this.ui,mapData:mapData,vehicles:vehicles,creatures:creatures,priorityArray:priorityArray,creatureBases:creatureBases,shoutOutLog:shoutOutLog
        }
        if(testing)
        {
            //this will be altered in the updateMouse method
            this.ui.cameraTextArray.push(this.ui.add.text(10,10 , 'Mouse position', { fontSize: '32px', fill: '#ff0000', wordWrap: { width: 560 } }));
            this.ui.cameraTextArray[0].setScrollFactor(0);
        }
    }
    //print the controls to the console log
    printControls()
    {
        console.log("use the arrow keys to move player1");
        console.log("move player ontop of vehicle and use shift to enter");
        console.log("when in vehicle:");
        console.log(" use shift to exit");
        console.log(" move ontop of rubble or wall to dig it up");
        console.log(" press space to switch between dig and dump mode");
        console.log(" in dump mode press arrow key to dump rubble in that direction");
        console.log("press p to create a new player with camera, follow prompt to set up controls for that player ");
        console.log("press r to remove the most recent camera");
        console.log("press c to advance time");
        console.log("press k to kill the first creature in the array");
        console.log("the godMode and testing variable in the index file can be altered to help testing and debug and map creation etc");
        console.log("");
    }
    onPressP()
    {
        this.ui.showNewPlayerDialog();
        createPlayerFlag=true;
        /*make a new player at this player's position, and select it so the cursor keys move the new player*/
        let tx = players[selectedPlayer].tx;
        let ty = players[selectedPlayer].ty;
        this.addPlayer({tx:tx,ty:ty});
        selectedPlayer=players.length-1;
        //use the world coords for the camera
        addCamera(this,players[selectedPlayer].x,players[selectedPlayer].y);
    }
    onPressR()
    {
        removeCamera(this);
    }
    onPressK()
    {
        if(testing)
        {
            for(let i = 0 ; i < creatures.length ; i ++ )
            {
                if(creatures[i].alive)
                {
                    creatures[i].kill();
                    break;
                }
            }
        }
    }
    onPressC()
    {
        Creature.playerMoveTimer=0;
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
                this.ui.updateDialog(e.key);
                newCursors.push(e.keyCode);
                this.ui.updateDialog('Press any key to confirm.');
            }
            else if(newCursors.length>numberOfKeys)
            {  
                this.ui.updateDialog(e.key);
                newCursors.push(e.keyCode);
                //newcursors[0] will be p as that's what we pushed to create a new player
                cursors=(this.input.keyboard.addKeys({left:newCursors[1],right:newCursors[2],up:newCursors[3],down:newCursors[4],space:newCursors[5],shift:newCursors[6]}));
                players[players.length-1].updateCursors(cursors.left,cursors.right,cursors.up,cursors.down, cursors.space,cursors.shift);
                console.log(newCursors);
                console.log(players[players.length-1].cursors);
                console.log(cursors);
                newCursors=[];
                createPlayerFlag=false;
                this.ui.hideDialog();
            } 
            else if(newCursors.length==0)
            {
                //ignore the first one as that will just be the p key which created the player in the first place
                newCursors.push(e.keyCode);
            }
            else
            {
                this.ui.updateDialog(e.key);
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
           mapData.tiles.push(new Tile(this,mapData,'dot',i,mapData.terrainColours[pathTerrain],pathTerrain));
        }
        //the map is 27 across by 18 down, 
        savedMaps = new SavedMaps();
        mapData.loadFromText(savedMaps.mapsArray[6]);
    }
    //this will be called by the player when the player presses shift on the vehicle 
    enterVehicle(p,v)
    {
        console.log("entered");
        //give the vehicle a player index to show it is occupied by this player
        vehicles[v].playerIndex=p;
        //popups should use real world coords
        this.addPopup("Player "+p+" entered Vehicle "+v,{x:players[p].x,y:players[p].y},2000);
        
    }
    exitVehicle(v)
    {
        this.addPopup("Player "+vehicles[v].playerIndex+" exited Vehicle "+v,{x:vehicles[v].x,y:vehicles[v].y},2000);
        vehicles[v].playerIndex=-1;
    }
    addPopup(text,vector,time)
    {
        this.ui.updatePopupText(text,vector);
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
            this.ui.hidePopupText();
            //set this to 0 just so we don't call this.ui.hidePopupText all the time
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
        this.updateMouse();
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
                    
                    //add any creatures that are waiting to be created, 
                    this.processCreatureWaitingRoom();
                    //if you add a creature you need to call loopThroughAll
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
            if(testing)
            {
                Creature.playerMoveTimer=1000*60*60*24;
            }
            pathfindingUpdateCounter++;
        }
        
    }
    updateMouse()
    {
        drawGridCoords(this,creatures,mapData);
    }
    addPlayer(v)
    {
        selectedPlayer++;
        let tempV = Helper.translateTilePosToWorldPos(v);
        let p = new Player(this, tempV.x,tempV.y, 'dot',selectedPlayer,Helper.incrementColour(selectedPlayer,3),mapData);
        players.push(p);
        //the player's index is stored at the player's position in the map, make sure to update that 
        mapData.setPlayer(v,p.index);
    }
    addVehicle(v)
    {
        vehicleIndex++;
        let tempV = Helper.translateTilePosToWorldPos(v);
        let vehicle = new Vehicle(this,tempV.x ,tempV.y ,'dot','rubble',vehicleIndex,Helper.incrementColour(vehicleIndex,3),mapData);
        vehicles.push(vehicle);
        //store the vehicle's index in the map at the vehicle's position 
        mapData.setVehicle(v,vehicle.index);
    }
    //if i add a creature mid game, it can sort of be deleted by the priority array if added at the wrong time in the update, so add them to a waiting room and then at the correct time process the waiting room 
    addCreatureToWaitingRoom(v)
    {
        creatureWaitingRoom.push(v);
    }
    //so at the right moment in the update, we will get the length of the waiting room = (i), then in a loop remove the first creature (i) number of times
    processCreatureWaitingRoom()
    {
        let tempcreature;
        let j = 0;
        for(let i = creatureWaitingRoom.length; i>0; i--)
        {
            tempcreature = creatureWaitingRoom.slice(j,j+1)[0];
            //if there is not already a creature on that space then create a creature here
            if(mapData.getCreatureIndex(tempcreature)==-1)
            {
                creatureWaitingRoom.splice(j,1);
                
                this.addCreature(tempcreature);
            }
            else
            {
                j++;
            }
        }
    }
    //when a creature is killed we add its index to this array for reuse
    addDeadCreature(i)
    {
        deadCreatures.push(i);
    }
    addCreature(v)
    {
        //first check if there is a dead creature index we can reuse, 
        let creatureIndexToUse = -1;
        let reuseDeadCreature=false;
        for(let i = 0 ; i < deadCreatures.length; i++)
        {
            reuseDeadCreature=true;
            creatureIndexToUse=deadCreatures[i];
            //remove that index from the deadCreatures array
            deadCreatures.splice(i,1);
            break;
        }
        //if there are no dead creatures, we need to make a new creature
        if(reuseDeadCreature==false)
        {
            creatureIndex++;
            creatureIndexToUse = creatureIndex;
    
            let tempV = Helper.translateTilePosToWorldPos(v);
            let c = new Creature(this, tempV.x,tempV.y, 'dot','trailer',creatureIndexToUse,Helper.incrementColour(creatureIndexToUse,3),mapData,priorityArray,bloodStainValue,v.type);
            /*the v data might include a goal vector gx,gy*/
            if(v.gx!=undefined)
            {
                let tempG = {tx:v.gx,ty:v.gy};
                c.setGoal(tempG);
            }
            creatures.push(c);        
            //add the creature to the priority array, just so i can loop through the priority array to begin with, rather than looping through the creature array in the first update
            priorityArray.addAndSort(priorityArray.stationary,{index:creatureIndexToUse,p:undefined},STATIONARY);
        }
        else
        {
            let tempV = Helper.translateTilePosToWorldPos(v);
            //if we are reusing a dead creature, we can just call the reset method to reset most variables and give it a new position 
            creatures[creatureIndexToUse].x=tempV.x;
            creatures[creatureIndexToUse].y=tempV.y;
            creatures[creatureIndexToUse].tx=v.tx;
            creatures[creatureIndexToUse].ty=v.ty;
            creatures[creatureIndexToUse].type=v.type;
            creatures[creatureIndexToUse].reset();
            /*the v data might include a goal vector gx,gy*/
            if(v.gx!=undefined)
            {
                let tempG = {tx:v.gx,ty:v.gy};
                creatures[creatureIndexToUse].setGoal(tempG);
            }
            //add the creature to the priority array, just so i can loop through the priority array to begin with, rather than looping through the creature array in the first update
            priorityArray.addAndSort(priorityArray.stationary,{index:creatureIndexToUse,p:undefined},STATIONARY);
        }
        mapData.setCreature({tx:v.tx,ty:v.ty},creatureIndexToUse);

        if(mapData.getExploredNumber({tx:v.tx,ty:v.ty})==-1)
        {
            mapData.setExploredNumber({tx:v.tx,ty:v.ty},0);
        }
    }
    addCreatureBase(v)
    {
        creatureBaseIndex++;
        let tempV = Helper.translateTilePosToWorldPos(v);
        let c= new CreatureBase(this,tempV.x,tempV.y,'dot',creatureBaseIndex,0x00ff00,mapData);
        creatureBases.push(c);
        mapData.setCreatureBaseIndex({tx:c.tx,ty:c.ty},c.index);
    }
    addResource(v,health)
    {
        let tempV = Helper.translateTilePosToWorldPos(v);
        //check if there is already a resource
        let exisitingResourceIndex = mapData.getResourceIndex(v);
        if (exisitingResourceIndex>-1)
        {
            let totalHealth = resources[exisitingResourceIndex].health + health;
            resources[exisitingResourceIndex].health=totalHealth;
            this.setResourceMarkerOnMap(v,totalHealth); 
        }
        else
        {
            resourceIndex++;
            let r = new Resource(this, tempV.x,tempV.y, 'dot',resourceIndex,health);
            resources.push(r);
            mapData.setResourceIndex({tx:r.tx,ty:r.ty},r.index);
        }
    }
    addBloodStain(v,value)
    {
        let currentBloodStain = mapData.getBloodStain(v);
        mapData.setBloodStain(v,currentBloodStain+value);
    }
    
    setBloodStain(v,value)
    {
        mapData.setBloodStain(v,value);
    }
    
    setUpResources()
    {
        resourceIndex=-1;
        
        this.addResource({tx:15,ty:6},10);
        this.addResource({tx:12,ty:16},10);
        this.addResource({tx:18,ty:16},10);
    }
    setUpCreatureBases()
    {
        creatureBaseIndex=-1;
        this.addCreatureBase({tx:15,ty:16});
    }
    setUpCreatures()
    {
        creatureIndex=-1;
        //these 2 creatures are on the top row and should hit each other 
        this.addCreatureToWaitingRoom({tx:20,ty:0,gx:1,gy:0,type:WORKER});
        this.addCreatureToWaitingRoom({tx:11,ty:0,gx:26,gy:0,type:WORKER});
        //this is a continuous row of creatures that go east, notice that they get in each others way (without the priority array)
        this.addCreatureToWaitingRoom({tx:3,ty:16,gx:16,gy:16,type:WORKER});
        this.addCreatureToWaitingRoom({tx:4,ty:16,gx:16,gy:16,type:WORKER});
        this.addCreatureToWaitingRoom({tx:5,ty:16,gx:16,gy:16,type:WORKER});
        //this is a continuous row of creatures that go west, notice that these ones do not get in each other's way
        this.addCreatureToWaitingRoom({tx:14,ty:16,gx:3,gy:16,type:WORKER});
        this.addCreatureToWaitingRoom({tx:15,ty:16,gx:3,gy:16,type:WORKER});
        this.addCreatureToWaitingRoom({tx:16,ty:16,gx:3,gy:16,type:WORKER});
        //a dotted line moving down
        this.addCreatureToWaitingRoom({tx:5,ty:1,gx:5,gy:11,type:WORKER});
        this.addCreatureToWaitingRoom({tx:5,ty:3,gx:5,gy:11,type:WORKER});
        this.addCreatureToWaitingRoom({tx:5,ty:5,gx:5,gy:11,type:WORKER});
        //a dotted line moving east
        this.addCreatureToWaitingRoom({tx:0,ty:7,gx:11,gy:7,type:WORKER});
        this.addCreatureToWaitingRoom({tx:2,ty:7,gx:11,gy:7,type:WORKER});
        this.addCreatureToWaitingRoom({tx:4,ty:7,gx:11,gy:7,type:WORKER});
        //4 creatures colliding from 4 directions
        this.addCreatureToWaitingRoom({tx:17,ty:11,gx:17,gy:17,type:WORKER});
        this.addCreatureToWaitingRoom({tx:17,ty:17,gx:17,gy:11,type:WORKER});
        this.addCreatureToWaitingRoom({tx:14,ty:14,gx:20,gy:14,type:WORKER});
        this.addCreatureToWaitingRoom({tx:20,ty:14,gx:14,gy:14,type:WORKER});

        //a continuous line of creatures going down
        this.addCreatureToWaitingRoom({tx:25,ty:1,gx:25,gy:18,type:WORKER});
        this.addCreatureToWaitingRoom({tx:25,ty:2,gx:25,gy:18,type:WORKER});
        this.addCreatureToWaitingRoom({tx:25,ty:3,gx:25,gy:18,type:WORKER});
        this.addCreatureToWaitingRoom({tx:25,ty:4,gx:25,gy:18,type:WORKER});
        this.addCreatureToWaitingRoom({tx:25,ty:5,gx:25,gy:18,type:WORKER});
        this.addCreatureToWaitingRoom({tx:25,ty:6,gx:25,gy:18,type:WORKER});
        this.addCreatureToWaitingRoom({tx:25,ty:7,gx:25,gy:18,type:WORKER});
        //one creature trying to go across
        this.addCreatureToWaitingRoom({tx:26,ty:7,gx:20,gy:7,type:WORKER});

        //once we added all the creatures loopThroughAll in the priority array to set teh concat array
        priorityArray.loopThroughAll();
    }
    setUpCreatures1()
    {
        creatureIndex=-1;

        this.addCreatureToWaitingRoom({tx:25,ty:5,gx:0,gy:0,type:WORKER});

        this.addCreatureToWaitingRoom({tx:23,ty:16,gx:0,gy:0,type:WORKER});

        priorityArray.loopThroughAll();
    }
    setUpCreatures2()
    {
        creatureIndex=-1;

        this.addCreatureToWaitingRoom({tx:(mapWidth-2),ty:(mapHeight-2),gx:0,gy:0,type:WORKER});

        this.addCreatureToWaitingRoom({tx:12,ty:(mapHeight-2),gx:0,gy:0,type:WORKER});

        priorityArray.loopThroughAll();
    }
    setUpCreatures3()
    {
        creatureIndex=-1;

        this.addCreatureToWaitingRoom({tx:15,ty:10,gx:0,gy:0,type:WORKER});
        this.addCreatureToWaitingRoom({tx:15,ty:10,gx:0,gy:0,type:WORKER});
        this.addCreatureToWaitingRoom({tx:15,ty:10,gx:0,gy:0,type:WORKER});
        this.addCreatureToWaitingRoom({tx:15,ty:10,gx:0,gy:0,type:WORKER});
        this.addCreatureToWaitingRoom({tx:15,ty:10,gx:0,gy:0,type:WORKER});
        this.addCreatureToWaitingRoom({tx:15,ty:10,gx:0,gy:0,type:WORKER});
        this.addCreatureToWaitingRoom({tx:15,ty:10,gx:0,gy:0,type:WORKER});
        this.addCreatureToWaitingRoom({tx:15,ty:10,gx:0,gy:0,type:WORKER});

        priorityArray.loopThroughAll();
    }
    setUpCreatures4()
    {
        creatureIndex=-1;
        this.addCreatureToWaitingRoom({tx:15,ty:16,gx:0,gy:0,type:WORKER});
        this.addCreatureToWaitingRoom({tx:15,ty:16,gx:0,gy:0,type:WORKER});
        this.addCreatureToWaitingRoom({tx:15,ty:16,gx:0,gy:0,type:WORKER});
        this.addCreatureToWaitingRoom({tx:15,ty:16,gx:0,gy:0,type:WORKER});
        priorityArray.loopThroughAll();
    }
    setUpCreatures5()
    {
        creatureIndex=-1;
        this.addCreatureToWaitingRoom({tx:15,ty:16,gx:0,gy:0,type:WORKER});
        this.addCreatureToWaitingRoom({tx:15,ty:16,gx:0,gy:0,type:WORKER});
        priorityArray.loopThroughAll();
    }
    setUpDeadCreatures()
    {
        deadCreatures = [];
    }
    //sometimes the creatures will swap position with another creature, but creature's don't have access to each other so do it here
    updateCreaturePos(id,v)
    {
        creatures[id].moveCreature(v);        
    }
    //when you create a new resource, either during set up or when the creature drops a resource, call this to set a marker equal to the health of the resource. also if the resource is dropped on an existing resource, we should combine the health of the resources and set a marker equal to the combined health
    setResourceMarkerOnMap(v,i)
    {
        mapData.setResourceMarker(v,i);
    }
    decrementResourceMarkerOnMap(v)
    {
        let current = mapData.getResourceMarker(v);
        if(current>-1)
        {
            //subtract 1 from the resourceMarker
            mapData.setResourceMarker(v,current-1);
        }
    }
    addResourceToCreatureBase(index)
    {
        creatureBases[index].addResource();
    }
    /*20251027 when the creature is adjacent to the creature base and it warned the base of a new bloodstain, the base should start producing warriors to address that threat */
    warnCreatureBase(index,bloodStainValue)
    {
        creatureBases[index].addThreat(bloodStainValue);
    }
    //problem:newlyDiscovered
    //this will return true if it is a newlyDiscovered resource
    collectResource(index)
    {
        return resources[index].collect();
    }
    getResourceHealth(index)
    {
        return resources[index].health;
    }
    getCreature(index)
    {
        return creatures[index];
    }
    /* 20251107 warriors will form groups, this is mainly a way for them to know the combined strength of the group. i'm using maps instead of arrays since i will want to delete the items in the array when all the creatures die, and then my groupId that i use to access the array would not work */
    getWarriorGroupStrength(key)
    {
        return warriorGroupMap.get(key);
    }
    setWarriorGroupStrength(key,newCombinedStrength)
    {
        warriorGroupMap.set(key,newCombinedStrength);
    }
    newWarriorGroup(strength)
    {
        warriorGroupMap.set(warriorGroupCounter++,strength);
        return warriorGroupCounter-1;
    }
    addWarriorGroupStrength(key,strength,otherWarriorIndex)
    {
        /* the key we pass in will be the group key of the other warrior that we just pushed into. if that is -1 then make a new group, use the strength of both warriors, and make sure to make that first warrior aware of the groupKey */
        if(key==-1)
        {
            let otherWarrior = this.getCreature(otherWarriorIndex);
            let newGroupKey= this.newWarriorGroup(strength+otherWarrior.strengthValue);
            otherWarrior.warriorGroupKey = newGroupKey;
            return newGroupKey;
        }
        let newCombinedStrength = this.getWarriorGroupStrength(key) + strength;
        this.setWarriorGroupStrength(key,newCombinedStrength);
        return key;
    }
    /* this method will remove the group if the strength is reduced to 0*/
    subtractWarriorGroupStrength(key,strength)
    {
        let newCombinedStrength = this.getWarriorGroupStrength(key) - strength;
        if(newCombinedStrength<=0)
        {
            warriorGroupMap.delete(key);
        }
        else
        {
            this.setWarriorGroupStrength(key,newCombinedStrength);
        }
    }
    /* 20251110 this will be called when a warrior wants to move on top of another warrior that is waiting for reinforcements*/
    pushUpAdjacent(index)
    {
        creatures[index].complyWithPushUp();
    }
    //sometimes trailers containing rubble will be destroyed - when the creature dies- and the rubble should be added to the map at the trailer position 
    addTrailerRubble(v)
    {
        let terrain = mapData.getTerrain(v);
        mapData.setTerrain(v,terrain+1);
    }
    //this will be called from the creature class everytime it does something
    updateShoutOutLog(text)
    {
        shoutOutLog.push(text);
    }
}
//I want additional players to be able to join at any time, that means we need to add a new camera and adjust the size of existing cameras on the fly. but you could also use this when you're not adding a new camera, maybe a gameplay feature would be to have another camera to keep an eye on something
function addCamera(scene,x,y)
{
    //add a new camera, and adjust the other cameras to fit, the default size will be changed soon enough so these figures don't matter too much
    let newCamera = scene.cameras.add(0,0,800,600).setZoom(1);
    //TODO remove this, this is just for debugging
    if(testing)
    {
        let t = scene.ui.add.text(10,20 , 'Mouse position', { fontSize: '32px', fill: '#ff0000', wordWrap: { width: 560 } });
        scene.ui.cameraTextArray.push(t);
        t.setScrollFactor(0);
    }
    //this is my code to organise the on screen position and size of the cameras
    manageCamera(scene);
    //target the camera at the given position
    newCamera.setScroll(x-newCamera.width/2,y-newCamera.height/2);
    console.log(newCamera);
    //redraw the border in the this.ui - a red border is currently drawn around each camera
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
        if(testing)
        {
            scene.ui.cameraTextArray.pop().destroy();
        }
        
    }
}


const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: [Game, UIScene],
    pixelArt: true
    
};

const game = new Phaser.Game(config);
