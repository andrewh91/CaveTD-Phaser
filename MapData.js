export default class MapData
{
    constructor()
    {
        this.tiles=[];
        this.terrainColours=[];     
        //also create colours associated with those terrains
        this.terrainColours[emptyTerrain]=0xaaaaaa;//light grey
        this.terrainColours[wallTerrain]=0x555555;//dark grey
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
        return this.tiles[this.getIndexFromCoords(v)].terrain==wallTerrain;
    }
    inBounds(v)
    {
        return (v.x>=0&&v.x<mapWidth  && v.y>=0&&v.y<mapHeight);
    }
}