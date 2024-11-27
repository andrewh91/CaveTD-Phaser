
export default class Player extends Phaser.GameObjects.Sprite {
    
        static playerMoveTimerStep=25;
        constructor(scene, x, y, texture,gridStep,index) {
        super(scene, x, y, texture);
        
        scene.add.existing(this);
        this.index=index;
        this.setScale(gridStep);
        this.setTint(0xffffff/33*(this.index+1));
        this.playerMoveTimer=0;
        this.playerMoveTimer=Player.playerMoveTimerStep;
        this.gridStep=gridStep;
        this.cursors = scene.input.keyboard.createCursorKeys();
    }

    update(delta) {
        if(this.playerMoveTimer>0)
        {
            this.playerMoveTimer-=delta;
        }
        if (this.cursors.left.isDown&&this.playerMoveTimer<=0)
        {
            this.x-=this.gridStep;
            this.playerMoveTimer=Player.playerMoveTimerStep;
        }
        if (this.cursors.right.isDown&&this.playerMoveTimer<=0)
        {
            this.x+=this.gridStep;
            this.playerMoveTimer=Player.playerMoveTimerStep;
        }
        if (this.cursors.up.isDown&&this.playerMoveTimer<=0)
        {
            this.y-=this.gridStep;
            this.playerMoveTimer=Player.playerMoveTimerStep;
        }
        if (this.cursors.down.isDown&&this.playerMoveTimer<=0)
        {
            this.y+=this.gridStep;
            this.playerMoveTimer=Player.playerMoveTimerStep;
        }
    }
    updateCursors(l,r,u,d)
    {
        this.cursors.left=l;
        this.cursors.right=r;
        this.cursors.up=u;
        this.cursors.down=d;
    }
}
