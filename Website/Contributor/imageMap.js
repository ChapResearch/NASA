//
// imageMap.js
//
//   Holds all of the cool image map stuff!

//
// the following arrays hold the imageMap information for the different types of
//   image maps, and their associated data/structure.
//
var imageMapType = {};    // the type of the imageMap - used to enumerate imageMaps, too
                          //  NOTE that the property/id in this array is the data field
                          //  that is filled in with the data

// type = "event"
var imageMapEvent = {};       // holds arrays of events attached to a property that is the ID of the imagemap
var imageMapXYField = {};     // the field that will be filled in with XY data when gathering (if given)
var imageMapXY = {};          // holds arrays of XY coordinates to a property that is the ID of the imagemap
var imageMapImage = {};       // holds arrays of image map images
var imageMapHeat = {};        // holds the "simpleheat" object
var imageMapEventWindow = {}; // points to the event window for this imageMap
var imageMapSize = {};        // size of the image maps for easy rotation
var imageMapTimers = {};      // tracks the length of a press for either click or longpress
var imageMapRotation = {};    // used to track if an image has been rotated


// type = "radio"

// type = "checkbox"

//
// imageMap_refresh() - used to "refresh" the imageMap, which is done (particularly) after
//                      the picture for the imageMap has been loaded. This also ensures that
//                      the associated canvas's have the width/height set right (to enable
//                      clicking).
//
function imageMap_refresh(id)
{
    // both canvas's have css styling for height and width, but the overlay
    //   canvas (in particular) needs to have its height and width set
    //   directly so that the coordinate system for clicking is set right
    //   NOTE - without this, the mouse clicking won't be aligned

    var canvas = document.getElementById(id);
    var overlayCanvas = document.getElementById('overlay-' + id);

    var width = canvas.scrollWidth;
    var height = canvas.scrollHeight;
    
    var ctx = canvas.getContext('2d');
    var overlayCtx = overlayCanvas.getContext('2d');

    ctx.canvas.width = overlayCtx.canvas.width = width;
    ctx.canvas.height = overlayCtx.canvas.height = height;
    
    ctx.drawImage(imageMapImage[id],0,0,canvas.width,canvas.height);

    imageMapHeat[id] = new simpleheat(overlayCanvas);
    imageMapHeat[id].max(2);
    imageMapHeat[id].opacity(0.025);

    imageMapSize[id] = {width:width,height:height};

    imageMapHeat[id].resize();
}

//
// imageMap_initAll() - initialize all of the imageMaps on the page.  In general, this
//                      will set-up all of the variables/tracking for the different
//                      types of imageMaps.

function imageMap_initAll()
{
    for(var imageMapID in imageMapImage) {

	// set up to refresh the display canvas when the image is loaded
	imageMapImage[imageMapID].addEventListener("load",imageMap_refresh.bind(null,imageMapID),false);

// the old way was just to do clicks, now we process longpresses
//	
//	$('#' + 'overlay-' + imageMapID).off("click");
//	$('#' + 'overlay-' + imageMapID).on("click",imageMap_click.bind(null,imageMapID));

    	$('#' + 'overlay-' + imageMapID).off();
	$('#' + 'overlay-' + imageMapID).on("mousedown",imageMap_mouseDown.bind(null,imageMapID));
	$('#' + 'overlay-' + imageMapID).on("mouseup",imageMap_mouseUp.bind(null,imageMapID));
	$('#' + 'overlay-' + imageMapID).on("taphold",imageMap_longPress.bind(null,imageMapID));

	$('#' + imageMapID + '-flip').off();
	$('#' + imageMapID + '-flip').on('click',imageMap_longPress.bind(null,imageMapID));

	imageMapXY[imageMapID] = [];
	
    }
}

//
// imageMap_gather() - called to gather data from ALL imageMaps.
//
function imageMap_gather(data)
{
    for(var id in imageMapType) {
	switch(imageMapType[id]) {
	case 'event':    imageMap_gatherEvent(id,data); break;
	case 'radio':    imageMap_gatherRadio(id,data); break;
	case 'checkbox': imageMap_gatherCheckbox(id,data); break;
	}
    }
}
    
//
// imageMap_reset() - called to reset the ALL imageMaps.
//
function imageMap_reset()
{
    for(var id in imageMapType) {
	switch(imageMapType[id]) {
	case 'event':    imageMap_resetEvent(id); break;
	case 'radio':    imageMap_resetRadio(id); break;
	case 'checkbox': imageMap_resetCheckbox(id); break;
	}
    }
}

//
// imageMap_mouseDown() - when the mouse goes down on an image map, this functions sets
//                        a timer to check for a simple click or a long press.
//
function imageMap_mouseDown(id,event)
{
    var d = new Date();

    imageMapTimers[id] = d.getTime();
}

function imageMap_mouseUp(id,event)
{
    var d = new Date();
    var now = d.getTime();

    if(imageMapTimers.hasOwnProperty(id)) {
	if((now - imageMapTimers[id]) > 2000) {
	    imageMap_longPress(id,event);
	} else {
	    imageMap_click(id,event);
	}
	delete imageMapTimers[id];
    }
}

function imageMap_longPress(id,event)
{
    if(imageMapRotation.hasOwnProperty(id)) {
	delete imageMapRotation[id];
	$('#'+id).css("transform","");
    } else {
	$('#'+id).css("transform","rotate(180deg)");
	imageMapRotation[id] = true;
    }

    delete imageMapTimers[id];
    imageMap_redraw(id);
}

//
// imageMap_click() - when an image map is clicked (the overlay that is), this routine
//                    is called.
//
function imageMap_click(id,event)
{
    event = event || window.event;

    var parent = event.currentTarget.getBoundingClientRect();
    var rawx = event.offsetX;
    var rawy = event.offsetY;

    // these are the standard "percentage" ints that are used in NASA
    var x = Math.ceil(rawx / parent.width * 100);
    var y = Math.ceil(rawy / parent.height * 100);

//    console.log('you clicked at (' + x + ',' + y + ')');
//    console.log('you clicked at (' + rawx + ',' + rawy + ')');

    switch(imageMapType[id]) {
    case 'event':    imageMap_clickEvent(id,x,y,rawx,rawy); break;
    case 'radio':    imageMap_clickRadio(id,x,y,rawx,rawy); break;
    case 'checkbox': imageMap_clickCheckbox(id,x,y,rawx,rawy); break;
    }
}

function imageMap_gatherEvent(id,data)
{
    data[id] = imageMapEvent[id];

    // the field for XY data may be null
    if(imageMapXYField[id]) {
	data[imageMapXYField[id]] = imageMapXY[id];
    }
}

function imageMap_resetEvent(id)
{
    if(imageMapHeat.hasOwnProperty(id)) {
	imageMapHeat[id].clear();
	imageMapHeat[id].draw();
    }
    if(imageMapEvent.hasOwnProperty(id)) {
	imageMapEvent[id] = [];
	imageMapXY[id] = [];
    }
}

function imageMap_clickEvent(id,x,y,rawx,rawy)
{
    imageMapHeat[id].add([rawx,rawy,1]);
    imageMapHeat[id].draw();

    var minutes = timerGetMins();
    var seconds = timerGetSecs();

    var totalSeconds = seconds + minutes*60

    if(!imageMapXY.hasOwnProperty(id)) {
	imageMapXY[id] = [];
    }
    if(!imageMapEvent.hasOwnProperty(id)) {
	imageMapEvent[id] = [];
    }
    imageMapEvent[id].push(totalSeconds);

    if(imageMapRotation.hasOwnProperty(id)) {
	imageMapXY[id].push({x:100-x,y:100-y});
    } else {
	imageMapXY[id].push({x:x,y:y});
    }

    // TODO - the event should be added to the associated event window if it exists
}

//
// imageMap_redraw() - upon a rotate, the imageMap needs to be cleared and reloaded
//                     from the STORED data.
//
function imageMap_redraw(id)
{
    imageMapHeat[id].clear();

    for(var i=0; i < imageMapXY[id].length; i++) {
	var x = imageMapXY[id][i].x / 100;
	var y = imageMapXY[id][i].y / 100;

	var width = imageMapSize[id].width;
	var height = imageMapSize[id].height;

	if(imageMapRotation.hasOwnProperty(id)) {
	    imageMapHeat[id].add([width - (x*width), height-(y*height),1]);
	} else {
	    imageMapHeat[id].add([x*width,y*height,1]);
	}
    }
    imageMapHeat[id].draw();
}
    
function imageMap_clickRadio(id,x,y,rawx,rawy)
{
}
function imageMap_resetRadio(id)
{
}

function imageMap_gatherRadio(id,data)
{
}

function imageMap_resetCheckbox(id)
{
}
    
function imageMap_gatherCheckbox(id,data)
{
}
    
function imageMap_clickCheckbox(id,x,y,rawx,rawy)
{
}


function simpleheat(canvas) {
    if (!(this instanceof simpleheat)) return new simpleheat(canvas);

    this._canvas = canvas = typeof canvas === 'string' ? document.getElementById(canvas) : canvas;

    this._ctx = canvas.getContext('2d');
    this._width = canvas.width;
    this._height = canvas.height;

    this._max = 1;
    this._data = [];

    this._opacity = 0.05;
}

simpleheat.prototype = {

    defaultRadius: 25,

    defaultGradient: {
        0.4: 'blue',
        0.6: 'cyan',
        0.7: 'lime',
        0.8: 'yellow',
        1.0: 'red'
    },

    data: function (data) {
        this._data = data;
        return this;
    },

    max: function (max) {
        this._max = max;
        return this;
    },

    add: function (point) {
        this._data.push(point);
        return this;
    },

    opacity: function(o) {
	this._opacity = o;
	return this;
    },

    clear: function () {
        this._data = [];
        return this;
    },

    radius: function (r, blur) {
        blur = blur === undefined ? 15 : blur;

        // create a grayscale blurred circle image that we'll use for drawing points
        var circle = this._circle = this._createCanvas(),
            ctx = circle.getContext('2d'),
            r2 = this._r = r + blur;

        circle.width = circle.height = r2 * 2;

        ctx.shadowOffsetX = ctx.shadowOffsetY = r2 * 2;
        ctx.shadowBlur = blur;
        ctx.shadowColor = 'black';

        ctx.beginPath();
        ctx.arc(-r2, -r2, r, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();

        return this;
    },

    resize: function () {
        this._width = this._canvas.width;
        this._height = this._canvas.height;
    },

    gradient: function (grad) {
        // create a 256x1 gradient that we'll use to turn a grayscale heatmap into a colored one
        var canvas = this._createCanvas(),
            ctx = canvas.getContext('2d'),
            gradient = ctx.createLinearGradient(0, 0, 0, 256);

        canvas.width = 1;
        canvas.height = 256;

        for (var i in grad) {
            gradient.addColorStop(+i, grad[i]);
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1, 256);

        this._grad = ctx.getImageData(0, 0, 1, 256).data;

        return this;
    },

    draw: function (minOpacity) {
        if (!this._circle) this.radius(this.defaultRadius);
        if (!this._grad) this.gradient(this.defaultGradient);

        var ctx = this._ctx;

        ctx.clearRect(0, 0, this._width, this._height);

        // draw a grayscale heatmap by putting a blurred circle at each data point
        for (var i = 0, len = this._data.length, p; i < len; i++) {
            p = this._data[i];
            ctx.globalAlpha = Math.min(Math.max(p[2] / this._max, minOpacity === undefined ? this._opacity : minOpacity), 1);
	    var x = p[0] - this._r;
	    var y = p[1] - this._r;
            ctx.drawImage(this._circle, x, y);
        }

        // colorize the heatmap, using opacity value of each pixel to get the right color from our gradient
        var colored = ctx.getImageData(0, 0, this._width, this._height);
        this._colorize(colored.data, this._grad);
        ctx.putImageData(colored, 0, 0);

        return this;
    },

    _colorize: function (pixels, gradient) {
        for (var i = 0, len = pixels.length, j; i < len; i += 4) {
            j = pixels[i + 3] * 4; // get gradient color from opacity value

            if (j) {
                pixels[i] = gradient[j];
                pixels[i + 1] = gradient[j + 1];
                pixels[i + 2] = gradient[j + 2];
            }
        }
    },

    _createCanvas: function () {
        if (typeof document !== 'undefined') {
            return document.createElement('canvas');
        } else {
            // create a new canvas instance in node.js
            // the canvas class needs to have a default constructor without any parameter
            return new this._canvas.constructor();
        }
    }
};
