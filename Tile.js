import Helper from './Helper.js';
export default class Tile extends Phaser.GameObjects.Sprite {
    constructor(scene,mapData, texture,index,colour,terrain) {
    super(scene,  mapOffSetX+gridStep*(index%mapWidth), mapOffSetY+gridStep*Math.floor(index/mapWidth), texture);
    
    scene.add.existing(this);
    this.mapData = mapData;
    //the tx is a more useful way of figuring out where the player is in the world, this.x is the world coord, but this is a grid based game, and the player could be at position (60,10) in order to figure out where the player is you would need to know what the gridstep is, and that the grid does not start at 0,0, it has an offset, so (60,10) could be (2,0) tile position if the gridstep is 25 and the offset is (10,10)
    this.tx=(this.x-mapOffSetX)/gridStep;
    this.ty=(this.y-mapOffSetY)/gridStep;
    this.index=index;
    //terrain will be 0 for path 1 for rubble and 2 or higher for walls
    this.terrain=terrain;
    //playerIndex will be -1 if there is no player there or it will be the player's index number
    this.playerIndex=-1;
    this.vehicleIndex=-1;
    this.creatureIndex=-1;
    //i want 4 values for contested
    this.contestedFromNorth=false;
    this.contestedFromSouth=false;
    this.contestedFromEast=false;
    this.contestedFromWest=false;
    //these are used by the explorer pathfinding
    this.exploredNumber=-1;
    this.warningMarker=-1;
    this.strengthMarker=-1;
    this.resourceMarker=-1;
    this.garrisonMarker=-1;
    //gridstep is a global variable
    this.setScale(gridStep);
    this.setTint(colour);
    this.resourceIndex=-1;
    this.bloodStain=-1;
    this.creatureBaseIndex=-1;
    this.text = scene.add.text(this.x, this.y, '', { fontSize: '10px', fill: '#fff'});
    Helper.centreText(this);

    /*20251101 indicators of the various markers and trails */
    //add a sprite so i can see where the proposed pos is 
    this.bloodSprite = new Phaser.GameObjects.Sprite(scene,this.x,this.y,texture);
    scene.add.existing(this.bloodSprite);
    this.bloodSprite.setTint(0xff0000);
    this.bloodSprite.setAlpha(0.2);
    this.bloodSprite.setScale(gridStep);
    this.bloodSprite.visible=false;
    /* 20251101 for the warning marker strength marker and resource marker i want draw a line of colour red green or blue respectively, for each one i can draw up to 4 lines, going to the adjacent tiles */
    /*one for warning, one for strength, one for resource -  if we want to add a new line for something else, then increment this up to 4*/
    let numberOfTypesOfLines = 3;
    /* so that the lines don't overlap*/
    let lineOffset = gridStep/(numberOfTypesOfLines+2);
    let lineCount=0;
    
    lineCount++;
    this.warningLine = [];
    for(let i = 0 ; i < 4; i ++)
    {
        this.warningLine.push(new Phaser.GameObjects.Line(scene,
            this.x-gridStep/2+lineOffset*lineCount,this.y-gridStep/2+lineOffset*lineCount,
            0,0,
            0,0,  
            0xff0000,1));
            /*weirdly the line origin defaults to 0.5, set it to 0 */
        this.warningLine[this.warningLine.length-1].setOrigin(0);
        scene.add.existing(this.warningLine[this.warningLine.length-1]);
    }
    lineCount++;
    this.resourceLine = [];
    for(let i = 0 ; i < 4; i ++)
    {
        this.resourceLine.push(new Phaser.GameObjects.Line(scene,
            this.x-gridStep/2+lineOffset*lineCount,this.y-gridStep/2+lineOffset*lineCount,
            0,0,
            0,0,  
            0x0000ff,1));
            /*weirdly the line origin defaults to 0.5, set it to 0 */
        this.resourceLine[this.resourceLine.length-1].setOrigin(0);
        scene.add.existing(this.resourceLine[this.resourceLine.length-1]);
    }
    lineCount++;
    this.strengthLine = [];
    for(let i = 0 ; i < 4; i ++)
    {
        this.strengthLine.push(new Phaser.GameObjects.Line(scene,
            this.x-gridStep/2+lineOffset*lineCount,this.y-gridStep/2+lineOffset*lineCount,
            0,0,
            0,0,  
            0x00ff00,1));
            /*weirdly the line origin defaults to 0.5, set it to 0 */
        this.strengthLine[this.strengthLine.length-1].setOrigin(0);
        scene.add.existing(this.strengthLine[this.strengthLine.length-1]);
    }
    
    
    }
    updateText(t)
    {
        this.text.setText(t);
        Helper.centreText(this);
    }
    updateBlood()
    {
        if(this.bloodStain>-1)
        {
            this.bloodSprite.visible=true;
        }
        else
        {
            this.bloodSprite.visible=false;          
        }
    }
    /* 20251101 when the tile's strength or resource marker is altered, we should update the lines, and then do the same for the neighbours*/
    updateLines(recursive)
    {
        /*20251101 for each neighbour, check if it has a warning, strength or resource marker, if so draw a line to that tile*/
        let neighbours = this.getNeighbours({tx:this.tx,ty:this.ty});
        let neighbourPosHelper = this.getNeighbourPosHelper();
        /* i want to repeat this code for all the warning, strength and resource markers, so a handy way to do that is to assign those to an array and we can just go through them all. */
        let tempLinesArray = [];
        tempLinesArray.push(this.warningLine);
        tempLinesArray.push(this.strengthLine);
        tempLinesArray.push(this.resourceLine);
        /* it works a bit different for the method, because i use 'this' it wont know what this is, so we need to use this bind method to tell it what this is. so if i add a new line i need to add it to the tempLinesArray and add the corresponding method to the tempMethodArray*/
        let tempMethodArray = [];
        tempMethodArray.push(this.mapData.getWarningMarker.bind(this.mapData));
        tempMethodArray.push(this.mapData.getStrengthMarker.bind(this.mapData));
        tempMethodArray.push(this.mapData.getResourceMarker.bind(this.mapData));
        for(let j = 0 ; j < tempLinesArray.length;j++)
        {
            for(let i = 0 ; i < neighbours.length;i++)
            {
                if(tempMethodArray[j](neighbours[i])>-1)
                {
                    tempLinesArray[j][i].geom.x2 = neighbourPosHelper[i].x;
                    tempLinesArray[j][i].geom.y2 = neighbourPosHelper[i].y;
                    /* also update the lines of that neighbouring tile, but set recursive to false so that the method does update all of that tile's neighbours as well */
                    if(recursive)
                    {
                        this.mapData.tiles[this.mapData.getIndexFromCoords(neighbours[i])].updateLines(false);
                    }
                }
                else
                {
                    tempLinesArray[j][i].geom.x2 = 0;
                    tempLinesArray[j][i].geom.y2 = 0;
                }
            }
        }
    }
    getNeighbours(v)
    {
        let a =[];
        a.push({tx:v.tx+ 0,ty:v.ty+-1});//north
        a.push({tx:v.tx+ 1,ty:v.ty+ 0});//east
        a.push({tx:v.tx+ 0,ty:v.ty+ 1});//south
        a.push({tx:v.tx+-1,ty:v.ty+ 0});//west
        return a;
    }
    getNeighbourPosHelper()
    {
        let a = [];
        a.push({x:gridStep*+0,y:gridStep*-1});//north
        a.push({x:gridStep*+1,y:gridStep*+0});//east
        a.push({x:gridStep*+0,y:gridStep*+1});//south
        a.push({x:gridStep*-1,y:gridStep*+0});//west
        return a;
    }
}
