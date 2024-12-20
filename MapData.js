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
            this.tiles[this.getIndexFromCoords(v)].setTint(this.terrainColours[t]);
            this.tiles[this.getIndexFromCoords(v)].terrain = t;
        }
        else
        {
            console.log('mapSetTerrain failed , x and y is out of bounds, x: ' + v.x + ' y: '+v.y)
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
            this.tiles[this.getIndexFromCoords(v)].terrain = currentValue-1;
            this.tiles[this.getIndexFromCoords(v)].setTint(this.terrainColours[currentValue-1]);
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
            this.tiles[this.getIndexFromCoords(v)].terrain = currentValue+1;
            this.tiles[this.getIndexFromCoords(v)].setTint(this.terrainColours[currentValue+1]);
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
    getPlayerIndex(v)
    {
        return this.tiles[this.getIndexFromCoords(v)].playerIndex;
    }
    getVehicleIndex(v)
    {
        return this.tiles[this.getIndexFromCoords(v)].vehicleIndex;
    }
    isWall(v)
    {
        //path is 0, rubble is 1, a wall is 2 or more
        return this.tiles[this.getIndexFromCoords(v)].terrain>=wallTerrain;
    }
    isRubble(v)
    {
        //rubble is exactly 1
        return this.tiles[this.getIndexFromCoords(v)].terrain==rubbleTerrain;
    }
    isPath(v)
    {
        //path is exactly 0
        return this.tiles[this.getIndexFromCoords(v)].terrain==pathTerrain;
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
    print(dataType = "playerIndex")
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
        console.log(text);
        console.log("uses dynamic property access, try print('vehicleIndex')");
    }
}