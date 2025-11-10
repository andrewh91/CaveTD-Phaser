import Helper from './Helper.js';
export default class CreatureBase extends Phaser.GameObjects.Sprite 
{    
    constructor(scene, x, y, texture,index,colour,map) 
    {
        super(scene, x, y, texture);
        scene.add.existing(this);
        //the tx is a more useful way of figuring out where the player is in the world, this.x is the world coord, but this is a grid based game, and the player could be at position (60,10) in order to figure out where the player is you would need to know what the gridstep is, and that the grid does not start at 0,0, it has an offset, so (60,10) could be (2,0) tile position if the gridstep is 25 and the offset is (10,10)
        this.tx=(this.x-mapOffSetX)/gridStep;
        this.ty=(this.y-mapOffSetY)/gridStep;
        this.resources=10;
        this.map=map;
        this.addToMap();
        this.setScale(gridStep);
        this.setTint(colour);
        this.index=index;
        this.text = scene.add.text(this.x, this.y, ''+this.resources, { fontSize: '20px', fill: '#fff'});
        Helper.centreText(this);
        this.threatLevel=0;
        this.cautiousness=3;
    }
    addToMap()
    {
        this.map.setCreatureBaseIndex({tx:this.tx,ty:this.ty},this.index);
    }
    createCreature(type)
    {
        /*20251027 amending the creature to add to the waiting room to include a type, so far that could be worker or warrior*/
        this.scene.addCreatureToWaitingRoom({tx:this.tx,ty:this.ty,gx:0,gy:0,type:type});
        this.updateResources();
    }
    /*20251027 when warned of a blood stain value, add that value to the creature base threat value*/
    addThreat(value)
    {
        this.threatLevel+=(value*this.cautiousness);
        this.updateResources();
    }
    /*20251027 when you addThreat or createCreature or addResouce we can reevaluate the resources.*/
    updateResources()
    {
        /*if there is a threat we should create a warrior, but we can only do that if we have enough resources. */
        if(this.threatLevel>0)
        {
            if(this.resources>0)
            {
                /*the threat value will correlate with how dangerous of a threat it is. so a high threat will require a larger number of creatures or particularly strong creatures. the strength of these creatures is represented in a stength value, which is also the value that will be subtracted from the resources and the threat level - such that once the base has created enough creatures to tackle the threat its threatLevel value will be reduced to 0 and it will stop making creatures. */
                let tempCreatureStrength = 1;
                this.resources-=tempCreatureStrength;
                this.threatLevel -= tempCreatureStrength;
                this.createCreature(WARRIOR);
            }
            /*if there are not enough resources we cannot make a warrior, but this updateResoures method will be called again when more resources are gathered, so we will make a warrior then*/
        }
    }
    addResource()
    {
        this.resources++;
        this.updateText(this.resources);
        this.updateResources();
    }
    updateText(newText)
    {
        this.text.setText(newText);
        Helper.centreText(this);
    }
}