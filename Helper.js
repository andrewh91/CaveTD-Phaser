export default class Helper 
{    
    constructor()
    {

    }
    //pass in a creature object or player object
    static centreText(o)
    {
        o.text.setPosition(o.x-o.text.width/2,o.y-o.text.height/2);
    }
    //the player may be at position 100,50 or something on the screen, but that could be position 0,0 on the map, if it moves right one place it would be 100+gridstep, but on the map that would just be 1,0, so i need to translate it 
    static translatePosToMapPos(v)
    {
        let x = Math.floor((v.x-mapOffSetX)/gridStep);
        let y = Math.floor((v.y-mapOffSetY)/gridStep);
        if((x>=0&&x<mapWidth  && y>=0&&y<mapHeight))
        {
            return {tx:x,ty:y};
        }
        else 
        {
            console.log("out of bounds x:"+x+" y:"+y);
            return false;
        }
    }
    //i'm maintaining a tile pos and a world pos for the player and creatures and tiles etc, basically all the sprites, this converts the tx to the x - converts the tile pos to the world pos
    static translateTilePosToWorldPos(v)
    {
        return {x:v.tx*gridStep+mapOffSetX,y:v.ty*gridStep+mapOffSetY};
    }
    static dist(v1,v2)
    {
        let a = v1.tx-v2.tx;
        let b = v1.ty-v2.ty;
        return a*a + b*b;
    }
    static vectorEquals(v1,v2)
    {
        if(v1!=undefined&&v2!=undefined&&v1.tx==v2.tx&&v1.ty==v2.ty)
        {
            return true;
        }
        else 
        {
            return false
        }
    }
    static vectorPlus(v1,v2)
    {
        return {tx:v1.tx+v2.tx,ty:v1.ty+v2.ty};
    }
    static vectorMultiply(v1,v)
    {
        return {tx:v1.tx*v,ty:v1.ty*v};
    }
    //if you pass in a compass point vector like {0,1} or {-1,0} etc it will give you the next compass point vector going clockwise
    static getClockwiseDirection(v1)
    {
        let x = v1.tx;
        let y = v1.ty;
        //if the x value is 0
        if(x==0)
        {
            //then the x value become the inverse of the y value, so if y s 1 x wil now be -1
            x=-y;
            //then y become 0
            y=0;
        }
        //else y value must be 0
        else 
        {
            //then the y value become the x value, so if x is 1 y wil now be 1
            y=x;
            //then x become 0
            x=0;
        }
        return {tx:x,ty:y};
    }
    
    static getAntiClockwiseDirection(v1)
    {
        let x = v1.tx;
        let y = v1.ty;
        //if the x value is 0
        if(x==0)
        {
            //then the x value become the y value, so if y s 1 x wil now be 1
            x=y;
            //then y become 0
            y=0;
        }
        //else y value must be 0
        else 
        {
            //then the y value become the inverse of the x value, so if x is 1 y wil now be -1
            y=-x;
            //then x become 0
            x=0;
        }
        return {tx:x,ty:y};
    }
    static getOppositeDirection(v1)
    {
        return {tx:v1.tx*-1,ty:v1.ty*-1};
    }
    static incrementColour(i,d)
    {
        //this should give d^3 variety of numbers - or d^3-1 if you don't want black
        //if i == 0 then that would give colour black
        //we could plus 1 to avoid black being first, but that would just make it the last colour instead
        //so mod on the total number of colours
        i=i%(d*d*d-1);
        //then plus 1, now the incrementing colour will not be black
        i=i+1;
        return Math.floor((Math.floor((i/(d*d)))%d)*(256*256*256)/d +  (Math.floor((i/d)%d))*(256*256)/d +  (i%d)*(256)/d);
    }
    static reverseArray(a)
    {
        let b=[];
        for(let i = 0; i<a.length ; i++)
        {
            b.splice(0,0,a[i]);
        }
        return b;
    }
}