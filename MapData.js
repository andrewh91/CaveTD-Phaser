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
        return v.x+v.y*mapWidth;
    }
    setTerrain(v,t)
    {
        //this can be out of bounds
        if(v.x>=0&&v.x<mapWidth && v.y>=0 && v.y <mapHeight)
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
            console.log('mapSetTerrain failed , x and y is out of bounds, x: ' + v.x + ' y: '+v.y)
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
        if(v.x>=0&&v.x<mapWidth && v.y>=0 && v.y <mapHeight)
        {
            currentValue = this.tiles[this.getIndexFromCoords(v)].terrain ;
            this.setTerrain(v,currentValue-1);
        }
        else
        {
            console.log('drillWall failed , x and y is out of bounds, x: ' + v.x + ' y: '+v.y)
        }
    }
    dumpRubble(v)
    {
        let currentValue;
        //this can be out of bounds
        if(v.x>=0&&v.x<mapWidth && v.y>=0 && v.y <mapHeight)
        {
            currentValue = this.tiles[this.getIndexFromCoords(v)].terrain ;
            this.setTerrain(v,currentValue+1);
        }
        else
        {
            console.log('dumpRubble failed , x and y is out of bounds, x: ' + v.x + ' y: '+v.y)
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
    getResourceIndex(v)
    {
        return this.tiles[this.getIndexFromCoords(v)].resourceIndex;
    }
    getResourceMarker(v)
    {
        return this.tiles[this.getIndexFromCoords(v)].resourceMarker;
    }
    //return false if contested by our direction, or no direction, returns true if not contested by our direction and is contested by another direction  
    isContestedExcluding(v,dir)
    {
        switch(dir)
        {
            //if we are going north...
            case NORTH:
                //...and the proposed position is already contested by north...
                if(this.getContestedNorth(v))
                {
                    //...then return false, and we can move there
                    return false;
                }
                else if(this.getContestedEast(v)||this.getContestedSouth(v)||this.getContestedWest(v))
                {
                    //else  if it's contested by another direction, return true so that we do not move there
                    return true;
                }
                break;
            case SOUTH:
                if(this.getContestedSouth(v))
                {
                    return false;
                }
                else if (this.getContestedNorth(v)||this.getContestedEast(v)||this.getContestedWest(v))
                {
                    return true;
                }
                break;
            case EAST:
                if(this.getContestedEast(v))
                {
                    return false;
                }
                else if (this.getContestedNorth(v)||this.getContestedSouth(v)||this.getContestedWest(v))
                {
                    return true;
                }
                break;
            case WEST:
                if(this.getContestedWest(v))
                {
                    return false;
                }
                else if (this.getContestedNorth(v)||this.getContestedEast(v)||this.getContestedSouth(v))
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
            return this.getContestedSouth(v);
        }
        else if(dir==SOUTH)
        {
            return this.getContestedNorth(v);
        }
        else if(dir==EAST)
        {
            return this.getContestedWest(v);
        }
        else if(dir==WEST)
        {
            return this.getContestedEast(v);
        }
        else
        {
            //if the dir is not one of these 4, it must be STATIONARY, there is no opposite direction to STATIONARY so return false
            return false;
        }
    }
    getContestedNorth(v)
    {
        return this.tiles[this.getIndexFromCoords(v)].contestedNorth;
    }
    getContestedSouth(v)
    {
        return this.tiles[this.getIndexFromCoords(v)].contestedSouth;
    }
    getContestedWest(v)
    {
        return this.tiles[this.getIndexFromCoords(v)].contestedWest;
    }
    getContestedEast(v)
    {
        return this.tiles[this.getIndexFromCoords(v)].contestedEast;
    }
    setContested(v,dir)
    {
        if(dir==SOUTH)
        {
            this.setContestedSouth(v);
        }
        else if(dir==NORTH)
        {
            this.setContestedNorth(v);
        }
        else if(dir==WEST)
        {
            this.setContestedWest(v);
        }
        else if(dir==EAST)
        {
            this.setContestedEast(v);
        }
    }
    setContestedNorth(v)
    {
        this.tiles[this.getIndexFromCoords(v)].contestedNorth=true;
    }
    setContestedSouth(v)
    {
        this.tiles[this.getIndexFromCoords(v)].contestedSouth=true;
    }
    setContestedWest(v)
    {
        this.tiles[this.getIndexFromCoords(v)].contestedWest=true;
    }
    setContestedEast(v)
    {
        this.tiles[this.getIndexFromCoords(v)].contestedEast=true;
    }
    setResourceMarker(v,b)
    {
        this.tiles[this.getIndexFromCoords(v)].resourceMarker=b;
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
        this.tiles[this.getIndexFromCoords(v)].contestedNorth=false;
        this.tiles[this.getIndexFromCoords(v)].contestedSouth=false;
        this.tiles[this.getIndexFromCoords(v)].contestedEast=false;
        this.tiles[this.getIndexFromCoords(v)].contestedWest=false;
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
    getTerrain(v)
    {
        //path is exactly 0
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
        return (v.x>=0&&v.x<mapWidth  && v.y>=0&&v.y<mapHeight);
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