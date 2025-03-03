import Helper from './Helper.js';
import PotentialTunnel from './PotentialTunnel.js';
import Trailer from './Trailer.js';
export default class Creature extends Phaser.GameObjects.Sprite 
{    
    //this many milliseconds must pass before the player is allowed to make a move
    static playerMoveTimerStep=500;
    static playerMoveTimer=Creature.playerMoveTimerStep;
    constructor(scene, x, y, texture,trailerTexture,index,colour,map,priorityArray) 
    {
        super(scene, x, y, texture);
        this.texture=texture;
        this.trailerTexture=trailerTexture;
        this.scene=scene;
        scene.add.existing(this);
        this.index=index;
        //pass in a reference to the map data, so we can query the map to see if there is a wall etc
        this.map=map;
        //i've made the player image be the same size as the value it can move in one go 
        this.setScale(gridStep);
        //this is a simple way to give the player a colour based on it's index, so each player should look a little different
        this.setTint(colour);
        this.text = scene.add.text(this.x, this.y, 'c'+this.index, { fontSize: '20px', fill: '#fff'});
        Helper.centreText(this);
        this.goal={x:x,y:y};
        this.oldGoal={x:undefined,y:undefined};
        //we may start tunnelling if we change direction, that's assuming that we changed direction due to hitting a wall, if we changed direction due to getting a new goal, then we set this flag so that we ignore that change in direction for tunnelling purposes
        this.newGoal=false;
        this.proposedPos;
        this.priorityArray=priorityArray;
        //the memory can be various things, but related to pathfinding
        this.memory=[];
        //rememberTail will be used for tail3 pathfinding
        this.rememberTail=false;
        //rememberWall will be used for wallRunner4 pathfinding, it will overwrite rememberTail
        this.rememberWall=true;
        //use this to store the previous position, we will update this in the move method and the swapCreatureWith method 
        this.memoryDirection=STATIONARY;
        this.shortcutMode=false;
        this.cancelMove=false;
        this.encounteredWall=false;
        this.potentialTunnelArray =[];

        this.trailerArray=[];

        
        //add a sprite so i can see where the proposed pos is 
        this.proposedPosSprite = new Phaser.GameObjects.Sprite(scene,undefined,undefined,texture);
        scene.add.existing(this.proposedPosSprite);
        this.proposedPosSprite.setTint(0x00ff00);
        this.proposedPosSprite.setScale(5);

        this.distToPotentialTunnelStartPos=0;
        //for wall runners, the direction can be RIGHT or LEFT
        this.wallRunnerDirection = RIGHT;
        //if walking over rubble we will walk slower, this is achieved by using this flag, if this is set to true we skip one movement and one pathfinding update
        this.skipMovement=false;
    }
    updatePathfinding(delta)
    {
        //the timing of this update will happen in the main.js 
        this.proposedPos=this.pathfinding();
        this.proposedPosSprite.x=this.proposedPos.x;
        this.proposedPosSprite.y=this.proposedPos.y;
    }
    updatePosition(delta)
    {
        this.move();
    }
    //for now this will just beeline to the goal, ignoring any terrain 
    pathfinding()
    {
        //if the creature finds a tunnel to dig it will cancel it's current move, this happens in the move method - just before it moves, when we get to the pathfinding again - like here - we can reset this to false. 
        this.cancelMove=false;
        let proposedPathfindingPosition = this.wallRunnerDigger5();
        //so the creature will store its proposed position, and we will add this creature's index to the priority array for the direction it is travelling, we also store either the x or y pos to aid sorting
        this.proposePathfinding();
        return proposedPathfindingPosition;
    }
    beeline1()
    {
        this.proposedPos=undefined;
        if(this.x<this.goal.x)
        {
            this.proposedPos={x:this.x+gridStep,y:this.y};
        }
        else if(this.x>this.goal.x)
        {
            this.proposedPos={x:this.x-gridStep,y:this.y};
        }
        else if(this.y<this.goal.y)
        {
            this.proposedPos={x:this.x,y:this.y+gridStep};
        }
        else if(this.y>this.goal.y)
        {
            this.proposedPos={x:this.x,y:this.y-gridStep};
        }
        return this.proposedPos;
    }
    //test which direction is closest to the goal. of those, return the closest to goal which is a path
    beeline2()
    {
        this.proposedPos=undefined;
        let neighbours = this.getNeighbours({x:this.x,y:this.y});
        neighbours = this.sortNeighbours(neighbours,this.goal);
        for( let i = 0 ; i < neighbours.length ; i ++)
        {
            if(this.map.isPath(Helper.translatePosToMapPos(neighbours[i])))
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
        let neighbours = this.getNeighbours({x:this.x,y:this.y});
        //sort the neighbours in order of closest to goal
        neighbours = this.sortNeighbours(neighbours,this.goal);
        //record the tail, the memeory should be an array, so a little error handling just incase there is no memory yet
        let tail = this.memory.length>0?this.memory[0]:undefined;
        //test if the 'neighbour closest to goal' is a path, if so return that as proposed position, if not check the next closest, also check that that proposed pos is not the tail 
        for( let i = 0 ; i < neighbours.length ; i ++)
        {
            if(this.map.isPath(Helper.translatePosToMapPos(neighbours[i]))&& ! Helper.vectorEquals(neighbours[i],tail))
            {
                this.proposedPos=neighbours[i];
                break;
            }
        }
        //if the proposedPos is still undefined, then none of the 4 directions fit the criteria of; is a path and is not the tail, if so then check if the tail is a path and return that pos
        if(this.proposedPos==undefined&&tail!=undefined&&this.map.isPath(Helper.translatePosToMapPos(tail)))
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
            if(this.map.isPath(Helper.translatePosToMapPos(wall)))
            {
                this.proposedPos=wall;
                return this.proposedPos;
            }
            else
            {
                //otherwise if the wall is a wall, then set the proposedPos to the position to the left or right of that wall depending on this creature's direction value
                this.proposedPos = this.rightAnglePosition(wall,{x:this.x,y:this.y},this.wallRunnerDirection);
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
        let wall = this.memory.length>0?Object.assign({}, this.memory[0]):undefined;
        if(this.shortcutMode)
        {
            this.proposedPos = this.beelineDigger6();
            return this.proposedPos;  
        }
        else if(wall)
        {
            //the wall memory will be where the wall should be, if we happen to have gone around the outside of a corner then the wall could actually be a path, if so move onto it - so we have followed the wall around a corner . 
            //i'm making this creature be able to walk on path and rubble, so instead of checking for a path, check the tile is not a wall
            if(this.map.isWall(Helper.translatePosToMapPos(wall))==false)
            {
                this.proposedPos=wall;
                return this.proposedPos;
            }
            else
            {
                this.encounteredWall=true;
                //otherwise if the wall is a wall, then set the proposedPos to the position to the left or right of that wall depending on this creature's direction value
                this.proposedPos = this.rightAnglePosition(wall,{x:this.x,y:this.y},this.wallRunnerDirection);
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
        let neighbours = this.getNeighbours({x:this.x,y:this.y});
        neighbours = this.sortNeighbours(neighbours,this.goal);
        for( let i = 0 ; i < neighbours.length ; i ++)
        {
            if(this.shortcutMode||this.map.isWall(Helper.translatePosToMapPos(neighbours[i]))==false)
            {
                this.proposedPos=neighbours[i];
                break;
            }
        }
        return this.proposedPos;
    }
    //so the creature will store its proposed position, and we will add this creature's index to the priority array for the direction it is travelling, we also store either the x or y pos to aid sorting
    proposePathfinding()
    {
        
        let dir = this.proposedDirection();
        switch(dir)
        {
            case NORTH:  
                this.priorityArray.addAndSort(this.priorityArray.north,{index:this.index,p:this.y},NORTH);
                break;
            case SOUTH: 
                this.priorityArray.addAndSort(this.priorityArray.south,{index:this.index,p:this.y},SOUTH);
                break;
            case EAST:    
                this.priorityArray.addAndSort(this.priorityArray.east,{index:this.index,p:this.x},EAST);
                break;
            case WEST:    
                this.priorityArray.addAndSort(this.priorityArray.west,{index:this.index,p:this.x},WEST);
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
        a.push({x:v.x+gridStep* 0,y:v.y+gridStep*-1});//north
        a.push({x:v.x+gridStep* 1,y:v.y+gridStep* 0});//east
        a.push({x:v.x+gridStep* 0,y:v.y+gridStep* 1});//south
        a.push({x:v.x+gridStep*-1,y:v.y+gridStep* 0});//west
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
                if(this.map.inBounds(Helper.translatePosToMapPos(this.proposedPos)))
                {
                    //if the proposed position does not already have a player on it or a vehicle
                    if(this.map.getPlayerIndex(Helper.translatePosToMapPos(this.proposedPos))==-1 && (this.map.getVehicleIndex(Helper.translatePosToMapPos(this.proposedPos))==-1))
                    {
                        //if the proposed position is a path - and not a wall or rubble, or this.shortcutMode is active
                        //updating this so that creatures can walk on rubble an path
                        if(this.map.isWall(Helper.translatePosToMapPos(this.proposedPos))==false||this.shortcutMode)
                        {             
                            //this will be NORTH, SOUTH, EAST or WEST or STATIONARY
                            let dir = this.proposedDirection();
                            //if the proposed position does not already have a creature on it
                            if(this.map.getCreatureIndex(Helper.translatePosToMapPos(this.proposedPos))==-1)
                            {
                                //even if the proposed position has no creature on it we should still...
                                ///...check if the proposed position is contested, 
                                //specifically if it is contested by some direction other than our direction, and not contested by our direction - in that case do not move
                                if(this.map.isContestedExcluding(Helper.translatePosToMapPos(this.proposedPos),dir))
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
                                if(this.map.isContestedFromOpposite(Helper.translatePosToMapPos({x:this.x,y:this.y}),dir))
                                {
                                    this.swapCreatureWith(this.proposedPos);
                                }
                                // if not already contested, then mark it as contested by the direction we wanted to move in
                                else
                                {
                                    this.map.setContested(Helper.translatePosToMapPos(this.proposedPos),dir);
                                }
                            }
                        }
                        //if the proposed position is a wall  set the memory to record that wall
                        else if (this.map.isWall(Helper.translatePosToMapPos(this.proposedPos)))
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
    kill()
    {
        this.x=undefined;
        this.y=undefined;
        //if the creature is destroyed we must clear it's contested data or else creatures could end up teleporting
        this.map.clearContested({x:this.x,y:this.y});
        //get rid of the tunnel
        for(let i = 0; i < this.potentialTunnelArray.length; i ++)
        {
            this.potentialTunnelArray[i].kill();
        }
    }
    proposedDirection()
    {
        if(this.proposedPos==undefined )
        {
            return STATIONARY;
        }
        else if(this.proposedPos.x-this.x==-1*gridStep)
        {
            return WEST;
        }
        else if(this.proposedPos.x-this.x==1*gridStep)
        {
            return EAST;
        }
        else if(this.proposedPos.y-this.y==-1*gridStep)
        {
            return NORTH;
        }
        else if(this.proposedPos.y-this.y==1*gridStep)
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

        let x = wall.x-v.x;
        let y = wall.y-v.y;
        let o = x;
        //direction will be 1 or -1, which is RIGHT or LEFT
        x=direction*y*-1;
        y=direction*o;
        return {x:v.x+x,y:v.y+y};
    }
    moveCreature(v)
    {
        this.updateMemory(v);
        //update the position of where the creature used to be in the map with -1 to show there is now no creature there -  but only if that old position has this creature's index, if we just did swapCreatureWith() then this should be false and we don't set it to -1
        if(this.map.getCreatureIndex(Helper.translatePosToMapPos({x:this.x,y:this.y}))==this.index)
        {
            this.map.setCreature(Helper.translatePosToMapPos({x:this.x,y:this.y}),-1);
        }
        if(this.cancelMove==false)
        {    

            //if we have moved such that the trailer is on a path, then drop 1 rubble if possible
            this.attemptDumpTrailer();
            //update the new position of the creature in the map
            this.map.setCreature(Helper.translatePosToMapPos(v),this.index);
            //if we step onto rubble - or even a wall - which implies that we dig the wall then we are on rubble ...
            if(this.map.isWall(Helper.translatePosToMapPos(v))==true)
            {
                //...slow down the movement by skipping the next movement
                this.skipMovement=true;
                let terrain = this.map.getTerrain(Helper.translatePosToMapPos(v));
                //this is where we actually dig the terrain 
                this.map.setTerrain(Helper.translatePosToMapPos(v),terrain-1);
                //we add a trailer to the current position - note that we have not actually updated our position yet
                this.addTrailer();
            }           
            else
            {  
                //if we added a trailer we don't want to move the trailers
                this.moveTrailers();
            }
            if(this.map.isRubble(Helper.translatePosToMapPos(v))==true)
            {
                //...slow down the movement by skipping the next movement
                this.skipMovement=true;
            }
            this.x=v.x;
            this.y=v.y;
            Helper.centreText(this);
        }
        this.map.clearContested(Helper.translatePosToMapPos(v));
    }
    moveTrailers()
    {
        for(let i = this.trailerArray.length-1 ; i >0; i --)
        {
            this.trailerArray[i].x=this.trailerArray[i-1].x;
            this.trailerArray[i].y=this.trailerArray[i-1].y;
            console.log('MOVEtrailer ' + i +' x: '+this.trailerArray[i].x+' y: '+this.trailerArray[i].y);            
        }
        if(this.trailerArray.length>0)
        {
            this.trailerArray[0].x=this.x;
            this.trailerArray[0].y=this.y;
            console.log('MOVEtrailer ' + 0 +' x: '+this.trailerArray[0].x+' y: '+this.trailerArray[0].y);  
        }
    }
    //for creatures which use the memory to record the 'tail' or the prev position etc
    updateMemory(v)
    {
        this.newGoal=false;
        
        //when trying to tunnel, we might set the goal to the start of the tunnel, if the proposed position is to then visit that goal, change the goal back to the old goal 
        if(Helper.vectorEquals({x:v.x,y:v.y},this.goal))
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
            if(Helper.vectorEquals({x:v.x,y:v.y},{x:this.potentialTunnelArray[i].x,y:this.potentialTunnelArray[i].y}))
            {
                //cancel that tunnel 
                //if we set a potentialTunnelStartPos, and then for example we travel in a straight line up, then back down, due to walls, the proposedpos will be to revisit the potentialTunnelStartPos, in this case cancel the tunnel 
                this.newGoal=true;
                this.shortcutMode=false;
                this.potentialTunnelArray[i].kill();
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
                this.potentialTunnelArray[i].distanceToOriginatingCreature = Helper.dist({x:v.x,y:v.y},{x:this.potentialTunnelArray[i].x,y:this.potentialTunnelArray[i].y});
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
                        this.goal={x:this.potentialTunnelArray[i].x,y:this.potentialTunnelArray[i].y};
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
        }
        if(this.rememberTail)
        {
            this.memory=[];
            this.memory.push({x:this.x,y:this.y});
        }
        if(this.rememberWall&&this.memory.length>0)
        {
            let wall = Object.assign({}, this.memory[0]);
            //if the creature has just moved to the wall then it must have turned a corner
            if(Helper.vectorEquals(wall,this.proposedPos))
            {
                // get the velocity we are about to move 
                let d = {x:wall.x-this.x,y:wall.y-this.y};
                //times that by the following and the creature's preferred direction and move in the other axis to get the new wall position
                wall.y=wall.y+(d.x*-1*this.wallRunnerDirection);
                wall.x=wall.x+(d.y*+1*this.wallRunnerDirection);
                this.memory=[];
                this.memory.push(wall);
            }
            else
            {
                //turn the wall from a position like 4,6 to a direciton from the creature's current positon like, -1,0
                wall.x=wall.x-this.x;
                wall.y=wall.y-this.y;
                //now turn the wall back into a position by adding that direction to the new position 
                wall.x=wall.x+this.proposedPos.x;
                wall.y=wall.y+this.proposedPos.y;
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
        console.log('ADD trailer ' + 0 +' x: '+this.x+' y: '+this.y);  
    }
    killTrailer()
    {
        //remove the last item from the trailerArray, and run that item's kill method 
        this.trailerArray.pop().kill();   
    }
    attemptDumpTrailer()
    {
        if(this.trailerArray.length>0)
        {
            if(this.map.isPath(Helper.translatePosToMapPos({x:this.trailerArray[0].x,y:this.trailerArray[0].y}))==true)
            {                    
                this.killTrailer();
            }
        }
    }
    updateMemoryWall(v)
    {
        if(this.rememberWall)
        {
            this.memory=[];
            this.memory.push(v);
        }
    }
    //v is the proposed pos
    swapCreatureWith(v)
    {
        //this creature wants to move to the given position but it is occupied by a creature that wants to move to this creature's position, so we can swap them
        //save the other creature's index
        let creatureBIndex = this.map.getCreatureIndex(Helper.translatePosToMapPos(v));
        //save this creature's position
        let creatureAPos = {x:this.x,y:this.y};
        //use the moveCreature method to update creatureB's position, we don't have access to that, just let the scene do it 
        this.scene.updateCreaturePos(creatureBIndex,creatureAPos);
        this.moveCreature(this.proposedPos);
    }
    setGoal(v)
    {
        this.goal=v;
    }
}