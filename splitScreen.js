export function manageCamera(scene,targetx,targety)
{
    var cameraArray = scene.scene.scene.cameras.cameras;
    var width = scene.scale.width;
    var height = scene.scale.height;
    redrawCameras(cameraArray,width,height,targetx,targety);
}


function Camera(array,scale,position)
{
	this.array=array;
	this.scale=scale;
	this.canvas = document.createElement('canvas');
	this.canvas.style.position = 'absolute';
	this.canvas.style.top="0px";
	this.canvas.style.left="0px";
	canvasContainer.appendChild(this.canvas);
	this.context = this.canvas.getContext('2d');
	this.context.textBaseline='top';
	this.context.textAlign = "center";
	this.canvas.style.border='1px solid #000000';
	/* the canvas width and height will be how large the camera appears on screen, so will need to shrink it when adding a split screen, or else they won't both fit on the screen */
	/* give it a default value here but this will be overwritten when the cameras are automatically redrawn*/
	this.setWidthAndHeight(windowSizeWidth,windowSizeHeight);
	/* target is the in game position, so what the camera is looking at */
	this.target=position;
	/* position is how we have transalted the camera to put the target in the centre of the camera */
	this.setPosition();
}
/* when you add, hide, show a camera, or if you resize the window, or the user selects the option to resize the window then we should recalculate the cameras size and position */
/* given the window width and height - which will be recorded or given by the resize event, or might have been manually adjusted with the manuallySetupWindowSize method, configure all cameras, displaying only those that are visible */
function redrawCameras(array,w,h,targetx,targety)
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
	for(let i =0; i< visibleCamerasIndexArray.length;i++)
	{
		//array[i].setScroll(targetx,targety);
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
/* pass in the cameraArray, scale is just the zoom, position is the game world position that the camera will look at */
// function addCamera(array,scale,position)
// {
// 	let index = array.length;
// 	array.push(new Camera(array,scale,position));
// 	redrawCameras(array,windowSizeWidth,windowSizeHeight);
// 	return index;
// }
/* so far i'm able to hide cameras but i never destroy them, i'm not sure if this will have some performance issue... */
// Camera.prototype.hideCamera = function()
// {
// 	this.canvas.style.display = 'none';
// 	redrawCameras(this.array,windowSizeWidth,windowSizeHeight);
// }
// Camera.prototype.showCamera = function()
// {
// 	this.canvas.style.display = 'inline-grid';	
// 	redrawCameras(this.array,windowSizeWidth,windowSizeHeight);

// }
// Camera.prototype.isShown = function()
// {
// 	return this.canvas.style.display != 'none'?true:false;
// }
Camera.prototype.setTarget= function(target)
{
	this.target=target;
}
/* this is the position the camera is looking at in the world map */
Camera.prototype.mySetPosition = function()
{
	this.position = {
	x:this.canvas.width /2-(this.target.x) *this.scale,
	y:this.canvas.height/2-(this.target.y) *this.scale};
}
Camera.prototype.setScale = function(scale)
{
	this.scale= scale;
}
// /* i can use window.innerWidth to find out how big the screen is, i can then use this to resize my cameras */
// Camera.prototype.setWidthAndHeight = function(w,h)
// {
// 	this.canvas.width=w;
// 	this.canvas.height=h;
// }
// /* this will set the cameras position on the screen for when i use splitscreen */
// Camera.prototype.setSplitCameraPosition = function(t,l)
// {
// 	this.canvas.style.top=t+'px';
// 	this.canvas.style.left=l+'px';
// }
// Camera.prototype.getRect = function()
// {
// 	/* these values would be string with 'px' at the end, so here i parse that into an int */
// 	let t=parseInt(this.canvas.style.top.slice(0,-2));
// 	let l=parseInt(this.canvas.style.left.slice(0,-2));
// 	let w=this.canvas.width;
// 	let h=this.canvas.height;
// 	return {top:t,left:l,width:w,height:h};
// }