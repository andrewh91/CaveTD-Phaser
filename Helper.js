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
        return {x:(v.x-mapOffSetX)/gridStep,y:(v.y-mapOffSetY)/gridStep};
    }
    static dist(v1,v2)
    {
        let a = v1.x-v2.x;
        let b = v1.y-v2.y;
        return a*a + b*b;
    }
}