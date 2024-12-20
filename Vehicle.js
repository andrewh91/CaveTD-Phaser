
import Player from './player.js';
export default class Vehicle extends Phaser.GameObjects.Sprite {
        constructor(scene, x, y, texture,rubbleTexture,index,colour,map) {
        super(scene, x, y, texture);
        
        scene.add.existing(this);
        this.depth=1;
        this.index=index;
        //i've made the player image be the same size as the value it can move in one go 
        this.setScale(gridStep);
        //this is a simple way to give the player a colour based on it's index, so each player should look a little different
        this.setTint(colour);
        this.text = scene.add.text(this.x, this.y, 'v'+this.index, { fontSize: '20px', fill: '#fff'});
        this.text.depth=1.1;
        this.centreText();
        this.playerIndex=-1;
        this.map=map;
        //the vehicle is capable of carrying one or more rubble, each carried rubble wil be indicated by an icon
        this.rubbleIcons=[];
        this.rubbleIconsPos=[];
        this.addRubbleIcons(x,y,rubbleTexture);
        this.addRubbleIcons(x,y,rubbleTexture);
        this.addRubbleIcons(x,y,rubbleTexture);
        //i have not added support for maxRubbleCarried to be more than 3
        this.maxRubbleCarried=3;
        this.rubbleCarried=0;
    }
    //this method is to help set up the rubble icons on the vehicle
    addRubbleIcons(x,y,rubbleTexture)
    {
        let scale = gridStep/5;       
        //the rubble will be drawn at the centre of the vehicle, i want the 3 rubble to appear evenly spaced across the bottom of the vehicle, this will accomplish that
        let offset = {x:-gridStep/2+scale+(scale*1.5*this.rubbleIconsPos.length),y:+gridStep/2-scale};
        this.rubbleIconsPos.push(offset);

        let rubble = this.scene.add.sprite(x+offset.x, y+offset.y,rubbleTexture);
        this.rubbleIcons.push(rubble);
        rubble.setScale(scale);
        rubble.depth=1.3;
        //the rubble icon will be invisible to start with, becoming visible to represent how much rubble we are carrying
        rubble.setVisible(false);

    }
    update(delta)
    {

    }
    //this method is for when the vehicle picks up some rubble, if it can't carry any more rubble it returns true which will prevent the player class from changing the wall terrain
    addRubble()
    {
        if(this.rubbleCarried<this.maxRubbleCarried)
        {
            this.rubbleCarried++;
            this.updateRubbleVisibility();
            return false;
        }
        return true;
    }
    removeRubble()
    {
        if(this.rubbleCarried>0)
        {
            this.rubbleCarried--;
            this.updateRubbleVisibility();
            return false
        }
        return true;
    }
    updateRubbleVisibility()
    {
        //make them all invisible then, for each rubble carried make one visible
        for(let i = 0 ; i < this.rubbleIcons.length; i ++)
        {
            this.rubbleIcons[i].setVisible(false);
        }        
        for(let i = 0 ; i < this.rubbleCarried; i ++)
        {
            this.rubbleIcons[i].setVisible(true);
        }
    }
    updateRubbleIconsPos()
    {
        //makesure the rubble maintains it's position within the vehicle
        for(let i = 0 ; i < this.rubbleIcons.length; i ++)
        {
            this.rubbleIcons[i].setPosition(this.x+this.rubbleIconsPos[i].x,this.y+this.rubbleIconsPos[i].y)
        }
    }

    moveVehicle(v)
    {
        //update the old position of the player in the map
        this.map.setVehicle(Player.translatePosToMapPos({x:this.x,y:this.y}),-1);
        this.x=v.x;
        this.y=v.y;
        this.updateRubbleIconsPos();
        this.centreText();
        //update the new position of the player in the map
        this.map.setVehicle(Player.translatePosToMapPos(v),this.index);
    }
    centreText()
    {
        this.text.setPosition(this.x-this.text.width/2,this.y-this.text.height/2);
    }
}