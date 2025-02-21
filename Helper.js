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
        let x = (v.x-mapOffSetX)/gridStep;
        let y = (v.y-mapOffSetY)/gridStep;
        if((x>=0&&x<mapWidth  && y>=0&&y<mapHeight))
        {
            return {x:x,y:y};
        }
        else 
        {
            console.log("out of bounds x:"+x+" y:"+y);
            return false;
        }
    }
    static dist(v1,v2)
    {
        let a = v1.x-v2.x;
        let b = v1.y-v2.y;
        return a*a + b*b;
    }
    static vectorEquals(v1,v2)
    {
        if(v1!=undefined&&v2!=undefined&&v1.x==v2.x&&v1.y==v2.y)
        {
            return true;
        }
        else 
        {
            return false
        }
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
}