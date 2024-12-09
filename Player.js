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
    }

    //movement is like pokemon, you move one gridStep at a time
    update(delta) {
        if(this.playerMoveTimer>0)
        {
            this.playerMoveTimer-=delta;
        }
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
        if(proposedPos)
        {    
            if(this.map.inBounds(this.translatePosToMapPos(proposedPos)))
            {
                if(this.map.isWall(this.translatePosToMapPos(proposedPos)))
                {
                    //if the proposed location is a wall, do nothing
                }
                else
                {                
                    this.x=proposedPos.x;
                    this.y=proposedPos.y;
                    this.playerMoveTimer=Player.playerMoveTimerStep;
                }
            }
            else
            {
                console.log("player "+this.index+" cannot move as it is out of map bounds, proposed pos =");
                console.log(proposedPos);
            }
        }
        
        
    }
    //the player may be at position 100,50 or something on the screen, but that could be position 0,0 on the map, if it moves right one place it would be 100+gridstep, but on the map that would just be 1,0, so i need to translate it 
    translatePosToMapPos(v)
    {
        return {x:(v.x-mapOffSetX)/gridStep,y:(v.y-mapOffSetY)/gridStep};
    }
    //you can set up user defined key bindings for any new player, this will set those specified keys
    updateCursors(l,r,u,d)
    {
        this.cursors.left=l;
        this.cursors.right=r;
        this.cursors.up=u;
        this.cursors.down=d;
    }
}
