export function manageCamera(scene)
{
    var cameraArray = scene.scene.scene.cameras.cameras;
    var width = scene.scale.width;
    var height = scene.scale.height;
    redrawCameras(cameraArray,width,height);
}
//this code was repurposed for an earlier iteration of this game that i was using just html canvas for
/* when you add, hide, show a camera, or if you resize the window, or the user selects the option to resize the window then we should recalculate the cameras size and position */
/* given the window width and height - which will be recorded or given by the resize event, or might have been manually adjusted with the manuallySetupWindowSize method, configure all cameras, displaying only those that are visible */
function redrawCameras(array,w,h)
{
	/* there can be cameras in the array that are hidden, so first add the indexes of the shown cameras to this array*/
	let visibleCamerasIndexArray=[];
	/* as we add more cameras,  we need to shrink existing ones, this sequence helper only helps to define the order in which they should shrink */
	let sequenceHelper=0;
	let sequenceLength=2;
	let sequence=[];
	for(let i =0; i< array.length;i++)
	{
		/* if the camera is visible */
		if(array[i].visible)
		{
			/* add the camera to the visible camera array */
			visibleCamerasIndexArray.push(i);
			/* we will construct a sequence array the same size as the number of visible cameras, this sequence array will simply dictate which camera will be divided next. it should look like this 0, 1, 0, 1, 2, 3, 0, 1, 2, 3, 4, 5, 6, 7, 0,1 etc*/
			if(sequenceHelper<sequenceLength)
			{
				sequence.push(sequenceHelper);
				sequenceHelper++;
			}
			if(sequenceHelper==sequenceLength)
			{
				sequenceLength*=2;
				sequenceHelper=0;
			}
		}
	}
	/* default the first visible camera to the full size of the screen and at top left position*/
    
	array[visibleCamerasIndexArray[0]].setSize(w,h);
	array[visibleCamerasIndexArray[0]].setPosition(0,0);

	/* for each visible camera - bar the last, divide a camera according to our sequence, this will shrink the current camera and fit the new camera into the extra space that we just created */
	for(let i =0; i< visibleCamerasIndexArray.length-1;i++)
	{
		divide(array,visibleCamerasIndexArray[sequence[i]],visibleCamerasIndexArray[i+1]);
	}
}
/* dividing one camera will give 2 rectangles, we should set the new dimensions of the camera we divided as the first rect, and the new camera should be given the dimensions equal to the second rect*/
function divide(array,index1,index2)
{
    let x1 ;
    let x2 ;
    let y1 ;
    let y2 ;
    let newWidth ;
    let newHeight;
	/* if the camera is taller than it is wide slice that across the middle to make 2 shorter rectangles */
	if(isPortrait(array[index1].width,array[index1].height))
	{
		x1 = array[index1].x;
        x2 = array[index1].x;
        y1 = array[index1].y;
        y2 = array[index1].y+array[index1].height/2;
        newWidth=array[index1].width;
        newHeight=array[index1].height/2;
    }
	/* if the camera is wider than it is tall, slice that down the centre and make 2 thinner rectangles */
	else
	{
        x1=array[index1].x;
        x2=array[index1].x+array[index1].width/2;
        y1=array[index1].y;
        y2=array[index1].y;
        newWidth=array[index1].width/2;
        newHeight=array[index1].height;
	}
	array[index1].setSize(newWidth,newHeight);
	array[index2].setSize(newWidth,newHeight);
	array[index1].setPosition(x1,y1);
	array[index2].setPosition(x2,y2);
}
/* if we give the width and height of a rectangle this will tell you if it is portrait or landscape  */
function isPortrait(w,h)
{
	return (Math.max(w,h)==h);
}