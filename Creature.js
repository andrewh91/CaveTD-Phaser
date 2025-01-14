import Helper from './Helper.js';
export default class Creature extends Phaser.GameObjects.Sprite 
{    
    //this many milliseconds must pass before the player is allowed to make a move
    static playerMoveTimerStep=320;
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
    update(delta)
    {
        //the timing of this update will happen in the main.js 
        this.proposedPos=this.updatePathfinding();
        this.updatePos();
    }
    //for now this will just beeline to the goal, ignoring any terrain 
    updatePathfinding()
    {
        this.proposedPos=undefined;
        if(this.x<this.goal.x)
        {
            this.proposedPos={x:this.x+gridStep,y:this.y};
            this.priorityArray.east.push(this.index);
        }
        else if(this.x>this.goal.x)
        {
            this.proposedPos={x:this.x-gridStep,y:this.y};
            this.priorityArray.west.push(this.index);
        }
        else if(this.y<this.goal.y)
        {
            this.proposedPos={x:this.x,y:this.y+gridStep};
            this.priorityArray.south.push(this.index);
        }
        else if(this.y>this.goal.y)
        {
            this.proposedPos={x:this.x,y:this.y-gridStep};
            this.priorityArray.north.push(this.index);
        }
        else
        {
            this.priorityArray.stationary.push(this.index);
        }
        return this.proposedPos;
    }
    updatePos()
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
                        //if the proposed position does not already have a creature on it
                        if(this.map.getCreatureIndex(Helper.translatePosToMapPos(this.proposedPos))==-1)
                        {
                            this.moveCreature(this.proposedPos);
                        }
                    }
                }
            }
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
    }
    setGoal(v)
    {
        this.goal=v;
    }
}