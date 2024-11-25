
export default class Player extends Phaser.GameObjects.Sprite {
    
        static playerMoveTimerStep=500;
        constructor(scene, x, y, texture,gridStep,index,colour) {
        super(scene, x, y, texture);
        
        scene.add.existing(this);
        this.index=index;
        this.setScale(gridStep);
        this.setTint(16711680);
        this.playerMoveTimer=0;
        this.playerMoveTimer=Player.playerMoveTimerStep;
        this.gridStep=gridStep;
    }

    update(cursors,delta) {
        if(this.playerMoveTimer>0)
        {
            this.playerMoveTimer-=delta;
        }
        if (cursors.left.isDown&&this.playerMoveTimer<=0)
        {
            this.x-=this.gridStep;
            this.playerMoveTimer=Player.playerMoveTimerStep;
        }
        if (cursors.right.isDown&&this.playerMoveTimer<=0)
        {
            this.x+=this.gridStep;
            this.playerMoveTimer=Player.playerMoveTimerStep;
        }
        if (cursors.up.isDown&&this.playerMoveTimer<=0)
        {
            this.y-=this.gridStep;
            this.playerMoveTimer=Player.playerMoveTimerStep;
        }
        if (cursors.down.isDown&&this.playerMoveTimer<=0)
        {
            this.y+=this.gridStep;
            this.playerMoveTimer=Player.playerMoveTimerStep;
        }
    }
}
