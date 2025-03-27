
export default class PriorityArray
{    
    constructor()
    {
        //there are 5 priority arrays, they will hold the index number of the creature that intends to travel in this direction as well as the either x or y position of the creature to aid sorting like so {i:index,p:x}
        this.north=[];
        this.south=[];
        this.east=[];
        this.west=[];
        this.stationary=[];
        this.concat=[];
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
        this.oldConcat=[];
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
        this.addAll();
        //clear the concat array
        this.oldConcat      =this.concat.slice();
        this.concat=[];
        let p = this.priority;
        for( let i = 0 ; i < this.all.length ; i ++)
        {
            //add all the items to one large array in priority order
            this.concat = this.concat.concat(this.all[p]);
            p=(p+1)%this.all.length;
        }
        //i think concat method is adding them by ref, so slice it to make it by value
        this.concat=this.concat.slice();
    }
    //when pathfinding is run we will have a proposed position for the creature, we will also know which direction it intends to travel so we can add it to the relevant priority array, but we will insert it in order so that the array remains sorted, for example the north array should be sorted by most northern item first 
    //pathfinding will be run in order of priority array, that means - we can assume that some of the time the creatures will want to travel in the same direction they did last time - and if they do, then we can use that to our advantage to help sort the array
    //so a is teh array, v is the value which will be {i:index,p:x or y}, and d which is one of the global constants for direction
    addAndSort(a,v,d)
    {
        //if the array is empty then just add the value and return
        if(a.length==0)
        {
            a.push(v);
            return;
        }
        switch(d)
        {
            case NORTH:
                //starting with the last item in the array...
                for(let i = a.length-1 ; i >=0 ; i--)
                {
                    //...check if the new value's position is more than or equal to the n'th item in the array...
                    if(v.p>=a[i].p)
                    {
                        //...if so insert after that number and return...
                        a.splice(i+1,0,v);
                        return;
                        //...else loop through until we find a place for it...
                    }
                }
                //if we did not find any item in the array with a p smaller than the new item, then add it to the start of the array
                a.splice(0,0,v) ;
                return;
                break;
            case SOUTH:
                //starting with the last item in the array...
                for(let i = a.length-1 ; i >=0 ; i--)
                {
                    //...check if the new value's position is less than or equal to the n'th item in the array...
                    if(v.p<=a[i].p)
                    {
                        //...if so insert after that number and return...
                        a.splice(i+1,0,v);
                        return;
                        //...else loop through until we find a place for it...
                    }
                    
                }
                //if we did not find any item in the array with a p larger than the new item, then add it to the start of the array
                a.splice(0,0,v) ;
                return;
                break;
            case EAST:
                //starting with the last item in the array...
                for(let i = a.length-1 ; i >=0 ; i--)
                {
                    //...check if the new value's position is less than or equal to the n'th item in the array...
                    if(v.p<=a[i].p)
                    {
                        //...if so insert after that number and return...
                        a.splice(i+1,0,v);
                        return;
                        //...else loop through until we find a place for it...
                    }
                }
                //if we did not find any item in the array with a p smaller than the new item, then add it to the start of the array
                a.splice(0,0,v) ;
                return;
                break;
            case WEST:
                //starting with the last item in the array...
                for(let i = a.length-1 ; i >=0 ; i--)
                {
                    //...check if the new value's position is more than or equal to the n'th item in the array...
                    if(v.p>=a[i].p)
                    {
                        //...if so insert after that number and return...
                        a.splice(i+1,0,v);
                        return;
                        //...else loop through until we find a place for it...
                    }
                }
                //if we did not find any item in the array with a p smaller than the new item, then add it to the start of the array
                a.splice(0,0,v) ;
                return;
                break;
            case STATIONARY:
                a.push(v);
                return;
                break;
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
    addAll()
    {
        this.all=[this.north,this.south,this.east,this.west,this.stationary];
    }


}