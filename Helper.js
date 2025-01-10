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
}