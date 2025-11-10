import Helper from './Helper.js';
import PotentialTunnel from './PotentialTunnel.js';
import Trailer from './Trailer.js';
export default class Creature extends Phaser.GameObjects.Sprite 
{    
    //this many milliseconds must pass before the player is allowed to make a move
    static playerMoveTimerStep=500;
    static playerMoveTimer=Creature.playerMoveTimerStep;
    //these are the available options, 8 directions, this is static so i don't have to remake it for every creature
    static dirArray=[
        {tx: 0,ty:-1},
        {tx: 1,ty:-1},
        {tx: 1,ty: 0},
        {tx: 1,ty: 1},
        {tx: 0,ty: 1},
        {tx:-1,ty: 1},
        {tx:-1,ty: 0},
        {tx:-1,ty:-1}
    ];
    constructor(scene, x, y, texture,trailerTexture,index,colour,map,priorityArray,bloodStainValue,type) 
    {
        super(scene, x, y, texture);
        this.scene=scene;
        //the tx is a more useful way of figuring out where the player is in the world, this.x is the world coord, but this is a grid based game, and the player could be at position (60,10) in order to figure out where the player is you would need to know what the gridstep is, and that the grid does not start at 0,0, it has an offset, so (60,10) could be (2,0) tile position if the gridstep is 25 and the offset is (10,10)
        this.tx=(this.x-mapOffSetX)/gridStep;
        this.ty=(this.y-mapOffSetY)/gridStep;
        this.texture=texture;
        this.trailerTexture=trailerTexture;
        this.index=index;
        scene.add.existing(this);
        //i've made the player image be the same size as the value it can move in one go 
        this.setScale(gridStep);
        //this is a simple way to give the player a colour based on it's index, so each player should look a little different
        this.setTint(colour);
        this.text = scene.add.text(this.x, this.y, 'c'+this.index, { fontSize: '20px', fill: '#fff'});
        this.shoutOutText = scene.add.text(this.x, this.y, '', { fontSize: '20px', fill: '#ff7307ff'});
        this.shoutOutTimer=0;
        this.shoutOutTimerMax = 1000;
        //pass in a reference to the map data, so we can query the map to see if there is a wall etc
        this.map=map;
        this.priorityArray=priorityArray;
        //add a sprite so i can see where the proposed pos is 
        this.proposedPosSprite = new Phaser.GameObjects.Sprite(scene,undefined,undefined,texture);
        scene.add.existing(this.proposedPosSprite);
        this.proposedPosSprite.setTint(0x00ff00);
        this.proposedPosSprite.setScale(gridStep/5);
        this.bloodStainValue=bloodStainValue;
        /*20251027 the type will be WORKER or WARRIOR, this will effect its behaviour for example if it runs from warnings*/
        this.type=type;
        /*20251021 when it sees a warning set to true, set to false if retrned to base or finds an unexplored tile*/
        this.seenWarningBool=false;

        /* 20251030 this indicates that the warrior has just been born and has not moved off the base yet*/
        this.stepOff = true;


        /*20251106 useful for when pushing up */
        this.waitingForReinforcements=false;
        //the rest of the variables i will put in this reset method, which will be called when the creature is reused after being killed
        this.reset();

        
    } 
    reset()
    {
        Helper.centreText(this);
        Helper.centreShoutOutText(this);
        this.goal={tx:this.tx,ty:this.ty};
        this.oldGoal={tx:undefined,ty:undefined};
        //we may start tunnelling if we change direction, that's assuming that we changed direction due to hitting a wall, if we changed direction due to getting a new goal, then we set this flag so that we ignore that change in direction for tunnelling purposes
        this.newGoal=false;
        this.proposedPos={tx:undefined,ty:undefined};
        this.oldProposedPos={tx:undefined,ty:undefined};;
        //the memory can be various things, but related to pathfinding
        this.memory=[];
        //use this to store the previous position, we will update this in the move method and the swapCreatureWith method 
        this.memoryDirection=STATIONARY;
        //pathfinding bools, some bools like shortcutMode always start off as false, but these bools below, might be true of false depending on what pathfinding method we have chosen, this is all handled in the setPathfindingMethod method
            //rememberTail will be used for tail3 pathfinding
            this.rememberTail=false;
            //rememberWall will be used for wallRunner4 pathfinding, it will overwrite rememberTail
            this.rememberWall=true;
            //some creatures can dig, if so make this true
            this.useTunnel=false;
            //for wall runners, the direction can be RIGHT or LEFT
            this.wallRunnerDirection = RIGHT;
            //if the creature is an explorer this should be true
            this.allowAlterExplorerNumber=true;
        
        this.shortcutMode=false;
        this.cancelMove=false;
        this.encounteredWall=false;
        this.potentialTunnelArray =[];
        this.trailerArray=[];
        this.distToPotentialTunnelStartPos=0;



        //if walking over rubble we will walk slower, this is achieved by using this flag, if this is set to true we skip one movement and one pathfinding update
        this.skipMovement=false;
        this.resetPreferredDirection();
        
        //the explorer pathfinding will use this 
        this.carryingResource=false;
        //if the creature reaches a resource and is currently on a tile that does not already have a resource marker, then we consider that resource to be newly discovered, record how many resources are left in this variable and record that info on the tiles heading back to base so the creatures no how many resources are available
        this.noOfResourcesDiscovered=0;
        this.exploredNumber=0;
        this.exploringWhileCarrying=false;
        //if the explorer hits a dead end it should back track until it find unexplored tiles. 
        this.exploredDeadEnd=false;
        //this is a variable to hold the pathfinding method function of choice
        this.pathfindingMethod;
        this.setPathfindingMethod(7);
        //problem:newlyDiscovered
        //this variable will be true if the creature picked up the first resource in a resource pool, it will help the creature decide to follow the shortest explored number path, normally we would follow the resource marker path but if this is newly discovered then there likely is no resource marker path and if there is it will be going back to where the resource was, not back to the base as this would likely only happen if the previous creature to carry it was killed.  
        this.newlyDiscovered=false;

        this.valueOfDiscoveredBloodStain=-1;
        this.alive=true;
        this.visible=true;
        this.text.visible=true;
        this.shoutOutText.visible=true;
        this.proposedPosSprite.visible=true;
        this.proposedPosSprite.x=undefined;
        this.proposedPosSprite.y=undefined;

        this.seenWarningBool=false;
        this.stepOff = true;        
        /*20251030 this is a multiplier for the warning value, if it is less than 1 then the group could pursue the threat even though they are not strong enough, if it is more than 1, like for example if it was 3 then the group will wait until they are 3 times stronger than the threat.*/
        this.cautiousness = 3;
        this.waitingForReinforcements=false;
        this.warriorGroupKey=-1;
        this.strengthValue=1;
        /* 20251110 if we have been told to push up this will be set to true, that will override the pathfinding to push up one space, when we push up it wil go back to false*/
        this.pushUp = false;
        /*20251110 if we push up we add our strength, and tell the warriors in front to move fowards, if they can't move forwards the strength would be added again, so this bool makes sure it happens just once. will need to reset it once the battle is over though... or when return to base*/
        this.addedStrength = false;
    }
    resetPreferredDirection()
    {
        this.shoutOut('new direction');
        let tempx;
        let tempy;
        //i don't want this to be random while testing
        if(testing)
        {    
            tempx = Creature.dirArray[this.index%8].tx;
            tempy = Creature.dirArray[this.index%8].ty;
        }
        else
        {
            let tempRand = Math.floor(Math.random()*8);
            tempx = Creature.dirArray[tempRand].tx;
            tempy = Creature.dirArray[tempRand].ty;
        }

        this.explorerDirectionOriginal={tx:tempx,ty:tempy};
        this.explorerDirection={tx:tempx,ty:tempy};
        // i want the explorerDirectionOriginal to be one of 8 possible values, so it could be {1,1}, but i don't want the creatures to actually move diagonally, so i'm going to use these bools to turn either the x or y to a 0 then toggle the bool, this way the ones that want to go diagonally north east will just switch their preference between north and east every update
        this.explorerDirectionBoolToggle=false;
        //this will be true if the random direction ended up being diagonal
        this.explorerDirectionDiagonal=tempx*tempy !==0;
    }
    updatePathfinding(delta)
    {
        if(this.alive)
        {
            this.fadeShoutOut();
            //the timing of this update will happen in the main.js 
            //save the old proposed pos so we can clear the contested data if this creature is killed, or decides to change direction 
            this.oldProposedPos=this.proposedPos;
            this.oldProposedDirection=this.proposedDirection();
            this.proposedPos=this.pathfinding();
            //check if the new proposed pos is the same as the old proposed pos, if so ok, if not we potentially need to clear the contested data for that old proposed pos
            if(Helper.vectorEquals(this.oldProposedPos,this.proposedPos)==false)
            {
                this.map.clearContestedDirection(this.oldProposedPos,this.oldProposedDirection);
            }
            if(this.proposedPos)
            {
                let tempV = Helper.translateTilePosToWorldPos(this.proposedPos);
                this.proposedPosSprite.x=tempV.x;
                this.proposedPosSprite.y=tempV.y;
                this.proposedPosSprite.visible=true;
                /*20251101 make the proposed pos sprite a line instead of a dot*/
                if(this.proposedDirection()==NORTH)
                {
                    this.proposedPosSprite.scaleY=gridStep/3;
                    this.proposedPosSprite.scaleX=gridStep/5;
                    this.proposedPosSprite.y+=gridStep/3;
                }
                else if(this.proposedDirection()==SOUTH)
                {
                    this.proposedPosSprite.scaleY=gridStep/3;
                    this.proposedPosSprite.scaleX=gridStep/5;
                    this.proposedPosSprite.y+=-gridStep/3;
                }
                else if(this.proposedDirection()==EAST)
                {
                    this.proposedPosSprite.scaleX=gridStep/3;
                    this.proposedPosSprite.scaleY=gridStep/5;
                    this.proposedPosSprite.x+=-gridStep/3;
                }
                else if(this.proposedDirection()==WEST)
                {
                    this.proposedPosSprite.scaleX=gridStep/3;
                    this.proposedPosSprite.scaleY=gridStep/5;
                    this.proposedPosSprite.x+=gridStep/3;
                }
                else
                {
                    this.proposedPosSprite.scaleY=gridStep/5;
                    this.proposedPosSprite.scaleX=gridStep/5;
                }

            }
        }
    }
    updatePosition(delta)
    {
        if(this.alive)
        {
            this.move();
        }
    }
    //some pathfinding methods need booleans to be turned on, so it's not enough to just change the pathfinding method, i need to set the correct bools too - so i made this method to make it easy for me 
    //this method will set the bools needed for the chosen pathfinding method, then will set the 'this.pathfindingMethod' to the correct pathfinding function so that if you call this.pathfindingMethod it will call that method
    setPathfindingMethod(n)
    {
        switch(n)
        {
            case 1:
                this.rememberTail=false;
                this.rememberWall=false;
                this.useTunnel=false;
                this.wallRunnerDirection = RIGHT;
                this.allowAlterExplorerNumber=false;
                this.pathfindingMethod=this.beeline1;
                break;
            case 2:
                this.rememberTail=false;
                this.rememberWall=false;
                this.useTunnel=false;
                this.wallRunnerDirection = RIGHT;
                this.allowAlterExplorerNumber=false;
                this.pathfindingMethod=this.beeline2;
                break;             
            case 3:
                this.rememberTail=true;
                this.rememberWall=false;
                this.useTunnel=false;
                this.wallRunnerDirection = RIGHT;
                this.allowAlterExplorerNumber=false;
                this.pathfindingMethod=this.tail3;
                break;                
            case 4:
                this.rememberTail=false;
                this.rememberWall=true;
                this.useTunnel=false;
                this.wallRunnerDirection = RIGHT;
                this.allowAlterExplorerNumber=false;
                this.pathfindingMethod=this.wallRunner4;
                break;
            case 5:
                this.rememberTail=false;
                this.rememberWall=true;
                this.useTunnel=true;
                this.wallRunnerDirection = RIGHT;
                this.allowAlterExplorerNumber=false;
                this.pathfindingMethod=this.wallRunnerDigger5;
                break;
            case 6:
                this.rememberTail=false;
                this.rememberWall=false;
                this.useTunnel=true;
                this.wallRunnerDirection = RIGHT;
                this.allowAlterExplorerNumber=false;
                this.pathfindingMethod=this.beelineDigger6;
                break;
            case 7:
                this.rememberTail=true;
                this.rememberWall=false;
                this.useTunnel=false;
                this.wallRunnerDirection = RIGHT;
                this.allowAlterExplorerNumber=true;
                this.pathfindingMethod=this.explorer7;
                break;
                
        }
    }
    pathfinding()
    {
        //if the creature finds a tunnel to dig it will cancel it's current move, this happens in the move method - just before it moves, when we get to the pathfinding again - like here - we can reset this to false. 
        this.cancelMove=false;
        let proposedPathfindingPosition;
        if(this.skipMovement)
        {
            proposedPathfindingPosition=this.proposedPos;
        }
        else
        {
            if(this.type==WORKER)
            {
                proposedPathfindingPosition = this.pathfindingMethod();
            }
            else if(this.type==WARRIOR)
            {
                proposedPathfindingPosition = this.warriorPathfinding8();
            }
        }
        //so the creature will store its proposed position, and we will add this creature's index to the priority array for the direction it is travelling, we also store either the x or y pos to aid sorting
        this.proposePathfinding();
        return proposedPathfindingPosition;
    }
    beeline1()
    {
        this.proposedPos=undefined;
        if(this.tx<this.goal.tx)
        {
            this.proposedPos={tx:this.tx+1,ty:this.ty};
        }
        else if(this.tx>this.goal.tx)
        {
            this.proposedPos={tx:this.tx-1,ty:this.ty};
        }
        else if(this.ty<this.goal.ty)
        {
            this.proposedPos={tx:this.tx,ty:this.ty+1};
        }
        else if(this.ty>this.goal.ty)
        {
            this.proposedPos={tx:this.tx,ty:this.ty-1};
        }
        return this.proposedPos;
    }
    //test which direction is closest to the goal. of those, return the closest to goal which is a path
    beeline2()
    {
        this.proposedPos=undefined;
        let neighbours = this.getNeighbours({tx:this.tx,ty:this.ty});
        neighbours = this.sortNeighbours(neighbours,this.goal);
        for( let i = 0 ; i < neighbours.length ; i ++)
        {
            if(this.map.isPath(neighbours[i]))
            {
                this.proposedPos=neighbours[i];
                break;
            }
        }
        return this.proposedPos;
    }
    //simlar to beeline2, test which direction is closest ot he goal. of those return the closest to goal which is a path and which is not the tail - the tail being the creature's memory of where it's previous position was. if none of those options are a path, then return the tail if that is a path. the memory is going to have to be set in the move method
    tail3()
    {
        this.proposedPos=undefined;
        //get all the 4 neighbours
        let neighbours = this.getNeighbours({tx:this.tx,ty:this.ty});
        //sort the neighbours in order of closest to goal
        neighbours = this.sortNeighbours(neighbours,this.goal);
        //record the tail, the memeory should be an array, so a little error handling just incase there is no memory yet
        let tail = this.memory.length>0?this.memory[0]:undefined;
        //test if the 'neighbour closest to goal' is a path, if so return that as proposed position, if not check the next closest, also check that that proposed pos is not the tail 
        for( let i = 0 ; i < neighbours.length ; i ++)
        {
            if(this.map.isPath(neighbours[i])&& ! Helper.vectorEquals(neighbours[i],tail))
            {
                this.proposedPos=neighbours[i];
                break;
            }
        }
        //if the proposedPos is still undefined, then none of the 4 directions fit the criteria of; is a path and is not the tail, if so then check if the tail is a path and return that pos
        if(this.proposedPos==undefined&&tail!=undefined&&this.map.isPath(tail))
        {
            this.proposedPos=tail;
        }
        return this.proposedPos;
    }
    //wall runners move toward a goal until they hit a wall, then they latch onto the wall and move either left or right hugging that wall 
    //we will record the direction of the wall in memory - will need to do that in the move method
    wallRunner4()
    {
        this.proposedPos=undefined;
        let wall = this.memory.length>0?Object.assign({}, this.memory[0]):undefined;
        if(wall)
        {
            //the wall memory will be where the wall should be, if we happen to have gone around the outside of a corner then the wall could actually be a path, if so move onto it - so we have followed the wall around a corner . 
            if(this.map.isPath(wall))
            {
                this.proposedPos=wall;
                return this.proposedPos;
            }
            else
            {
                //otherwise if the wall is a wall, then set the proposedPos to the position to the left or right of that wall depending on this creature's direction value
                this.proposedPos = this.rightAnglePosition(wall,{tx:this.tx,ty:this.ty},this.wallRunnerDirection);
                return this.proposedPos;
            }
        }
        else
        {
            this.proposedPos = this.beeline1();
            return this.proposedPos;
        }
    }
    //same as wallRunner4 but if the this.shortcutMode is true then we can dig
    wallRunnerDigger5()
    {
        this.encounteredWall=false;
        this.proposedPos=undefined;
        //use object.assign to copy the memory by value not by ref 
        let wall = this.memory.length>0?Object.assign({}, this.memory[0]):undefined;
        if(this.shortcutMode)
        {
            this.proposedPos = this.beelineDigger6();
            return this.proposedPos;  
        }
        else if(wall)
        {
            //the wall memory will be where the wall should be, if we happen to have gone around the outside of a corner then the wall could actually be a path, if so move onto it - so we have followed the wall around a corner . 
            //i'm making this creature be able to walk on path and rubble
            if(this.map.isPath(wall)==true||this.map.isRubble(wall)==true)
            {
                this.proposedPos=wall;
                return this.proposedPos;
            }
            else
            {
                this.encounteredWall=true;
                //otherwise if the wall is a wall -or the imapassable edge, then set the proposedPos to the position to the left or right of that wall depending on this creature's direction value
                //basically we propose to sidestep the wall
                this.proposedPos = this.rightAnglePosition(wall,{tx:this.tx,ty:this.ty},this.wallRunnerDirection);
                return this.proposedPos;
            }
        }
        else
        {
            this.proposedPos = this.beeline1();
            return this.proposedPos;
        } 
    }
    beelineDigger6()
    {
        this.proposedPos=undefined;
        let neighbours = this.getNeighbours({tx:this.tx,ty:this.ty});
        neighbours = this.sortNeighbours(neighbours,this.goal);
        for( let i = 0 ; i < neighbours.length ; i ++)
        {
            if(this.shortcutMode||this.map.isPath(neighbours[i])==true)
            {
                this.proposedPos=neighbours[i];
                break;
            }
        }
        return this.proposedPos;
    }
    explorer7()
    {

        this.proposedPos=undefined;
        

        //if the creature is going diagonal
        if(this.explorerDirectionDiagonal)
        {
            //make either the x or y value a zero, depending on if the toggle bool is true or false, then toggle the toggle bool
            this.explorerDirection = this.explorerDirectionBoolToggle==true?{tx:0,ty:this.explorerDirectionOriginal.ty}:{tx:this.explorerDirectionOriginal.tx,ty:0};
            this.explorerDirectionAlt = this.explorerDirectionBoolToggle==true?{tx:this.explorerDirectionOriginal.tx,ty:0}:{tx:0,ty:this.explorerDirectionOriginal.ty};
            this.explorerDirectionBoolToggle= !this.explorerDirectionBoolToggle;
        }
        //this is the adjacent 4 tiles, the first tile should be in the direction of the explorerDirection, then the one clockwise, then anti clockwise, then opposite the explorerDirection
        let neighbours = this.getAdjacent();


    /*20251014 every update check if we are on a bloodstain, record the value. if the value is higher than the previous value ( we found a new bloodstain, or one more severe than the one we were aware of) then start recording that on the way back to the base*/   
        {
            let tempBloodStain = this.map.getBloodStain({tx:this.tx,ty:this.ty});
            if( tempBloodStain !=-1)
            {                
                this.valueOfDiscoveredBloodStain = tempBloodStain;
                this.shoutOut('found blood');                        
                //normally the tail will stop you going back on yourself, but if we just found blood, we might want to go back on ourself, but instead of deleting the tail i will set it to curretn position which means i wont get index out of bounds
                this.memory[0]=Object.assign({}, {tx:this.tx,ty:this.ty});
                /*20251022 when we find blood we should also count this as seeing the warning */
                this.seenWarningBool=true;
            }
        }

        /*20251021 check if there is a warning trail on the tile we are on*/
        if(this.seenWarningBool==false)
        {
            /*20251022 decided against checking 5 tiles for each creature on each update, just check the current tile*/
            /*if(this.warningInAdjacent5({tx:this.tx,ty:this.ty},neighbours)==true)*/
            if(this.warningOnTile({tx:this.tx,ty:this.ty})==true)
            {
                this.shoutOut('found warning');
                this.memory[0]=Object.assign({}, {tx:this.tx,ty:this.ty});
                this.seenWarningBool=true;
            }
        }
        /*20251021 if we are following a warning but not a bloodstain, then check for an unexplored path adjacent to us, if there is one that we can get to, then forget the warning */
        if(this.seenWarningBool==true && this.valueOfDiscoveredBloodStain==-1)
        {
            for(let i = 0 ; i < neighbours.length; i ++)
            {
                if(this.map.isWall(neighbours[i])==false && this.map.isEdge(neighbours[i])==false && this.map.getExploredNumber(neighbours[i])==-1)
                {
                    this.proposedPos = neighbours[i];
                    this.exploredDeadEnd=false;
                    this.shoutOut('found unexplored path');
                    this.shoutOut('forget warning');
                    this.seenWarningBool=false;
                    return this.proposedPos;
                }
            } 
        }

        //if the creature is carrying a resource...
        /*20251014 ... or has discovered a bloodstain*/
        /*20251021 ... or has discovered a warning*/
        if(this.carryingResource|| this.valueOfDiscoveredBloodStain>-1 || this.seenWarningBool)
        {
            //the neighbours are sorted by the exploreDirection, but if it has a resource i want to go back to the base, so reverse this sorted order
            let neighboursReversed = Helper.reverseArray(neighbours);
            //get a list of the neighbours with a resource marker 
            let resourceNeighbours=this.refineAdjacent(neighboursReversed);
            /*20251103 i have changed my mind on this problem:newlyDiscovered, i should only follow resource trails in one direction, TO the reosurce, I should not follow them to get back to the base, leave that to the lowest explored number */
            //problem:newlyDiscovered
            //in the specific scenario where a creature is on the way back to base with the first resource - laying a resoure marker trail as it goes, if it is then killed, the only resource marker adjacent to it will be leading back to the resource, not back to the base, i will set a flag on the creature if it is the first to get a resource, if so then don't follow the resourcemarker, instead make your own way back to base. 
            /*if(resourceNeighbours.length>0 && this.newlyDiscovered==false)
            {
                //of those neighbours that have resource markers, sort them by lowest explored number
                let resourceNeighboursByLowestExploredNumber = this.sortAdjacentLowestExploredNumber(resourceNeighbours);
                //now set our proposedPos as the neighbour with the lowestExploredNumber - that is not our tail and if that is not a wall
                for(let i = 0 ; i < resourceNeighboursByLowestExploredNumber.length; i ++)
                {
                    if(Helper.vectorEquals(this.memory[0],resourceNeighboursByLowestExploredNumber[i])==false)
                    {
                        if(this.map.isWall(resourceNeighboursByLowestExploredNumber[i])==false&&this.map.isEdge(resourceNeighboursByLowestExploredNumber[i])==false)
                        {
                            this.proposedPos=resourceNeighboursByLowestExploredNumber[i];
                            this.exploredDeadEnd=false;
                            return this.proposedPos;
                        }
                    }
                }
            }
            */
            //if there are no neighbours with resource markers, that we can go to...
            {
                //set proposed move to the neighbour with lowest explored number, so long as that neighbour's exploredNumber is less than the tile we are on and so long as it is not the tail - bear in mind that we may have deleted our tail if we just picked up a resource or found a dead body etc
                let currentExploredNumber = this.map.getExploredNumber({tx:this.tx,ty:this.ty});
                let neighboursByLowestExploredNumber=this.sortAdjacentLowestExploredNumber(neighboursReversed);
                for(let i = 0 ; i < neighboursByLowestExploredNumber.length; i ++)
                {
                    if(Helper.vectorEquals(this.memory[0],neighboursByLowestExploredNumber[i])==false)
                    {
                        if(this.map.isWall(neighboursByLowestExploredNumber[i])==false&&this.map.isEdge(neighboursByLowestExploredNumber[i])==false&&this.map.getExploredNumber(neighboursByLowestExploredNumber[i])<currentExploredNumber)
                        {
                            this.proposedPos = neighboursByLowestExploredNumber[i];
                            this.exploredDeadEnd=false;
                            return this.proposedPos;
                        }
                    }
                }
                //if we still haven't returned there must be no resource neighbours that are not our tail, and no neighbours that are already explored - with an exploredNumber less than the current tile - that are not our tail, so get a neighbour that is unexplored. 
                for(let i = 0 ; i < neighboursReversed.length; i ++)
                {
                    if(this.map.isWall(neighboursReversed[i])==false&&this.map.isEdge(neighboursReversed[i])==false)
                    {
                        this.proposedPos = neighboursReversed[i];
                        this.exploredDeadEnd=false;
                        //set this to true so that we continue to set the explored number of the tiles
                        /*20251014 now that this method doubles as a way to return to base when you discover blood as well as a resource, add an if statement here*/
                        if(this.carryingResource)
                        {
                            this.exploringWhileCarrying=true;
                        }
                        return this.proposedPos;
                    }
                }
            }
        }
        //else if the creature is not carrying a resource
        else
        {
            //list of neighbours that have resource marker
            let resourceNeighbours=this.refineAdjacent(neighbours);
            if(resourceNeighbours.length>0)
            {
                //of those neighbours that have resource markers, sort them by highest explored number
                let resourceNeighboursByHighestExploredNumber = this.sortAdjacentHighestExploredNumber(resourceNeighbours);
                //find the neighbour with the highest explored number, that is not a wall and go there. 
                for(let i = 0 ; i < resourceNeighboursByHighestExploredNumber.length; i ++)
                {
                    if(this.map.isWall(resourceNeighboursByHighestExploredNumber[i])==false&&this.map.isEdge(resourceNeighboursByHighestExploredNumber[i])==false)
                    {
                        this.proposedPos = resourceNeighboursByHighestExploredNumber[i];
                        this.exploredDeadEnd=false;
                        return this.proposedPos;
                    }
                }
                //if we did not return yet then the resource neighbour might be unexplored, in which case it must have a resource marker because it is a resource, so the creature should want to go there. 
                //there might be more than one resourceadjacent to us, we can go to any but go to the first one, which will be our direction priority  
                for(let i = 0 ; i < resourceNeighbours.length; i ++)
                {
                    if(this.map.isWall(resourceNeighbours[i])==false&&this.map.isEdge(resourceNeighbours[i])==false)
                    {
                        this.proposedPos = resourceNeighbours[i];
                        this.exploredDeadEnd=false;
                        return this.proposedPos;
                    }
                }
            }
            //if we haven't returned yet there must not be a neighbour with a resource marker that we can go to, so try to go to an unexplored neighbour
            for(let i = 0 ; i < neighbours.length; i ++)
            {
                if(this.map.isWall(neighbours[i])==false && this.map.isEdge(neighbours[i])==false && this.map.getExploredNumber(neighbours[i])==-1)
                {
                    this.proposedPos = neighbours[i];
                    this.exploredDeadEnd=false;
                    return this.proposedPos;
                }
            }
            //if we can't find a neighbour that is unexplored and is not a wall, see if there is a neighbour that is explored and not a wall
            //if we have not found a dead end, look for the neighbour with the highest explored number, 
            if(this.exploredDeadEnd==false)
            {
                let neighboursByHighestExploredNumber = this.sortAdjacentHighestExploredNumber(neighbours);
                for(let i = 0 ; i < neighboursByHighestExploredNumber.length; i ++)
                {
                    if(this.map.isWall(neighboursByHighestExploredNumber[i])==false&&this.map.isEdge(neighboursByHighestExploredNumber[i])==false)
                    {
                        //move to the neighbour that has the highest explored number, unless it is our tail, in which case trigger the dead end flag.
                        if(Helper.vectorEquals(neighboursByHighestExploredNumber[i],this.memory[0]))
                        {
                            //20251007 if the neighbour is our tail, continue through the list, perhaps there is another neighbour with the same explored number that is not our tail
                            continue;
                        }
                        else
                        {
                            this.proposedPos = neighboursByHighestExploredNumber[i];
                            return this.proposedPos;
                        }
                    }
                }
                //if we go thorugh all the neighbours and don't find one that is not our tail, then we say dead end
                this.exploredDeadEnd=true;
                this.shoutOut('deadend!');
            }
            //if the explorer has found a dead end we should still be looking for resource marker first, then unexplored, but failing that choose a low explored number neighbour, so that we backtrack until we find unexplored tiles
            if(this.exploredDeadEnd==true)
            {
                let neighboursByLowestExploredNumber = this.sortAdjacentLowestExploredNumber(neighbours);
                for(let i = 0 ; i < neighboursByLowestExploredNumber.length; i ++)
                {
                    if(this.map.isWall(neighboursByLowestExploredNumber[i])==false&&this.map.isEdge(neighboursByLowestExploredNumber[i])==false)
                    {
                        this.proposedPos = neighboursByLowestExploredNumber[i];
                        return this.proposedPos;
                    }
                }
            }
        }
        //if we still have not returned return current position, we must have been surrounded by walls or something
        this.proposedPos = {tx:this.tx,ty:this.ty};
        return this.proposedPos;
    }
    /*20251027 I need to make a new pathfinding method exclusively for warriors, they should be born at the creature base, they need to vacate the base to allow more to be born, they will move onto the warning trail, here they will wait until their combined strength is sufficient to take on the warning trail value. while they wait and more warriors are born they will also want to move adjacent to the creature base to vacate it, doing so will force the existing warriors to move up to make way for them*/
    warriorPathfinding8()
    {
        this.proposedPos=undefined;
        /*get the 4 neighbours*/ 
        let neighbours = this.getAdjacent();
        /*if we are still on the creature base - this should only happen immediately after being born*/
        if(this.stepOff)
        {
            /* turn the neighbours into an array of only the neighbours with a warning value, and sort it in order of lowest (warning value - strength value) that is not negative */
            let neighboursWithLowestWarningValue= this.getStepOffPos(neighbours);
            /* go through that array and set that as the proposed pos if there is no wall*/
            let temppp = this.checkForWallsThenProposePos(neighboursWithLowestWarningValue);
            if(temppp!=false)
            {
                this.proposedPos = temppp;                
                this.shoutOut('move off base to lowest warning marker');
                this.pushUpWarrior(this.proposedPos);
                return this.proposedPos;
            }
            /*if we still have not returned a proposed pos we must not have a warning trail that has not been dealt with, look for a garrison marker and move onto that, failing that just move in some available direction*/
            let neighboursWithGarrisonMarker = this.refineAdjacentGarrisonMarker(neighbours);
            /* go through that array and set that as the proposed pos if there is no wall*/
            temppp = this.checkForWallsThenProposePos(neighboursWithGarrisonMarker);
            if(temppp!=false)
            {
                this.proposedPos = temppp;
                this.shoutOut('move off base to garrison');
                this.pushUpWarrior(this.proposedPos);
                return this.proposedPos;
            }
            /*so if we still have not moved, just check any direction for no walls */
            temppp = this.checkForWallsThenProposePos(neighbours);
            if(temppp!=false)
            {
                this.proposedPos = temppp;
                this.shoutOut('move off base');
                this.pushUpWarrior(this.proposedPos);
                return this.proposedPos;
            }
            /*if we still have not been able to move we must be surrounded by walls, returning an undefined proposed pos will just result in no movement*/
            this.shoutOut('stuck on base');
            this.pushUpWarrior(this.proposedPos);
            return this.proposedPos;
        }
        /*if not stepOff */
        /*20251110 if we have been told to push up then move along the strength line one space if possible, else move along the warning line*/
        if(this.pushUp==true)
        {
            this.pushUp=false;
            this.shoutOut('comply with push up');
            let neighboursWithStrengthMarker = this.refineAdjacentStrengthMarker(neighbours);
            let neighboursWithStrengthMarkerByHighestExploredNumber = this.sortAdjacentHighestExploredNumber(neighboursWithStrengthMarker);
            /* see if this position would actually be moving away from teh base- based on the explored number */
            for(let i = 0 ; i < neighboursWithStrengthMarkerByHighestExploredNumber.length; i ++)
            {
                if(this.map.getExploredNumber(neighboursWithStrengthMarkerByHighestExploredNumber[0])>this.map.getExploredNumber({tx:this.tx,ty:this.ty}) )
                {
                    /* if so go there*/
                    this.proposedPos = neighboursWithStrengthMarkerByHighestExploredNumber[0];
                    this.pushUpWarrior(this.proposedPos);
                    return this.proposedPos;
                }
            }
            /* if none of the adjacent strength positions were of a higher explored number then try the warning positions*/
            let neighboursWithWarningMarker = this.refineAdjacentWarningMarker(neighbours);
            let neighboursWithWarningMarkerByHighestExploredNumber = this.sortAdjacentHighestExploredNumber(neighboursWithWarningMarker);
            
            this.proposedPos = neighboursWithWarningMarkerByHighestExploredNumber[0];
            this.pushUpWarrior(this.proposedPos);
            return this.proposedPos;

        }
        else
        {
            /*sort the neighbours by warning trail with highest explored number. */
            let neighboursWithWarningMarker = this.refineAdjacentWarningMarker(neighbours);
            let neighboursWithWarningMarkerByHighestExploredNumber = this.sortAdjacentHighestExploredNumber(neighboursWithWarningMarker);
            /*if there is a neighbour with a warning marker */
            if(neighboursWithWarningMarkerByHighestExploredNumber.length>0)
            {    
                
                /* for the highest explored number warning trail, see if our group strength exceeds the warning value*/
                let tempWarning = this.map.getWarningMarker(neighboursWithWarningMarkerByHighestExploredNumber[0]);
                /*if the group's reported strength is greater than the warning value*/
                if(this.getReportedStrength() >= (tempWarning * this.cautiousness) )
                {           
                    this.proposedPos = neighboursWithWarningMarkerByHighestExploredNumber[0];
                    this.shoutOut('we are strong enough');
                    this.waitingForReinforcements=false;
                    this.pushUpWarrior(this.proposedPos);
                    return this.proposedPos;
                }
                /*else if the group is too weak, we either move forwards just to get off the garrison or we stay still */
                else
                {
                    /* if the warrior is on the garrison then it needs to move forwards */
                    if(this.map.getGarrisonMarker({tx:this.tx,ty:this.ty})>-1)
                    {
                        this.proposedPos = neighboursWithWarningMarkerByHighestExploredNumber[0];
                        this.shoutOut('move one away from the base');
                    this.pushUpWarrior(this.proposedPos);
                        return this.proposedPos;
                    }
                    this.shoutOut('wait for reinforcements');
                    this.waitingForReinforcements=true;
                    this.pushUpWarrior(this.proposedPos);
                    return this.proposedPos;
                }
            }    
            else
            {
                /* there is no neighbour with a warning marker*/
                /*try to move off the garrison if possible. move away from the base*/
                /* if we are on the garrison..*/
                if(this.map.getGarrisonMarker({tx:this.tx,ty:this.ty})>-1)
                {
                    /* get the neighbours that do not have a base*/
                    let neighboursWithNoBase = this.refineAdjacentNoBase(neighbours);
                    /* move to one of them*/
                    if(neighboursWithNoBase.length>0)
                    {
                        this.proposedPos = neighboursWithNoBase[0];
                        this.shoutOut('move one away from the base');
                        this.pushUpWarrior(this.proposedPos);
                        return this.proposedPos;
                    }
                }
            }
        }
        this.pushUpWarrior(this.proposedPos);
        return this.proposedPos;
    }
    /*20251105 before we return the proposed pos in pathfinding for the warrior, see if there is a warrior in that position that is waiting for reinforcements, if so we want to push up that warrior and all others in this group. */
    pushUpWarrior(proposedPos)
    {
        /*the proposedPos can be undefined it we do not move, for example like when we are waiting for reinforcements, if the proposedPos is undefined then do nothing, */
        if(proposedPos==undefined)
        {

        }
        else
        {  
            /* get the creature index at the proposed pos*/
            let creatureIndexAtProposedPos = this.map.getCreatureIndex(proposedPos);
            /* if that index is not -1, there is a creature there */
            if(creatureIndexAtProposedPos>-1)
            {
                let proposedPosCreature = this.scene.getCreature(creatureIndexAtProposedPos);
                /* if that creature is a warrior*/
                if(proposedPosCreature.type== WARRIOR)
                {
                    /* if that warrior is waiting for reinforcements*/
                    if(proposedPosCreature.waitingForReinforcements==true)
                    {
                        /* then we need to push up */
                        /* add your strength to the group . note that if the other warrior does not have a group, then one will be created with the strength of both warriors and both warriors will be given the key*/
                        if(this.addedStrength==false)
                        {
                            this.addedStrength=true;
                            proposedPosCreature.addedStrength=true;
                            this.warriorGroupKey=this.scene.addWarriorGroupStrength(proposedPosCreature.warriorGroupKey,this.strengthValue,proposedPosCreature.index);
                        }
                        this.shoutOut('push up');
                        this.scene.pushUpAdjacent(creatureIndexAtProposedPos);
                        
                    }
                }
            }
        }
    }
    /*20251110 the scene will call this method of the specified creature that needs to push up*/
    complyWithPushUp()
    {
        this.pushUp=true;
    }
    /* 20251107 if the key is -1 there is no point checking what the group strength is, just use our own strength, but if there is a group this will give up the combined strength of the group */
    getReportedStrength()
    {
        if(this.warriorGroupKey == -1)
        {
            return this.strengthValue;
        }
        return this.scene.getWarriorGroupStrength(this.warriorGroupKey);
    }
    /*20251030 return the first pos in the array if that is not a wall or the edge of the map, this will return false otherwise*/
    checkForWallsThenProposePos(array)
    {
        for(let i = 0 ; i < array.length; i ++)
        {
            if(this.map.isWall(array[i])==false&&this.map.isEdge(array[i])==false)
            {                
                return array[i];;
            }
        }
        return false;
    }
    //this method is used in the explorer7 pathfinding, we don't just want to get the adjacent, we want to return them in order of the creature's preference
    getAdjacent()
    {
        let neighbourArray=[];
        let currentPos={tx:this.tx,ty:this.ty};
        //this is to prevent weird behaviour when the original direction was diagonal, we vary the diagonal directions, so that if the explorerDirection is north east, we swap between preferring north then east each update, but if you went clockwise from east you would be giving preference to south over north, so use the alt direction like this 
        if(this.explorerDirectionAlt)
        {
            neighbourArray.push(Helper.vectorPlus(currentPos,this.explorerDirection));
            neighbourArray.push(Helper.vectorPlus(currentPos,this.explorerDirectionAlt));
            neighbourArray.push(Helper.vectorPlus(currentPos,Helper.getOppositeDirection(this.explorerDirectionAlt)));
            neighbourArray.push(Helper.vectorPlus(currentPos,Helper.getOppositeDirection(this.explorerDirection)));
        }
        else
        {
            neighbourArray.push(Helper.vectorPlus(currentPos,this.explorerDirection));
            neighbourArray.push(Helper.vectorPlus(currentPos,Helper.getClockwiseDirection(this.explorerDirection)));
            neighbourArray.push(Helper.vectorPlus(currentPos,Helper.getAntiClockwiseDirection(this.explorerDirection)));
            neighbourArray.push(Helper.vectorPlus(currentPos,Helper.getOppositeDirection(this.explorerDirection)));
        }
        return neighbourArray;
    }
    //this should be used with the getAdjacent method's returned array, 
    refineAdjacent(neighbours)
    {
        //take a copy of the neighbours, so that we don't edit the neighbours
        let a = neighbours.slice();
        let returnArray=[];
        //sometimes i only want a list of the adjacents that have a resource marker, so go through my adjacents and eliminate any that don't have a resource marker 
        //do this in reverse order since i'm altering the array as i go through it
        for(let i = a.length-1 ; i >-1 ; i -- )
        {
            if(this.map.getResourceMarker(a[i])==-1)
            {
                //so we are removing the neighbours that do not have a resource marker
                a.splice(i,1);
            }
        }
        //now we have 4 or less directions in the array in the correct order. and we need to use those to access the tile in the mapData
        //some of the positions in the neighbourArray could be out of bounds if the currentPos is on the edge of the map, but i will make the edge of the map walls, so that the wall behaviour prevents them getting to the true edge of the map 
        for(let i = 0 ; i < a.length; i ++ )
        {
            returnArray.push(a[i]);
        }
        return returnArray;
    }
   
    /*20251030 pass in the neighbours, and get a list of neighbours with warning marker values*/
    refineAdjacentWarningMarker(neighbours)
    {
        //take a copy of the neighbours, so that we don't edit the neighbours
        let a = neighbours.slice();
        let returnArray=[];
        //sometimes i only want a list of the adjacents that have a warning marker, so go through my adjacents and eliminate any that don't have a warning marker 
        //do this in reverse order since i'm altering the array as i go through it
        for(let i = a.length-1 ; i >-1 ; i -- )
        {
            if(this.map.getWarningMarker(a[i])==-1)
            {
                //so we are removing the neighbours that do not have a warning marker
                a.splice(i,1);
            }
        }
        //now we have 4 or less directions in the array in the correct order. and we need to use those to access the tile in the mapData
        //some of the positions in the neighbourArray could be out of bounds if the currentPos is on the edge of the map, but i will make the edge of the map walls, so that the wall behaviour prevents them getting to the true edge of the map 
        for(let i = 0 ; i < a.length; i ++ )
        {
            returnArray.push(a[i]);
        }
        return returnArray;
    }
    /*20251110 pass in the neighbours, and get a list of neighbours with strength marker values*/
    refineAdjacentStrengthMarker(neighbours)
    {
        //take a copy of the neighbours, so that we don't edit the neighbours
        let a = neighbours.slice();
        let returnArray=[];
        //sometimes i only want a list of the adjacents that have a strength marker, so go through my adjacents and eliminate any that don't have a strength marker 
        //do this in reverse order since i'm altering the array as i go through it
        for(let i = a.length-1 ; i >-1 ; i -- )
        {
            if(this.map.getStrengthMarker(a[i])==-1)
            {
                //so we are removing the neighbours that do not have a strength marker
                a.splice(i,1);
            }
        }
        //now we have 4 or less directions in the array in the correct order. and we need to use those to access the tile in the mapData
        //some of the positions in the neighbourArray could be out of bounds if the currentPos is on the edge of the map, but i will make the edge of the map walls, so that the wall behaviour prevents them getting to the true edge of the map 
        for(let i = 0 ; i < a.length; i ++ )
        {
            returnArray.push(a[i]);
        }
        return returnArray;
    }
    /*20251030 pass in the neighbours, and get a list of neighbours with Garrison marker values*/
    refineAdjacentGarrisonMarker(neighbours)
    {
        //take a copy of the neighbours, so that we don't edit the neighbours
        let a = neighbours.slice();
        let returnArray=[];
        //sometimes i only want a list of the adjacents that have a Garrison marker, so go through my adjacents and eliminate any that don't have a Garrison marker 
        //do this in reverse order since i'm altering the array as i go through it
        for(let i = a.length-1 ; i >-1 ; i -- )
        {
            if(this.map.getGarrisonMarker(a[i])==-1)
            {
                //so we are removing the neighbours that do not have a Garrison marker
                a.splice(i,1);
            }
        }
        //now we have 4 or less directions in the array in the correct order. and we need to use those to access the tile in the mapData
        //some of the positions in the neighbourArray could be out of bounds if the currentPos is on the edge of the map, but i will make the edge of the map walls, so that the wall behaviour prevents them getting to the true edge of the map 
        for(let i = 0 ; i < a.length; i ++ )
        {
            returnArray.push(a[i]);
        }
        return returnArray;
    }
    /*20251030 pass in the neighbours, and get a list of neighbours with no creature base*/
    refineAdjacentNoBase(neighbours)
    {
        //take a copy of the neighbours, so that we don't edit the neighbours
        let a = neighbours.slice();
        let returnArray=[];
        //sometimes i only want a list of the adjacents that don't have a creaturebase, so go through my adjacents and eliminate any that do have a creaturebase 
        //do this in reverse order since i'm altering the array as i go through it
        for(let i = a.length-1 ; i >-1 ; i -- )
        {
            if(this.map.getCreatureBaseIndex(a[i])>-1)
            {
                //so we are removing the neighbours that do have a creature base
                a.splice(i,1);
            }
        }
        //now we have 4 or less directions in the array in the correct order. and we need to use those to access the tile in the mapData
        //some of the positions in the neighbourArray could be out of bounds if the currentPos is on the edge of the map, but i will make the edge of the map walls, so that the wall behaviour prevents them getting to the true edge of the map 
        for(let i = 0 ; i < a.length; i ++ )
        {
            returnArray.push(a[i]);
        }
        return returnArray;
    }
    /* 20251030 take the neighbours as an argument, return the neighbours but sorted in order of which has the lowest non negative value of the warning marker minus the strength marker. the intention is for the warrior to step off the creature base onto a neighbour giving priority to a neighbour with the lowest threat that has not already been dealt with*/
    getStepOffPos(neighbours)
    {
        let returnArray=[];
        neighboursLoop:
        for(let i = 0 ; i < neighbours.length ; i ++)
        {
            //store the warningValue of the first neighbour
            let warningValue=this.map.getWarningMarker(neighbours[i]);         
            /* if the strength value is not -1 then subtract that from the warning value*/
            let strengthValue = this.map.getStrengthMarker(neighbours[i]);
            if(strengthValue!=-1)
            {
                warningValue = warningValue - strengthValue;
            }
            //if the neighbour does not actually have warning value i.e. it is -1, or the strength value is greater than the warning value such that the warning is considered to be dealt with , then we will not return this neighbour
            if(warningValue<=-1)
            {
                //go to next neighbour in neighboursLoop for loop
                continue neighboursLoop;
            }
            else
            {
                //else if it does have a warning value
                neighboursReturnLoop:
                //compare it to any other warning value we've added to the return array so far
                for(let j = 0 ; j < returnArray.length ; j ++)
                {
                    let warningValue2 =this.map.getWarningMarker(returnArray[j]);
                    if(warningValue2!=-1)
                    {
                        /* if the strength value is not -1 then subtract that from the warning value*/
                        let strengthValue2 =this.map.getStrengthMarker(returnArray[j]);
                        if(strengthValue2!=-1)
                        {
                            warningValue2 = warningValue2 - strengthValue2;
                        }
                        //check if the warning value is positive, after subtracting the strength value i.e check that there is actually a warning that has not been dealt with.
                        if(warningValue2>-1)
                        {
                            //if the neighbour warning value is less than any of the warning values in the returnarray, then add this neighbour before that, and continue the loop to the next neighbour
                            if(warningValue<warningValue2)
                            {
                                returnArray.splice(j,0,neighbours[i]);
                                //if we add to the array then move to the next neighbour in the neighboursLoop
                                continue neighboursLoop;
                            }
                        }
                    }
                }
                //if we reach this stage we must not have added to the return array yet, or our neighbour warning value is larger than those in the array , so add it in now at the end
                returnArray.push(neighbours[i]);
            }
        }
        return returnArray;
    }
    sortAdjacentLowestExploredNumber(neighbours)
    {
        let returnArray=[];
        neighboursLoop:
        for(let i = 0 ; i < neighbours.length ; i ++)
        {
            //store the explorednumber of the first neighbour
            let warningValue=this.map.getExploredNumber(neighbours[i]);
            //if the neighbour does not actually have an explored number
            if(warningValue==-1)
            {
                //go to next neighbour in neighboursLoop for loop
                continue neighboursLoop;
            }
            else
            {
                //else if it does have a exploredNumber
                neighboursReturnLoop:
                //compare it to any other explored numbers we've added to the return array so far
                for(let j = 0 ; j < returnArray.length ; j ++)
                {
                    let exploredNumber2 =this.map.getExploredNumber(returnArray[j]);
                    //if the neighbour explored number is less than any of the explored numbers in the returnarray, then add this neighbour before that, and continue the loop to the next neighbour
                    if(warningValue<exploredNumber2 && exploredNumber2!=-1)
                    {
                        returnArray.splice(j,0,neighbours[i]);
                        //if we add to the array then move to the next neighbour in the neighboursLoop
                        continue neighboursLoop;
                    }
                }
                //if we reach this stage we must not have added to the return array yet, or our neighbour explored number is larger than those in the array , so add it in now at the end
                returnArray.push(neighbours[i]);
            }
        }
        return returnArray;
    }
    sortAdjacentHighestExploredNumber(neighbours)
    {
        let returnArray=[];
        neighboursLoop:
        for(let i = 0 ; i < neighbours.length ; i ++)
        {
            let warningValue=this.map.getExploredNumber(neighbours[i]);
            //sort the neighbours into a new array based on lowest exploredNumber
            if(warningValue==-1)
            {
                //got to next neighbour in neighboursLoop for loop
                continue neighboursLoop;
            }
            else
            {
                neighboursReturnLoop:
                for(let j = 0 ; j < returnArray.length ; j ++)
                {
                    let exploredNumber2 =this.map.getExploredNumber(returnArray[j]);
                    if(warningValue>exploredNumber2 && exploredNumber2!=-1)
                    {
                        returnArray.splice(j,0,neighbours[i]);
                        //if we add to the array then move to the next neighbour in the neighboursLoop
                        continue neighboursLoop;
                    }
                }
                //if we reach this stage we must not have added to the return array yet, so add it in now
                returnArray.push(neighbours[i]);
            }
        }
        return returnArray;
    }
    //so the creature will store its proposed position, and we will add this creature's index to the priority array for the direction it is travelling, we also store either the x or y pos to aid sorting
    proposePathfinding()
    {
        let dir = this.proposedDirection();
        switch(dir)
        {
            case NORTH:  
                this.priorityArray.addAndSort(this.priorityArray.north,{index:this.index,p:this.ty},NORTH);
                break;
            case SOUTH: 
                this.priorityArray.addAndSort(this.priorityArray.south,{index:this.index,p:this.ty},SOUTH);
                break;
            case EAST:    
                this.priorityArray.addAndSort(this.priorityArray.east,{index:this.index,p:this.tx},EAST);
                break;
            case WEST:    
                this.priorityArray.addAndSort(this.priorityArray.west,{index:this.index,p:this.tx},WEST);
                break;
            case STATIONARY:
                this.priorityArray.addAndSort(this.priorityArray.stationary,{index:this.index,p:undefined},STATIONARY);
                break;
        }
    }
    //return an array of neighbouring spaces
    getNeighbours(v)
    {
        let a =[];
        a.push({tx:v.tx+ 0,ty:v.ty+-1});//north
        a.push({tx:v.tx+ 1,ty:v.ty+ 0});//east
        a.push({tx:v.tx+ 0,ty:v.ty+ 1});//south
        a.push({tx:v.tx+-1,ty:v.ty+ 0});//west
        return a;
    }
    //sort neighbours based on distance to goal, shortest first
    sortNeighbours(neighbours,g)
    {
        let r = [];
        let n = neighbours.slice();
        //r will start off empty so push the first neighbour regardless
        n[0].distance = Helper.dist(n[0],g);    
        r.push(n[0]);
        //for each of the 3 remaining neighbours
        loop1:
        for( let i = 1 ; i < n.length; i ++)
        {
            //...record the distance to the goal
            n[i].distance = Helper.dist(n[i],g);    
            //compare it to our sorted list 
            for( let j = 0 ; j <r.length; j ++)
            {
                //if it is smaller than or equal to the number in the sorted list, add it in before that then continue the first for loop 
                if(n[i].distance<=r[j].distance)
                {
                    r.splice(j,0,n[i]);
                    continue loop1;//this will continue the first for loop so that the below code does not run
                }                
            }
            //if we have looped through the sorted loop and this number is not smaller than any, then add it to teh end 
            r.push(n[i]);
        }
        return r;
    }
    move()
    {
        //if we entered rubble this.skipMovement would be true
        if(this.skipMovement==false)
        {
            if(this.proposedPos)
            {
                //if the proposed position is not outside the map
                if(this.map.inBounds(this.proposedPos))
                {
                    //if the proposed position does not already have a player on it or a vehicle
                    if(this.map.getPlayerIndex(this.proposedPos)==-1 && (this.map.getVehicleIndex(this.proposedPos)==-1))
                    {
                        if(this.map.isEdge(this.proposedPos)==false)
                        {
                            //if the proposed position is a path - and not a wall or rubble, or this.shortcutMode is active
                            //updating this so that creatures can walk on rubble an path
                            if(this.map.isWall(this.proposedPos)==false||this.shortcutMode)
                            {             
                                //this will be NORTH, SOUTH, EAST or WEST or STATIONARY
                                let dir = this.proposedDirection();
                                //if the proposed position does not already have a creature on it
                                if(this.map.getCreatureIndex(this.proposedPos)==-1)
                                {
                                    //even if the proposed position has no creature on it we should still...
                                    ///...check if the proposed position is contested, 
                                    //specifically if it is contested by some direction other than our direction, and not contested by our direction - in that case do not move
                                    if(this.map.isContestedFromExcluding(this.proposedPos,this.oppositeDirection(dir)))
                                    {
                                        //do not move
                                    }
                                    else
                                    {
                                        this.moveCreature(this.proposedPos);
                                    }
                                }
                                //if the proposed position does already have a creature on it,
                                else
                                {
                                    // check if our position is contested by the opposite direction, if so we can swap those 2 creature's positions and clear that contested data, as the 2 creatures in question want to be in each other's spaces
                                    if(this.map.isContestedFrom({tx:this.tx,ty:this.ty},dir))
                                    {
                                        this.swapCreatureWith(this.proposedPos);
                                    }
                                    // if not already contested, then mark it as contested by the direction opposite to what we wanted to move in - so if we wanted to move NORTH into this position, we label that position as being contested by a creature from the SOUTH
                                    else
                                    {
                                        this.map.setContestedFrom(this.proposedPos,this.oppositeDirection(dir));
                                    }
                                }
                            }
                            //if the proposed position is a wall  set the memory to record that wall
                            else if (this.map.isWall(this.proposedPos))
                            {
                                this.updateMemoryWall(this.proposedPos);
                            }
                        }
                        //if the proposed position is a wall  set the memory to record that wall
                        else if (this.map.isEdge(this.proposedPos))
                        {
                            this.updateMemoryWall(this.proposedPos);
                        }
                    }
                }
                //if proposed position is not in bounds, set the memory to record that wall 
                else 
                {
                    this.updateMemoryWall(this.proposedPos);
                }
            }
        }
        else
        {        
            this.skipMovement=false;
        }
    }
    
    takeDamage()
    {
        this.shoutOut('ouch!');
    }
    kill()
    {
        this.shoutOut('avenge me!');
        /* 20251107 if a warrior dies we need to update the group strength*/
        this.scene.subtractWarriorGroupStrength(this.warriorGroupKey,this.strengthValue);
        this.map.setCreature({tx:this.tx,ty:this.ty},-1);
        //if the creature is destroyed we must clear its contested data or else creatures could end up teleporting
        //this.map.clearContested({tx:this.tx,ty:this.ty});
        //instead of clearing the contested data at the dead creature's position, we should clear the contested bool for the proposed direction, at the proposed position as well as the old values for those
        this.map.clearContestedDirection(this.oldProposedPos,this.oldProposedDirection);
        this.map.clearContestedDirection(this.proposedPos,this.proposedDirection());
        //get rid of the tunnel
        for(let i = 0; i < this.potentialTunnelArray.length; i ++)
        {
            this.potentialTunnelArray[i].kill();
        }
        //drop the carried resource, so we need to add the resource to the map and set a marker - or add to the marker
        if(this.carryingResource)
        {
            this.scene.addResource({tx:this.tx,ty:this.ty},1); 
        }
        /*20251010 I need to add the blood to this tile as well as the 8 surrounding tiles, that includes the diagonal ones, this could result in an error if v was at the edge of the map although that should not happen as i add a border to the edge of the map */
        /*20251014 if the creature is killed while laying a warning trail after it discovered a blood stain, then it should lay a blood stain value equal to that discovered bloodstain plus it's own bloodstain value so that another creature can resume the trail*/
        if(this.valueOfDiscoveredBloodStain>-1)
        {
            this.add9BloodStains({tx:this.tx,ty:this.ty},this.valueOfDiscoveredBloodStain+this.bloodStainValue);
        }
        else
        {
            this.add9BloodStains({tx:this.tx,ty:this.ty},this.bloodStainValue);
        }
        /*this.scene.addBloodStain({tx:this.tx,ty:this.ty},this.bloodStainValue);*/
        //reset all the things that would be reset on visiting the base 
        this.exploredNumber=0;
        this.exploredDeadEnd=false;
        this.noOfResourcesDiscovered=0;
        this.carryingResource=false;
        //reset pos
        this.tx=undefined;
        this.ty=undefined;
        this.x=undefined;
        this.y=undefined;
        this.scene.addDeadCreature(this.index);
        this.alive=false;
        this.visible=false;
        this.text.visible=false;
        this.shoutOutText.visible=false;
        this.proposedPosSprite.visible=false;
        this.fadeShoutOut();
    }
    /*20251010 this will add the value of the dead creature to the tile and also spills over the the 8 adjacent tiles */ 
    add9BloodStains(pos,value)
    {
        this.scene.setBloodStain({tx:pos.tx-1,ty:pos.ty-1},value);
        this.scene.setBloodStain({tx:pos.tx-0,ty:pos.ty-1},value);
        this.scene.setBloodStain({tx:pos.tx+1,ty:pos.ty-1},value);
        this.scene.setBloodStain({tx:pos.tx-1,ty:pos.ty+0},value);
        this.scene.setBloodStain({tx:pos.tx-0,ty:pos.ty+0},value);
        this.scene.setBloodStain({tx:pos.tx+1,ty:pos.ty+0},value);
        this.scene.setBloodStain({tx:pos.tx-1,ty:pos.ty+1},value);
        this.scene.setBloodStain({tx:pos.tx-0,ty:pos.ty+1},value);
        this.scene.setBloodStain({tx:pos.tx+1,ty:pos.ty+1},value);
    }
    /*20251021 this will return true if the pos or any of the 4 adjacent pos have a warning marker*/
    warningInAdjacent5(pos,array)
    {
        /*this code would result in tempPosArray having 2 elements, the second of with element would be an array of 4 elements, instead use the ... spread operator 
        let tempPosArray=[];
        tempPosArray.push(pos);
        tempPosArray.push(array);*/
        /*the ... spread operator will instead add each item from the array*/
        let tempPosArray=[pos,...array];
        for(let i = 0 ; i < tempPosArray.length; i ++)
        {
            if(this.map.getWarningMarker(tempPosArray[i])>-1)
            {
                return true;
            }
        }
        return false;
    }
    /*20251022 this is the same as warningInAdjacent5 except it only checks the current tile, not the adjacents. this will result in slightly different although similar behaviour but will be more efficient */ 
   warningOnTile(pos)
    {
        if(this.map.getWarningMarker(pos)>-1)
        {
            return true;
        }
        return false;
    }
    //this is what i use for the creature to explain succintly what it is doing
    shoutOut(newText)
    {
        this.shoutOutText.text +='\n'+ newText;
        this.shoutOutText.visible=true;
        //as well as briefly displaying the shout out, set it to the log, which you can see in debug
        this.scene.updateShoutOutLog('c'+this.index+': '+newText);
    }
    //call this on update
    fadeShoutOut()
    {
        this.shoutOutText.text='';
        this.shoutOutText.visible=false;
    }
    proposedDirection()
    {
        if(this.proposedPos==undefined )
        {
            return STATIONARY;
        }
        else if(this.proposedPos.tx-this.tx==-1)
        {
            return WEST;
        }
        else if(this.proposedPos.tx-this.tx==1)
        {
            return EAST;
        }
        else if(this.proposedPos.ty-this.ty==-1)
        {
            return NORTH;
        }
        else if(this.proposedPos.ty-this.ty==1)
        {
            return SOUTH;
        }
        else
        {
            return STATIONARY;
        }
    }
    oppositeDirection(d)
    {
        if(d==EAST)
        {
            return WEST;
        }
        else if(d==WEST)
        {
            return EAST;
        }
        else if(d==SOUTH)
        {
            return NORTH;
        }
        else if(d=NORTH)
        {
            return SOUTH;
        }
        else
        {
            STATIONARY;
        }
    }
    //for the wall runner, if it hits a wall it can go left or right along that wall, so this method will take the location of the wall as an argument and the creature position, and the direction (LEFT or RIGHT) and will return the position to go to
    //so if creature at position v hits wall and wants to turn RIGHT this will give the position it wants to end up at 
    rightAnglePosition(wall,v,direction)
    {

        let tx = wall.tx-v.tx;
        let ty = wall.ty-v.ty;
        let o = tx;
        //direction will be 1 or -1, which is RIGHT or LEFT
        tx=direction*ty*-1;
        ty=direction*o;
        return {tx:v.tx+tx,ty:v.ty+ty};
    }
    moveCreature(v)
    {
        /* 20251022 we call fadeShoutOut on pathfinding and on move or else sometimes it looks like you get the shout out twice*/
        this.fadeShoutOut();
        this.updateMemory(v);
        /* 20251101 hide the proposed pos*/
        this.proposedPosSprite.visible=false;
        //update the position of where the creature used to be in the map with -1 to show there is now no creature there -  but only if that old position has this creature's index, if we just did swapCreatureWith() then this should be false and we don't set it to -1
        if(this.map.getCreatureIndex({tx:this.tx,ty:this.ty})==this.index)
        {
            this.map.setCreature({tx:this.tx,ty:this.ty},-1);
        }
        if(this.cancelMove==false)
        {    

            //if we have moved such that the trailer is on a path, then drop 1 rubble if possible
            this.attemptDumpTrailer();
            //update the new position of the creature in the map
            this.map.setCreature(v,this.index);
            //set the explored number etc for the explorer creature
            if(this.allowAlterExplorerNumber)
            {   
                
                //we should only overwrite the explored number if we are exploring, so if carryingResource is true then don't update the exploredNumber - unless we are unable to follow the exisitng path and we are exploring WITH a carried resource
                if(this.carryingResource==false||this.exploringWhileCarrying)
                {
                    this.exploredNumber++;
                    if(this.map.getExploredNumber(v)==-1||this.map.getExploredNumber(v)>this.exploredNumber)
                    {
                        this.map.setExploredNumber(v,this.exploredNumber);
                        this.shoutOut('exploring');
                    }
                    
                    this.exploringWhileCarrying=false;
                }
                //if there is a resource at the proposed position
                let resourceIndex=this.map.getResourceIndex(v);
                if(resourceIndex!=-1)
                {
                    //you can only pick up a resource if you are not already carrying one, and if there is at least one resource left
                    if(this.carryingResource==false&&this.scene.getResourceHealth(resourceIndex)>0)
                    {
                        //problem:newlyDiscovered
                        //when we pick up the resource we will find out if we are the first to discover it, which will alter how we return to the base
                        this.newlyDiscovered= this.scene.collectResource(resourceIndex);
                        if(this.newlyDiscovered)
                        {
                            this.shoutOut('found new resource');
                        }
                        //normally the tail will stop you going back on yourself, but if we just picked up a resource, we might want to go back on ourself, but instead of deleting the tail i will set it to curretn position which means i wont get index out of bounds
                        this.memory[0]=Object.assign({}, v);
                        this.carryingResource=true;
                        this.shoutOut('pick up resource');
                        //we have picked up a resource, we need to count how many resources remain from that location so we can leave a trail for others to follow
                        this.noOfResourcesDiscovered=this.scene.getResourceHealth(resourceIndex);
                    }
                }
                //if we are carrying a resource - record the number of remaining resources on each tile as we head back to the base, unless that tile already has a trail
                if(this.carryingResource)
                {
                    //returning to base laying a trail should only happen if there is no trail, editing the existing trail is the job of creatures that follow the trail to the resource
                    if(this.map.getResourceMarker(v)==-1)
                    {
                        this.scene.setResourceMarkerOnMap(v,this.noOfResourcesDiscovered);
                        this.shoutOut('set resource trail');
                    }
                }
                /**20251014 if we have discovered a bloodstain we will return to base and lay this warningTrail if the existing warningtrail has less value than this bloodstain */
                if(this.valueOfDiscoveredBloodStain>-1)
                {
                    if(this.map.getWarningMarker(v)<this.valueOfDiscoveredBloodStain)
                    {
                        this.map.setWarningMarker(v,this.valueOfDiscoveredBloodStain);
                        this.shoutOut('set warning trail');
                    }

                }
                //if we are not carrying a resource and we are following a resource marker trail, we should subtract 1 from it. this will have the result of a number of creatures equal to the number of reported resources following the resource trail 
                if(this.carryingResource==false)
                {
                    if(this.map.getResourceMarker(v)>-1)
                    {
                        this.scene.decrementResourceMarkerOnMap(v);
                        this.shoutOut('reduce resource trail');
                    }
                }
                
            }
            //if we step onto rubble - or even a wall - which implies that we dig the wall then we are on rubble ...
            if(this.map.isWall(v)==true)
            {
                //...slow down the movement by skipping the next movement
                this.skipMovement=true;
                let terrain = this.map.getTerrain(v);
                //this is where we actually dig the terrain 
                this.map.setTerrain(v,terrain-1);
                //we add a trailer to the current position - note that we have not actually updated our position yet
                this.addTrailer();
                this.shoutOut('digging');
            }           
            else
            {  
                //if we added a trailer we don't want to move the trailers
                this.moveTrailers();
            }
            if(this.map.isRubble(v)==true)
            {
                this.shoutOut('careful, rubble');
                //...slow down the movement by skipping the next movement
                this.skipMovement=true;
            }
            if(this.type==WARRIOR)
            {
                /*20251030 the stepOff bool is just to handle the initial movement off the creature base*/
                if(this.stepOff==true)
                {
                    /*set the tile we just moved to as a garrison tile */
                    this.stepOff=false;
                    this.map.setGarrisonMarker(v,1);
                }
                
                this.map.setStrengthMarker(v,this.getReportedStrength());
            }
            //instead of clearing all contested data at the tile, which would clear the flags that other creatures added to the tile, instead just clear this creature's direction from the flags - 
            //this.map.clearContested(v);
            this.map.clearContestedDirection(v,this.proposedDirection());
          
            this.tx=v.tx;
            this.ty=v.ty;
            let tempV = Helper.translateTilePosToWorldPos(v);
            this.x=tempV.x;
            this.y=tempV.y;
            Helper.centreText(this);
            Helper.centreShoutOutText(this);
            
        }
        //if we have a resource and are next to a creatureBase, add it to that creature base and set carryingresource to false
        //if we return to the creature base we should set dead end to false
        this.checkIfReturnedToBase();
    }

    //for each adjacent tile, check if there is a creature base there, if so add our carried resource to that base
    /*20251014 also end the warning trail , so set it to -1*/
    checkIfReturnedToBase()
    {
        let n = this.getAdjacent();
        let creatureBaseIndex=-1;
        //for each adjacent 
        for( let i = 0 ; i < n.length ; i ++)
        {
            //check if there is a base
            creatureBaseIndex=this.map.getCreatureBaseIndex(n[i]);
            if(creatureBaseIndex>-1)
            { 
                /*20251014 once we reach the base we can stop laying the warning trail*/
                if(this.valueOfDiscoveredBloodStain>-1)
                {
                    /*20251027 if we warn the base of a new threat, the base should begin making warriors to send out to that threat. */
                    this.scene.warnCreatureBase(creatureBaseIndex,this.valueOfDiscoveredBloodStain);
                    this.valueOfDiscoveredBloodStain=-1;
                    this.shoutOut('warned the base');
                }
                //if we are carrying a resource, drop it off and reset 
                if(this.carryingResource)
                {
                    this.carryingResource=false;
                    this.scene.addResourceToCreatureBase(creatureBaseIndex);
                    this.shoutOut('dropping resource');
                    //we now need to decrement the trail - this is normally done when we move onto a tile with a resource marker and we are not carrying a resource, but when we stepped on this tile adjacent to the creature base we were carrying one, so decrement it now
                    this.scene.decrementResourceMarkerOnMap({tx:this.tx,ty:this.ty});
                }

                //if we returned to base because there was a dead end, then alter the preferred direction - randomly- note that if testing it will increment the direction through the 8 available directions
                if(this.exploredDeadEnd)
                {
                    this.shoutOut('try new direction');
                    this.resetPreferredDirection();
                }
                /*20251021 */
                else if(this.seenWarningBool)
                {
                    this.shoutOut('forget warning');
                    this.shoutOut('try new direction');
                    this.resetPreferredDirection();
                }
                
                //even if we are not carrying a resource, reset the explored number to 1, and reset dead end flag, and reset the number of resources discovered and set the warning bool to false
                {
                    /*20251022we should reset the explored number to 1 when next to the creature base, not 0*/
                    this.exploredNumber=1;
                    /*20251110 we also need to set that on the map */
                    this.map.setExploredNumber({tx:this.tx,ty:this.ty},this.exploredNumber);
                    this.exploredDeadEnd=false;
                    this.noOfResourcesDiscovered=0;
                    this.seenWarningBool=false;
                    this.addedStrength=false;
                }
            }
        }
    }
    moveTrailers()
    {
        for(let i = this.trailerArray.length-1 ; i >0; i --)
        {
            this.trailerArray[i].tx=this.trailerArray[i-1].tx;
            this.trailerArray[i].ty=this.trailerArray[i-1].ty;
            this.trailerArray[i].x=this.trailerArray[i-1].x;
            this.trailerArray[i].y=this.trailerArray[i-1].y;
        }
        if(this.trailerArray.length>0)
        {
            this.trailerArray[0].tx=this.tx;
            this.trailerArray[0].ty=this.ty;
            this.trailerArray[0].x=this.x;
            this.trailerArray[0].y=this.y;  
        }
    }
    //for creatures which use the memory to record the 'tail' or the prev position etc
    updateMemory(v)
    {
        if(this.useTunnel)
        {
            this.newGoal=false;
            
            //when trying to tunnel, we might set the goal to the start of the tunnel, if the proposed position is to then visit that goal, change the goal back to the old goal 
            if(Helper.vectorEquals({tx:v.tx,ty:v.ty},this.goal))
            {
                this.goal=this.oldGoal;
                this.newGoal=true;
                this.shortcutMode=false;
                this.killAllTunnels();
            }
            //for each potentialTunnel
            for(let i = 0; i < this.potentialTunnelArray.length; i ++)
            {
                //if we revisit the tunnel position, 
                if(Helper.vectorEquals({tx:v.tx,ty:v.ty},{tx:this.potentialTunnelArray[i].tx,ty:this.potentialTunnelArray[i].ty}))
                {
                    //cancel that tunnel 
                    //if we set a potentialTunnelStartPos, and then for example we travel in a straight line up, then back down, due to walls, the proposedpos will be to revisit the potentialTunnelStartPos, in this case cancel the tunnel 
                    this.newGoal=true;
                    this.shortcutMode=false;
                    this.potentialTunnelArray[i].kill();
                    break;
                }
            }
        
      
        
            let oldMemoryDirection = this.memoryDirection;
            //record the previous position
            this.memoryDirection=this.proposedDirection();
        
            //if any tunnel is alive, record the distance to that pos
            for(let i = 0; i < this.potentialTunnelArray.length; i ++)
            {
                if(this.potentialTunnelArray[i].alive)
                {
                    let oldDistToPotentialTunnelStartPos = this.potentialTunnelArray[i].distanceToOriginatingCreature;
                    this.potentialTunnelArray[i].distanceToOriginatingCreature = Helper.dist({tx:v.tx,ty:v.ty},{tx:this.potentialTunnelArray[i].tx,ty:this.potentialTunnelArray[i].ty});
                    //if we are moving further away 
                    if(this.potentialTunnelArray[i].distanceToOriginatingCreature - oldDistToPotentialTunnelStartPos>=0)
                    {
                        //if we move away after previously moving closer, then we found a shortcut
                        if(this.potentialTunnelArray[i].viable)
                        {
                            this.shortcutMode=true;
                            //we don't want to move further away, so cancel the move, next update we will move towards the tunnel pos
                            this.cancelMove=true;
                            //save our current goal as we are about to overwrite it
                            this.oldGoal=this.goal;
                            this.goal={tx:this.potentialTunnelArray[i].tx,ty:this.potentialTunnelArray[i].ty};
                            //this newGoal boolean affects how we pathfind
                            this.newGoal=true;
                            this.killAllTunnels();
                            if(this.rememberWall)
                            {
                                this.memory = [];
                            }
                        }
                    }
                    //if we are moving closer
                    else
                    {
                        //set a flag saying shortcut viable, 
                        this.potentialTunnelArray[i].viable=true;
                    }
                }
            
            }
            //if we are changing direction, and the previous direction was not stationary and we are not currently in the shortcutMode and we did not change direction due to a new goal and we actually encountered a wall
            if(oldMemoryDirection!=this.memoryDirection&&oldMemoryDirection!=STATIONARY&&this.shortcutMode==false&&this.newGoal==false&&this.encounteredWall)
            {
                this.addTunnel();
                this.shoutOut('tunnel');
            }
        }

        if(this.rememberTail)
        {
            this.memory=[];
            this.memory.push({tx:this.tx,ty:this.ty});
        }
        if(this.rememberWall&&this.memory.length>0)
        {
            let wall = Object.assign({}, this.memory[0]);
            //if the creature has just moved to the wall then it must have turned a corner
            if(Helper.vectorEquals(wall,this.proposedPos))
            {
                // get the velocity we are about to move 
                let d = {tx:wall.tx-this.tx,ty:wall.ty-this.ty};
                //times that by the following and the creature's preferred direction and move in the other axis to get the new wall position
                wall.ty=wall.ty+(d.tx*-1*this.wallRunnerDirection);
                wall.tx=wall.tx+(d.ty*+1*this.wallRunnerDirection);
                this.memory=[];
                this.memory.push(wall);
            }
            else
            {
                //turn the wall from a position like 4,6 to a direciton from the creature's current positon like, -1,0
                wall.tx=wall.tx-this.tx;
                wall.ty=wall.ty-this.ty;
                //now turn the wall back into a position by adding that direction to the new position 
                wall.tx=wall.tx+this.proposedPos.tx;
                wall.ty=wall.ty+this.proposedPos.ty;
                this.memory=[];
                this.memory.push(wall);
            }
        }
    }
    addTunnel()
    {
        //if there is an existing tunnel that is not alive (in use), then use that, loop in reverse order to help solve PROBLEMUNNESSARYTUNNELS
        for(let i =  this.potentialTunnelArray.length-1; i >=0 ; i --)
        {
            if(this.potentialTunnelArray[i].alive==false)
            {
                this.potentialTunnelArray[i].tx=this.tx;
                this.potentialTunnelArray[i].ty=this.ty;
                this.potentialTunnelArray[i].x=this.x;
                this.potentialTunnelArray[i].y=this.y;
                this.potentialTunnelArray[i].distanceToOriginatingCreature=0;
                this.potentialTunnelArray[i].viable=false;
                this.potentialTunnelArray[i].alive=true;
                return;
            }
        }
        //otherwise add a new one, adding it to the start of the array will solve the PROBLEMUNNESSARYTUNNELS
        this.potentialTunnelArray.splice(0,0,new PotentialTunnel(this.scene,this.x,this.y,this.texture));
    }
    //if any tunnel is alive return true, else return false
    isAnyTunnelAlive()
    {
        for(let i = 0; i < this.potentialTunnelArray.length; i ++)
        {   
            if(this.potentialTunnelArray[i].alive)
            {
                return true;
            }
        }
        return false;
    }
    killAllTunnels()
    {
        for(let i = 0; i < this.potentialTunnelArray.length; i ++)
        {
            this.potentialTunnelArray[i].kill();
        }
    }
    killAllTunnelsExcept(index)
    {
        for(let i = 0; i < this.potentialTunnelArray.length; i ++)
        {
            if(i=index)
            {
                continue;
            }
            else
            {
                this.potentialTunnelArray[i].kill();
            }
        } 
    }
    addTrailer()
    {
        this.trailerArray.splice(0,0,new Trailer(this.scene,this.x,this.y,this.trailerTexture));
    }
    killTrailer()
    {
        //remove the last item from the trailerArray, and run that item's kill method 
        this.trailerArray.slice(0)[0].kill();   
        this.trailerArray.splice(0,1);
    }
    attemptDumpTrailer()
    {
        if(this.trailerArray.length>0)
        {
            if(this.map.isPath({tx:this.trailerArray[0].tx,ty:this.trailerArray[0].ty})==true)
            {                    
                this.killTrailer();
                this.shoutOut('dumping');
            }
        }
    }
    updateMemoryWall(v)
    {
        if(this.rememberWall)
        {
            this.memory=[];
            this.memory.push(v);
            this.shoutOut('a wall');
        }
    }
    //v is the proposed pos
    swapCreatureWith(v)
    {
        this.shoutOut('swapping pos');
        //this creature wants to move to the given position but it is occupied by a creature that wants to move to this creature's position, so we can swap them
        //save the other creature's index
        let creatureBIndex = this.map.getCreatureIndex(v);
        //save this creature's position
        let creatureAPos = {tx:this.tx,ty:this.ty};
        //use the moveCreature method to update creatureB's position, we don't have access to that, just let the scene do it 
        this.scene.updateCreaturePos(creatureBIndex,creatureAPos);
        this.moveCreature(this.proposedPos);
    }
    setGoal(v)
    {
        this.goal=v;
    }
}