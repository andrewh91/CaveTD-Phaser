export default class Player extends Phaser.GameObjects.Sprite {
    
        //this many milliseconds must pass before the player is allowed to make a move
        static playerMoveTimerStep=25;
        constructor(scene, x, y, texture,index) {
        super(scene, x, y, texture);
        
        scene.add.existing(this);
        this.index=index;
        //i've made the player image be the same size as the value it can move in one go 
        this.setScale(gridStep);
        //this is a simple way to give the player a colour based on it's index, so each player should look a little different
        this.setTint(0xffffff/33*(this.index+1));
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
        if (this.cursors.left.isDown&&this.playerMoveTimer<=0)
        {
            this.x-=gridStep;
            this.playerMoveTimer=Player.playerMoveTimerStep;
        }
        if (this.cursors.right.isDown&&this.playerMoveTimer<=0)
        {
            this.x+=gridStep;
            this.playerMoveTimer=Player.playerMoveTimerStep;
        }
        if (this.cursors.up.isDown&&this.playerMoveTimer<=0)
        {
            this.y-=gridStep;
            this.playerMoveTimer=Player.playerMoveTimerStep;
        }
        if (this.cursors.down.isDown&&this.playerMoveTimer<=0)
        {
            this.y+=gridStep;
            this.playerMoveTimer=Player.playerMoveTimerStep;
        }
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
