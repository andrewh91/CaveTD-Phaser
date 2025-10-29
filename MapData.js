import Helper from './Helper.js';
export default class MapData
{
    constructor()
    {
        this.tiles=[];
        this.terrainColours=[];     
        //also create colours associated with those terrains
        this.terrainColours[pathTerrain]=0xcccccc;//light grey
        this.terrainColours[rubbleTerrain]=0x777777;//medium grey
        this.terrainColours[wallTerrain]=0x333333;//dark grey
        this.terrainColours[impassableTerrain]=0x111111;//black
    }
    getIndexFromCoords(v)
    {
        return v.tx+v.ty*mapWidth;
    }
    setTerrain(v,t)
    {
        //this can be out of bounds
        if(v.tx>=0&&v.tx<mapWidth && v.ty>=0 && v.ty <mapHeight)
        {
            //you can add more rubble to the wall to give it more 'health', but currently the colour will only go from light, medium and dark grey to black 
            this.tiles[this.getIndexFromCoords(v)].terrain = t;
            if(t>=this.terrainColours.length)
            {
                t=this.terrainColours.length-1;
            }
            this.tiles[this.getIndexFromCoords(v)].setTint(this.terrainColours[t]);
        }
        else
        {
            console.log('mapSetTerrain failed , tx and ty is out of bounds, x: ' + v.tx + ' y: '+v.ty)
        }
    }
    setExploredNumber(v,n)
    {
        this.tiles[this.getIndexFromCoords(v)].exploredNumber = n;
        this.tiles[this.getIndexFromCoords(v)].updateText('E'+('00'+n).slice(-2));
    }
    getExploredNumber(v)
    {
        return this.tiles[this.getIndexFromCoords(v)].exploredNumber;
    }
    setBloodStain(v,n)
    {
        this.tiles[this.getIndexFromCoords(v)].bloodStain = n;
    }
    getBloodStain(v)
    {
        return this.tiles[this.getIndexFromCoords(v)].bloodStain;
    }
    setWarningMarker(v,n)
    {
        this.tiles[this.getIndexFromCoords(v)].warningMarker = n;
    }
    getWarningMarker(v)
    {
        return this.tiles[this.getIndexFromCoords(v)].warningMarker;
    }
    setStrengthMarker(v,n)
    {
        this.tiles[this.getIndexFromCoords(v)].strengthMarker = n;
    }
    getStrengthMarker(v)
    {
        return this.tiles[this.getIndexFromCoords(v)].strengthMarker;
    }
    setGarrisonMarker(v,n)
    {
        this.tiles[this.getIndexFromCoords(v)].garrisonMarker = n;
    }
    getGarrisonMarker(v)
    {
        return this.tiles[this.getIndexFromCoords(v)].garrisonMarker;
    }
    
    //when i build a map from a text file, i don't want to use the setTerrain method, as that requires a map coord, i just want to use the index
    setTerrainByIndex(a)
    {
        for(let i = 0 ; i < a.length ; i ++)
        {
            this.tiles[i].terrain=parseInt(a[i]);
            this.tiles[i].setTint(this.terrainColours[parseInt(a[i])]);
        }
        //ensure that the edges are all impenetrable walls 
        //top edge
        for(let i = 0 ; i < mapWidth ; i ++)
        {
            this.tiles[i].terrain=impassableTerrain;
            this.tiles[i].setTint(this.terrainColours[impassableTerrain]);
        }
        //bottom edge
        for(let i = 0 ; i < mapWidth ; i ++)
        {
            this.tiles[mapWidth*(mapHeight-1)+i].terrain=impassableTerrain;
            this.tiles[mapWidth*(mapHeight-1)+i].setTint(this.terrainColours[impassableTerrain]);
        }
        //left edge
        for(let i = 0 ; i < mapHeight ; i ++)
        {
            this.tiles[i*mapWidth].terrain=impassableTerrain;
            this.tiles[i*mapWidth].setTint(this.terrainColours[impassableTerrain]);
        }
        //right edge
        for(let i = 0 ; i < mapHeight ; i ++)
        {
            this.tiles[i*mapWidth+(mapWidth-1)].terrain=impassableTerrain;
            this.tiles[i*mapWidth+(mapWidth-1)].setTint(this.terrainColours[impassableTerrain]);
        }
    }
    //a wall is value 2 or higher, drilling a wall means reducing that value, if it reduces to 1 then it will become rubble
    drillWall(v)
    {
        let currentValue;
        //this can be out of bounds
        if(v.tx>=0&&v.tx<mapWidth && v.ty>=0 && v.ty <mapHeight)
        {
            currentValue = this.tiles[this.getIndexFromCoords(v)].terrain ;
            this.setTerrain(v,currentValue-1);
        }
        else
        {
            console.log('drillWall failed , x and y is out of bounds, tx: ' + v.tx + ' ty: '+v.ty)
        }
    }
    dumpRubble(v)
    {
        let currentValue;
        //this can be out of bounds
        if(v.tx>=0&&v.tx<mapWidth && v.ty>=0 && v.ty <mapHeight)
        {
            currentValue = this.tiles[this.getIndexFromCoords(v)].terrain ;
            this.setTerrain(v,currentValue+1);
        }
        else
        {
            console.log('dumpRubble failed , tx and ty is out of bounds, tx: ' + v.tx + ' ty: '+v.ty)
        }
    }
    setPlayer(v,index)
    {
        this.tiles[this.getIndexFromCoords(v)].playerIndex = index;
    }
    setVehicle(v,index)
    {
        this.tiles[this.getIndexFromCoords(v)].vehicleIndex = index;
    }
    setCreature(c,index)
    {
        this.tiles[this.getIndexFromCoords(c)].creatureIndex = index;
    }
    getPlayerIndex(v)
    {
        return this.tiles[this.getIndexFromCoords(v)].playerIndex;
    }
    getVehicleIndex(v)
    {
        return this.tiles[this.getIndexFromCoords(v)].vehicleIndex;
    }
    getCreatureIndex(v)
    {
        return this.tiles[this.getIndexFromCoords(v)].creatureIndex;
    }
    getCreatureBaseIndex(v)
    {
        return this.tiles[this.getIndexFromCoords(v)].creatureBaseIndex;
    }
    getResourceIndex(v)
    {
        return this.tiles[this.getIndexFromCoords(v)].resourceIndex;
    }
    getResourceMarker(v)
    {
        return this.tiles[this.getIndexFromCoords(v)].resourceMarker;
    }
    //return false if contested by our direction, or no direction, returns true if not contested by our direction and is contested by another direction  
    isContestedFromExcluding(v,dir)
    {
        switch(dir)
        {
            //if we are going north...
            case NORTH:
                //...and the proposed position is already contested by north...
                if(this.getContestedFromNorth(v))
                {
                    //...then return false, and we can move there
                    return false;
                }
                else if(this.getContestedFromEast(v)||this.getContestedFromSouth(v)||this.getContestedFromWest(v))
                {
                    //else  if it's contested by another direction, return true so that we do not move there
                    return true;
                }
                break;
            case SOUTH:
                if(this.getContestedFromSouth(v))
                {
                    return false;
                }
                else if (this.getContestedFromNorth(v)||this.getContestedFromEast(v)||this.getContestedFromWest(v))
                {
                    return true;
                }
                break;
            case EAST:
                if(this.getContestedFromEast(v))
                {
                    return false;
                }
                else if (this.getContestedFromNorth(v)||this.getContestedFromSouth(v)||this.getContestedFromWest(v))
                {
                    return true;
                }
                break;
            case WEST:
                if(this.getContestedFromWest(v))
                {
                    return false;
                }
                else if (this.getContestedFromNorth(v)||this.getContestedFromEast(v)||this.getContestedFromSouth(v))
                {
                    return true;
                }
                break;
            default:
                return false;
        }
    }
    //we take the map coord and the direction a creature is intending to travel into that map coord from, this will return true if that coord is already contested from the opposite direction and false otherwise
    isContestedFromOpposite(v,dir)
    {
        if(dir==NORTH)
        {
            return this.getContestedFromSouth(v);
        }
        else if(dir==SOUTH)
        {
            return this.getContestedFromNorth(v);
        }
        else if(dir==EAST)
        {
            return this.getContestedFromWest(v);
        }
        else if(dir==WEST)
        {
            return this.getContestedFromEast(v);
        }
        else
        {
            //if the dir is not one of these 4, it must be STATIONARY, there is no opposite direction to STATIONARY so return false
            return false;
        }
    }
    //v is the map coord, it should be the proposedPos. dir is the proposed direction of the creature. so logically if the proposed direction is north we must be coming from the south. this method will return if the proposedPos is contested from a creature FROM the opposite direction to what we are travelling, so if we are travelling north, we want to see if the proposedPos is contested from the north - as that will be a creature with a proposed direction that is south 
    isContestedFrom(v,dir)
    {
        if(dir==NORTH)
        {
            return this.getContestedFromNorth(v);
        }
        else if(dir==SOUTH)
        {
            return this.getContestedFromSouth(v);
        }
        else if(dir==EAST)
        {
            return this.getContestedFromEast(v);
        }
        else if(dir==WEST)
        {
            return this.getContestedFromWest(v);
        }
        else
        {
            //if the dir is not one of these 4, it must be STATIONARY
            return false;
        }
    }
    getContestedFromNorth(v)
    {
        return this.tiles[this.getIndexFromCoords(v)].contestedFromNorth;
    }
    getContestedFromSouth(v)
    {
        return this.tiles[this.getIndexFromCoords(v)].contestedFromSouth;
    }
    getContestedFromWest(v)
    {
        return this.tiles[this.getIndexFromCoords(v)].contestedFromWest;
    }
    getContestedFromEast(v)
    {
        return this.tiles[this.getIndexFromCoords(v)].contestedFromEast;
    }
    setContestedFrom(v,dir)
    {
        if(dir==SOUTH)
        {
            this.setContestedFromSouth(v);
        }
        else if(dir==NORTH)
        {
            this.setContestedFromNorth(v);
        }
        else if(dir==WEST)
        {
            this.setContestedFromWest(v);
        }
        else if(dir==EAST)
        {
            this.setContestedFromEast(v);
        }
    }
    setContestedFromNorth(v)
    {
        this.tiles[this.getIndexFromCoords(v)].contestedFromNorth=true;
    }
    setContestedFromSouth(v)
    {
        this.tiles[this.getIndexFromCoords(v)].contestedFromSouth=true;
    }
    setContestedFromWest(v)
    {
        this.tiles[this.getIndexFromCoords(v)].contestedFromWest=true;
    }
    setContestedFromEast(v)
    {
        this.tiles[this.getIndexFromCoords(v)].contestedFromEast=true;
    }
    //example, a creature wants to travel south but cannot, so it set that proposed location to the south of it to have a flag saying that tile is contested from the north. when that creature moves to this proposed tile, or is killed, or no longer proposes to move to this tile then we call this method. so we delete the opposite flag to what it wanted to travel - it wanted to travel south so the flag said it is contested from a creature COMING FROM THE NORTH, so delete the north flag
    //  we should use the opposite direction here, for example, our proposedDirection was south - we wanted to move south, we couldn't so we set the proposedPos flag to say it was contested from the NORTH- as it was contested by a creature that came from the north travelling south , when we eventually travel to the proposedPos then we want to delete the NORTH flag
    clearContestedDirection(v,dir)
    {
        if(dir==SOUTH)
        {
            this.clearcontestedFromNorth(v);
        }
        else if(dir==NORTH)
        {
            this.clearcontestedFromSouth(v);
        }
        else if(dir==WEST)
        {
            this.clearcontestedFromEast(v);
        }
        else if(dir==EAST)
        {
            this.clearcontestedFromWest(v);
        }
    }
    clearcontestedFromNorth(v)
    {
        this.tiles[this.getIndexFromCoords(v)].contestedFromNorth=false;
    }
    clearcontestedFromSouth(v)
    {
        this.tiles[this.getIndexFromCoords(v)].contestedFromSouth=false;
    }
    clearcontestedFromWest(v)
    {
        this.tiles[this.getIndexFromCoords(v)].contestedFromWest=false;
    }
    clearcontestedFromEast(v)
    {
        this.tiles[this.getIndexFromCoords(v)].contestedFromEast=false;
    }
    setResourceMarker(v,i)
    {
        this.tiles[this.getIndexFromCoords(v)].resourceMarker=i;
        
        this.tiles[this.getIndexFromCoords(v)].updateText('R'+('00'+i).slice(-2));
    }
    setResourceIndex(v,n)
    {
        this.tiles[this.getIndexFromCoords(v)].resourceIndex=n;
    }
    setCreatureBaseIndex(v,c)
    {
        this.tiles[this.getIndexFromCoords(v)].creatureBaseIndex=c;
    }
    clearContested(v)
    {        
        this.tiles[this.getIndexFromCoords(v)].contestedFromNorth=false;
        this.tiles[this.getIndexFromCoords(v)].contestedFromSouth=false;
        this.tiles[this.getIndexFromCoords(v)].contestedFromEast=false;
        this.tiles[this.getIndexFromCoords(v)].contestedFromWest=false;
    }
    getContestedFrom(v)
    {        
        let r="";
        if(this.tiles[this.getIndexFromCoords(v)].contestedFromNorth==true)
        {
            r+= "contestedFromNorth=true";
        }
        if(this.tiles[this.getIndexFromCoords(v)].contestedFromSouth==true)
        {
            r+= "contestedFromSouth=true";
        }
        if(this.tiles[this.getIndexFromCoords(v)].contestedFromEast==true)
        {
            r+= "contestedFromEast=true";
        }
        if(this.tiles[this.getIndexFromCoords(v)].contestedFromWest==true)
        {
            r+= "contestedFromWest=true";
        }
        return r;
    }
    isWall(v)
    {
        //path is 0, rubble is 1, a wall is 2 or more
        if(this.tiles[this.getIndexFromCoords(v)]==undefined)
        {
            return false;
        }
        return this.tiles[this.getIndexFromCoords(v)].terrain==wallTerrain;
    }
    //if the v is at the edge of the screen - note that i force map data to have impassableTerrain at the edges in the setTerrainByIndex method
    isEdge(v)
    {
        //path is 0, rubble is 1, a wall is 2 , impassable wall is 3
        if(this.tiles[this.getIndexFromCoords(v)]==undefined)
        {
            return false;
        }
        return this.tiles[this.getIndexFromCoords(v)].terrain==impassableTerrain;
    }
    isRubble(v)
    {
        //rubble is exactly 1
        if(this.tiles[this.getIndexFromCoords(v)]==undefined)
        {
            return false;
        }
        return this.tiles[this.getIndexFromCoords(v)].terrain==rubbleTerrain;
    }
    isPath(v)
    {
        //path is exactly 0
        if(this.tiles[this.getIndexFromCoords(v)]==undefined)
        {
            return false;
        }
        return this.tiles[this.getIndexFromCoords(v)].terrain==pathTerrain;
    }
    //the player can only dump rubble on terrain like path or rubble, if it dumped on wall, then that wall value would become impassable terrain and i don't want that 
    isDumpable(v)
    {
        //path is exactly 0 or 1
        if(this.tiles[this.getIndexFromCoords(v)]==undefined)
        {
            return false;
        }
        return this.tiles[this.getIndexFromCoords(v)].terrain<wallTerrain;
    }
    getTerrain(v)
    {
        if(this.tiles[this.getIndexFromCoords(v)]==undefined)
        {
            return false;
        }
        return this.tiles[this.getIndexFromCoords(v)].terrain;
    }
    //this is for god mode only, add one to the terrain, then mod 3
    godModeIncrementTerrain(v)
    {
        let t = this.getTerrain(v);
        //there are 3 terrain types, 0 path, 1 rubble, and 2 terrain
        t = (t + 1) % 3;
        this.setTerrain(v,t);
    }
    inBounds(v)
    {
        return (v.tx>=0&&v.tx<mapWidth  && v.ty>=0&&v.ty<mapHeight);
    }
    //this is just a helper method to display a text version of the map data
    //this uses 'dynamic property access' and 'bracket notation' to allow the user to specify a new variable of mapData.tiles to display, 
    //for example you can type in the debug console : 
    //window.debug.mapData.print("vehicleIndex");
    //add that will print the tiles.[i].vehicleIndex instead of the default playerIndex variable
    //so basically if you have v = {x:0,y:5}; you can access that like v.x or v.y but with this you could use v["x"] or v["y"]
    print(dataType = "terrain")
    {
        let text="";
        for(let i = 0; i < this.tiles.length ; i++)
        {
            let n = ("0" + this.tiles[i][dataType]).slice (-2);
            text+=n+',';
            if(i%mapWidth==mapWidth-1)
            {
                text+='\n';
            }
        }
        //remove the final 2 characters which is ',\n' note that '\n' counts as one character, so the comma and the line break are removed
        text=text.slice(0,-2);
        console.log(text);
        console.log("uses dynamic property access, try print('vehicleIndex'); or print('playerIndex');");
        return text;
    }
    //this method will take a text representation of map data, such as the one generated by mapData.print('terrain'); and use that to generate a map
    loadFromText(text)
    {
        let lineArray=[];
        //there will be a line break on the end of each line, split on that
        lineArray=text.split(',\n');
        //now we know the mapWidth 
        let loadedMapWidth = lineArray[0].length;
        let tileArray=[];
        for( let i = 0 ; i < lineArray.length ; i ++ )
        {
            //this will add each tile to the tileArray
            tileArray=tileArray.concat(lineArray[i].split(','));
        }
        console.log(tileArray);
        this.setTerrainByIndex(tileArray);
    }
}