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
}