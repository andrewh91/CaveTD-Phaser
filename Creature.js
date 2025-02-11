import Helper from './Helper.js';
export default class Creature extends Phaser.GameObjects.Sprite 
{    
    //this many milliseconds must pass before the player is allowed to make a move
    static playerMoveTimerStep=500;
    static playerMoveTimer=Creature.playerMoveTimerStep;
    constructor(scene, x, y, texture,index,colour,map,priorityArray) 
    {
        super(scene, x, y, texture);
        
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
        this.proposedPos;
        this.priorityArray=priorityArray;
        //the memory can be various things, but related to pathfinding
        this.memory=[];
        //rememberTail will be used for tail3 pathfinding
        this.rememberTail=false;
        //rememberWall will be used for wallRunner4 pathfinding, it will overwrite rememberTail
        this.rememberWall=true;
        //for wall runners, the direction can be RIGHT or LEFT
        this.wallRunnerDirection = RIGHT;
    }
    updatePathfinding(delta)
    {
        //the timing of this update will happen in the main.js 
        this.proposedPos=this.pathfinding();
    }
    updatePosition(delta)
    {
        this.move();
    }
    //for now this will just beeline to the goal, ignoring any terrain 
    pathfinding()
    {
        let proposedPathfindingPosition = this.wallRunner4();
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
        if(this.proposedPos)
        {
            //if the proposed position is not outside the map
            if(this.map.inBounds(Helper.translatePosToMapPos(this.proposedPos)))
            {
                //if the proposed position does not already have a player on it or a vehicle
                if(this.map.getPlayerIndex(Helper.translatePosToMapPos(this.proposedPos))==-1 && (this.map.getVehicleIndex(Helper.translatePosToMapPos(this.proposedPos))==-1))
                {
                    //if the proposed position is a path - and not a wall or rubble
                    if(this.map.isPath(Helper.translatePosToMapPos(this.proposedPos)))
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
                    //if the proposed position is a wall set the memory to record that wall
                    else if (this.map.isWall(Helper.translatePosToMapPos(this.proposedPos)))
                    {
                        this.updateMemoryWall(this.proposedPos);
                    }
                }
            }
        }
    }
    kill()
    {
        //if the creature is destroyed we must clear it's contested data or else creatures could end up teleporting
        this.map.clearContested({x:this.x,y:this.y});
    }
    proposedDirection()
    {
        if(this.proposedPos.x-this.x==-1*gridStep)
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
            STATIONARY;
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
        this.updateMemory();
        //update the old position of the creature in the map
        this.map.setCreature(Helper.translatePosToMapPos({x:this.x,y:this.y}),-1);
        this.x=v.x;
        this.y=v.y;
        Helper.centreText(this);
        //update the new position of the creature in the map
        this.map.setCreature(Helper.translatePosToMapPos(v),this.index);
        this.map.clearContested(Helper.translatePosToMapPos(v));
    }
    //for creatures which use the memory to record the 'tail' or the prev position, 
    updateMemory()
    {
        if(this.rememberTail)
        {
            this.memory=[];
            this.memory.push({x:this.x,y:this.y});
        }
        if(this.rememberWall&&this.memory.length>0)
        {
            let wall = Object.assign({}, this.memory[0]);
            //if the creature has just moved on top of the wall then it must have turned a corner
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
    updateMemoryWall(v)
    {
        if(this.rememberWall)
        {
            this.memory=[];
            this.memory.push(v);
        }
    }
    swapCreatureWith(v)
    {
        //this creature wants to move to the given position but it is occupied by a creature that wants to move to this creature's position, so we can swap them
        //save the other creature's index
        let creatureBIndex = this.map.getCreatureIndex(Helper.translatePosToMapPos(v));
        //save this creature's position
        let creatureAPos = {x:this.x,y:this.y};
        //set creature A's map pos to store the creature B's index
        this.map.setCreature(Helper.translatePosToMapPos(creatureAPos),creatureBIndex);
        //set new location to hold the creature A's index
        this.map.setCreature(Helper.translatePosToMapPos(v),this.index);
        //update creature A's position
        this.x=v.x;
        this.y=v.y;
        Helper.centreText(this);
        //update creatureB's position, we don't have access to that, just let the scene do it 
        this.scene.updateCreaturePos(creatureBIndex,creatureAPos);
        this.map.clearContested(Helper.translatePosToMapPos(v));
        this.map.clearContested(Helper.translatePosToMapPos(creatureAPos));
    }
    setGoal(v)
    {
        this.goal=v;
    }
}