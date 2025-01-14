
export default class PriorityArray
{    
    constructor()
    {
        //there are 5 priority arrays, they will hold the index number of the creature that intends to travel in this direction
        this.north=[];
        this.south=[];
        this.east=[];
        this.west=[];
        this.stationary=[];
        //the order in which i loop through the arrays will change, therefore the priority of each array will change
        //the priority variable and all array will help achieve this 
        this.priority=0;
        this.all=[this.north,this.south,this.east,this.west,this.stationary];
        //I will need to clear the arrays every update but it's worth keeping the previous array
        this.oldNorth=[];
        this.oldSouth=[];
        this.oldEast=[];
        this.oldWest=[];
        this.oldStationary=[];
    }
    //this will increment the priority variable through numbers 0-4 and back to 0 again
    incrementPriority()
    {
        this.priority=(this.priority+1)%this.all.length;
        console.log('priority= '+this.priority);
    }
    //this will loop through all the arrays starting with the current priority array as defined by the priority variable
    loopThroughAll()
    {
        let p = this.priority;
        for( let i = 0 ; i < this.all.length ; i ++)
        {
            console.log(this.all[p]);
            p=(p+1)%this.all.length;
        }
    }
    //this should be called after the creatures are all moved
    clear()
    {
        //copy the values - not the reference - by using slice
        this.oldNorth       =this.north     .slice();
        this.oldSouth       =this.south     .slice();
        this.oldEast        =this.east      .slice();
        this.oldWest        =this.west      .slice();
        this.oldStationary  =this.stationary.slice();

        this.north=[];
        this.south=[];
        this.east=[];
        this.west=[];
        this.stationary=[];
    }


}