export default class Player extends Phaser.GameObjects.Sprite {
    
        //this many milliseconds must pass before the player is allowed to make a move
        static playerMoveTimerStep=160;
        constructor(scene, x, y, texture,index,colour,map) {
        super(scene, x, y, texture);
        
        scene.add.existing(this);
        this.index=index;
        //pass in a reference to the map data, so we can query the map to see if there is a wall etc
        this.map=map;
        //i've made the player image be the same size as the value it can move in one go 
        this.setScale(gridStep);
        //this is a simple way to give the player a colour based on it's index, so each player should look a little different
        this.setTint(colour);
        this.playerMoveTimer=0;
        this.playerMoveTimer=Player.playerMoveTimerStep;
        //these are the keys with which you can move the player, by default the arrow keys
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.text = scene.add.text(this.x, this.y, 'p'+this.index, { fontSize: '20px', fill: '#fff'});
        this.centreText();
        this.vehicleIndex = -1;
        //if this bool is true you can move, if false you will instead dump rubble - if able
        this.moveModeDumpModeBool=true;
    }

    //movement is like pokemon, you move one gridStep at a time
    update(delta) {
        if(this.playerMoveTimer>0)
        {
            this.playerMoveTimer-=delta;
        }
        else
        {
            let proposedPos;
            if (this.cursors.left.isDown&&this.playerMoveTimer<=0)
            {
                proposedPos = {x:this.x-gridStep,y:this.y};
            }
            if (this.cursors.right.isDown&&this.playerMoveTimer<=0)
            {
                proposedPos = {x:this.x+gridStep,y:this.y};
            }
            if (this.cursors.up.isDown&&this.playerMoveTimer<=0)
            {
                proposedPos = {x:this.x,y:this.y-gridStep};
            }
            if (this.cursors.down.isDown&&this.playerMoveTimer<=0)
            {
                proposedPos = {x:this.x,y:this.y+gridStep};
            }
            //use the justDown method instead of isDown, this will only trigger once per key press
            if (Phaser.Input.Keyboard.JustDown(this.cursors.space)&&this.playerMoveTimer<=0)
            {
                console.log("action");
                //toggle the this.moveModeDumpModeBool
                this.toggleMode();
            }
            if (Phaser.Input.Keyboard.JustDown(this.cursors.shift)&&this.playerMoveTimer<=0)
            {
                console.log("cancel");
                //if we are not already in a vehicle
                if(this.vehicleIndex==-1)
                {
                    let v = this.map.getVehicleIndex(Player.translatePosToMapPos({x:this.x,y:this.y}));
                    //if there is a vehicle in our tile
                    if(v!=-1)
                    {
                        //record which vehicle we are in
                        this.vehicleIndex=v;
                        //have the scene handle the player getting in the vehicle
                        this.scene.enterVehicle(this.index,this.vehicleIndex);
                    }
                }
                //if we are in a vehicle
                else
                {
                    this.setMoveMode(true);
                    this.scene.exitVehicle(this.vehicleIndex);
                    this.vehicleIndex=-1;
                    this.playerMoveTimer=Player.playerMoveTimerStep;
                }
            }
            if(proposedPos)
            {    
                //if we are in movement mode
                if(this.moveModeDumpModeBool)
                {
                    //if the proposed position is not outside the map
                    if(this.map.inBounds(Player.translatePosToMapPos(proposedPos)))
                    {
                        //if the proposed position does not already have a player on it, and if the player is either not in a vehicle or there is no vehicle in the proposed position...
                        if(this.map.getPlayerIndex(Player.translatePosToMapPos(proposedPos))==-1 && (this.map.getVehicleIndex(Player.translatePosToMapPos(proposedPos))==-1||this.vehicleIndex==-1))
                        {
                            //if the proposed position is a path - and not a wall or rubble
                            if(this.map.isPath(Player.translatePosToMapPos(proposedPos)))
                            {             
                                this.movePlayer(proposedPos);
                                this.playerMoveTimer=Player.playerMoveTimerStep;
                            }
                            //if the proposed position is not a path and this player is in vehicle and proposedPos is a wall, or rubble
                            else if(this.vehicleIndex>-1 && (this.map.isWall(Player.translatePosToMapPos(proposedPos)) || this.map.isRubble(Player.translatePosToMapPos(proposedPos) ) ) ) 
                            {
                                //get the scene to handle this:check if the vehicle is not carrying too much to drill the wall/ or pick up the rubble
                                if(this.scene.isVehicleRubbleCapacityFull(this.vehicleIndex)==false)
                                {
                                    //if the scene method returns false the vehicle must be able to carry more rubble and therefore can drill or pick up rubble, so reflect the change to the terrain in the map
                                    this.map.drillWall( Player.translatePosToMapPos(proposedPos));
                                    this.playerMoveTimer=Player.playerMoveTimerStep;
                                }
                                else
                                {
                                    this.scene.addPopup("Vehicle "+this.vehicleIndex+" Rubble capacity full",{x:this.x,y:this.y},2000);
                                }
                            }
                        }
                    }
                    else
                    {
                        console.log("player "+this.index+" cannot move as it is out of map bounds, proposed pos =");
                        console.log(proposedPos);
                        //the above message will be repeated a lot if you hold the direction key, i could prevent this by resetting the this.playerMovetimer to Player.playerMoveTimerStep, or maybe just a value above 0 so that bumping a wall does not delay your movement too much
                        this.playerMoveTimer = 40;
                    }
                }
                //if we are in dump mode
                else
                {
                    //if the proposed position does not contains a player and does not contain a vehicle
                    if(this.map.getPlayerIndex(Player.translatePosToMapPos(proposedPos))==-1&&this.map.getVehicleIndex(Player.translatePosToMapPos(proposedPos))==-1)
                    {
                        //get the scene to check if there is any rubble available to dump
                        if(this.scene.isVehicleRubbleCapacityEmpty(this.vehicleIndex)==false)
                        {
                            //if that returned false, there must be at least one rubble to dump, now reflect that change in the terrain in the map
                            this.map.dumpRubble(Player.translatePosToMapPos(proposedPos));
                            this.playerMoveTimer=Player.playerMoveTimerStep;
                        }
                        //if there is no rubble to dump, switch back to move mode
                        else
                        {
                            //this can be annoying depending on how fast the movement is 
                            this.setMoveMode(true);
                        }
                    }
                }
            }
        }
        
    }
    movePlayer(v)
    {
        //update the old position of the player in the map
        this.map.setPlayer(Player.translatePosToMapPos({x:this.x,y:this.y}),-1);
        this.x=v.x;
        this.y=v.y;
        this.centreText();
        //update the new position of the player in the map
        this.map.setPlayer(Player.translatePosToMapPos(v),this.index);
        //if the player is in a vehicle  we get the scene to handle the vehicle moving
        if(this.vehicleIndex!=-1)
        {
            this.scene.updateVehicle(this.vehicleIndex,v);
        }
    }
    toggleMode()
    {
        //if you are in a vehicle
        if(this.vehicleIndex>-1)
        {
            this.moveModeDumpModeBool = ! this.moveModeDumpModeBool;
            if(this.scene.rubbleEmpty(this.vehicleIndex))
            {
                this.scene.addPopup("Vehicle "+this.vehicleIndex+ " No rubble to dump",{x:this.x,y:this.y},2000);
            }
            else
            {
                this.scene.addPopup("Vehicle "+this.vehicleIndex+ (this.moveModeDumpModeBool==true?" Move mode":" Dump mode"),{x:this.x,y:this.y},2000);
            }
        }
    }
    setMoveMode(b)
    {
        this.moveModeDumpModeBool=b;
        this.scene.addPopup("Vehicle "+this.vehicleIndex+ (this.moveModeDumpModeBool==true?" Move mode":" Dump mode"),{x:this.x,y:this.y},2000);
    }
    centreText()
    {
        this.text.setPosition(this.x-this.text.width/2,this.y-this.text.height/2);
    }
    updateText(newText)
    {
        this.text.setText(newText);
        this.centreText();
    }
    //the player may be at position 100,50 or something on the screen, but that could be position 0,0 on the map, if it moves right one place it would be 100+gridstep, but on the map that would just be 1,0, so i need to translate it 
    static translatePosToMapPos(v)
    {
        return {x:(v.x-mapOffSetX)/gridStep,y:(v.y-mapOffSetY)/gridStep};
    }
    //you can set up user defined key bindings for any new player, this will set those specified keys
    updateCursors(l,r,u,d,s,sh)
    {
        this.cursors.left=l;
        this.cursors.right=r;
        this.cursors.up=u;
        this.cursors.down=d;
        this.cursors.space=s;
        this.cursors.shift=sh;
    }
}
