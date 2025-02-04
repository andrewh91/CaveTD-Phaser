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
        let proposedPathfindingPosition = this.beeline2();
        //so the creature will store its proposed position, and we will add this creature's index to the priority array for the direction it is travelling, we also store either the x or y pos to aid sorting
        this.proposePathfinding();
        return proposedPathfindingPosition;
    }
    beeline()
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
    moveCreature(v)
    {
        //update the old position of the creature in the map
        this.map.setCreature(Helper.translatePosToMapPos({x:this.x,y:this.y}),-1);
        this.x=v.x;
        this.y=v.y;
        Helper.centreText(this);
        //update the new position of the creature in the map
        this.map.setCreature(Helper.translatePosToMapPos(v),this.index);
        this.map.clearContested(Helper.translatePosToMapPos(v));
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