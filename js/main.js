$(document).ready(function () {

     

     NProgress.configure({ showSpinner: false });
     NProgress.configure({ trickle: false });



var settings = {
        Style: 'sketch',
        BrushSize: 1.0,
        SketchStrength:20,
        BrushColor: [ 50,50,50], 
        BackgroundColor: [ 255,255,255]
    };

    var gui = new dat.gui.GUI();

    //gui.remember(settings);


    gui.add(settings, 'Style', [ 'sketch', 'simple' ] );
    gui.add(settings, 'BrushSize').min(0).max(5).step(1);
    gui.add(settings, 'SketchStrength').min(1).max(100).step(1);
    var f1 = gui.addFolder('Colors');
    f1.addColor(settings, 'BrushColor');
    f1.addColor(settings, 'BackgroundColor');
    


function downloadCanvas(link, sourceCanvas, filename) {
    link.href = sourceCanvas.toDataURL();
    link.download = filename;
}

document.getElementById('download').addEventListener('click', function() {
    downloadCanvas(this, scanvas, 'sketch.png');
    
}, false);

  function importCanvas(sourceCanvas, targetSVG) {
    // get base64 encoded png data url from Canvas
    var img_dataurl = sourceCanvas.toDataURL("image/png");

    var svg_img = document.createElementNS(
        "http://www.w3.org/2000/svg", "image");
    
    svg_img.setAttributeNS(
        "http://www.w3.org/1999/xlink", "xlink:href", img_dataurl);
    
    targetSVG.appendChild(svg_img);
}
  
  var image;
  var contourFinder;
  var startTime = 0;
  var resultWidth;
  var resultHeight;
  var imageWidth;
  var scanvas;
  var filters, canny,canvas;


  
  var DIRECTIONS = {
    N: 0,
    NE: 1,
    E: 2,
    SE: 3,
    S: 4,
    SW: 5,
    W: 6,
    NW: 7,
    SAME: 8
  };
var ctx2;
var selColorR = 0;
var selColorG = 0;
var selColorB = 0;
var count =1;

var BezierCurveBrush = {
// inner variables
iPrevX : 0,
iPrevY : 0,
points : null,
// initialization function
init: function () { },
startCurve: function (x, y) {
this.iPrevX = x;
this.iPrevY = y;
this.points = new Array();

},
getPoint: function (iLength, a) {
var index = a.length - iLength, i;
for (i=index; i< a.length; i++) {
if (a[i]) {
return a[i];
}
}
},
draw: function (x, y) {
if (Math.abs(this.iPrevX - x) > 1 || Math.abs(this.iPrevY - y) >0) 
  {
this.points.push([x, y]);
// draw main path stroke
ctx.beginPath();
ctx.moveTo(this.iPrevX, this.iPrevY);
ctx.lineTo(x, y);

ctx.lineWidth = settings.BrushSize;
//console.log(parseInt(settings.BrushColor[0])+""+settings.BrushColor[1]+" "+settings.BrushColor[2]);
ctx.strokeStyle = 'rgba(' + parseInt(settings.BrushColor[0]) + ', ' +parseInt(settings.BrushColor[1]) + ', ' +parseInt(settings.BrushColor[2]) + ', 0.8)';
ctx.stroke();

ctx.closePath();
// draw extra strokes

if(settings.Style=='sketch')  
{ctx.strokeStyle = 'rgba(' + parseInt(settings.BrushColor[0]) + ', ' +parseInt(settings.BrushColor[1]) + ', ' +parseInt(settings.BrushColor[2]) + ', 0.4)';
ctx.beginPath();
var iStartPoint = this.getPoint(settings.SketchStrength, this.points);
var iFirstPoint = this.getPoint(12, this.points);

var iSecondPoint = this.getPoint(parseInt(settings.SketchStrength/3), this.points);
ctx.moveTo(iStartPoint[0],iStartPoint[1]);
ctx.shadowBlur = parseInt(Math.random() * (8 - 1) + 1);
//console.log(ctx.shadowBlur);
  ctx.shadowColor = 'rgba(0, 0, 0,0.5)';
ctx.bezierCurveTo(iFirstPoint[0], iFirstPoint[1], iSecondPoint[0], iSecondPoint[1], x, y);
ctx.stroke();    
ctx.closePath();
}
this.iPrevX = x;
this.iPrevY = y;
 
}
}
};
   

image = document.getElementById('image');
var dropAreaElement = document.querySelector('.main');

  var imageProvider = new ImageProvider({
    element: dropAreaElement,
    onImageRead: function(image) {
      
       var ctxt;
       //temp img
       var imageTmp = new Image();
       imageTmp.id  = 'result';
       imageTmp.src = image.src;
       imageTmp.onload=function(){
       
       var aspectRatio=imageTmp.width/imageTmp.height;
       console.log("w x h "+imageTmp.width+" "+imageTmp.height);
       console.log("AR :"+aspectRatio);
       if (imageTmp.width>640)
           {
             resultWidth=320;
             resultHeight=320/aspectRatio;
           }
        else
          {
             resultWidth=imageTmp.width;
             resultHeight=imageTmp.height;

          }
        
        console.log("w x h"+resultWidth+" "+resultHeight);
         
        scanvas  = document.createElement('canvas');
        scanvas.id = 'canvas2';
        scanvas.width = resultWidth;
        scanvas.height =  resultHeight;
        ctxt=scanvas.getContext("2d");
        ctxt.drawImage(imageTmp,0,0,resultWidth,resultHeight);
        image.src= scanvas.toDataURL();
        delete imageTmp;

        image.onload=function(){
           // delete previous images
      var prev = document.querySelector('.container img');
      if (prev) {
        prev.parentNode.removeChild(prev);
       
      }
      var polylines = document.querySelectorAll('#svg2 polyline');
      if (polylines.length) {
        for (var i = 0; i < polylines.length; i++) {
          polylines[i].parentNode.removeChild(polylines[i]);
        }
      }
       var images = document.querySelectorAll('#svg2 image');
      if (images.length) {
        for (var i = 0; i < images.length; i++) {
          images[i].parentNode.removeChild(images[i]);
        }
      }
        image.style.opacity = 1;
        imageWidth = image.width;

        
         document.querySelector('.container')
        .appendChild(image);
        canvas.loadImg(image.src, 0, 0, resultWidth, resultHeight).then(process);

        }
    }
     

      dropAreaElement.classList.add('dropped');
      contourFinder = new ContourFinder();
      canvas = new Canvas('canvas', resultWidth, resultHeight);

      canny = new Canny(canvas);
      filters = new Filters(canvas);

     

    }
  });

  imageProvider.init();

  function process() {
 NProgress.start() ;
    startTime = Date.now();
    console.log("grayscale");
    canvas.setImgData(filters.grayscale());
    canvas.setImgData(filters.gaussianBlur(5, 1));
 console.log("gaussianBlur");
    canvas.setImgData(canny.gradient('sobel'));
     console.log("sobel");
     NProgress.set(0.26);
    canvas.setImgData(canny.nonMaximumSuppress());
    canvas.setImgData(canny.hysteresis());
 console.log("next");
    contourFinder.init(canvas.getCanvas());
    contourFinder.findContours();
     console.log("ok");
    NProgress.set(0.5);
   // console.log('contourFinder.allContours.length): ' + contourFinder.allContours.length);
    var secs = (Date.now() - startTime) / 1000;
    //console.log('Finding contours took ' + secs + 's');

    drawContours();
  }

  function findOutDirection(point1, point2) {
    if (point2.x > point1.x) {
      if (point2.y > point1.y) {
        return DIRECTIONS.NE;
      } else if (point2.y < point1.y) {
        return DIRECTIONS.SE;
      } else {
        return DIRECTIONS.E;
      }
    } else if (point2.x < point1.x) {
      if (point2.y > point1.y) {
        return DIRECTIONS.NW;
      } else if (point2.y < point1.y) {
        return DIRECTIONS.SW;
      } else {
        return DIRECTIONS.W;
      }
    } else {
      if (point2.y > point1.y) {
        return DIRECTIONS.N;
      } else if (point2.y < point1.y) {
        return DIRECTIONS.S;
      } else {
        return DIRECTIONS.SAME;
      }
    }
  }

  function drawContours() {
 
    ctx = scanvas.getContext("2d");
    ctx.canvas.height =resultWidth;
    ctx.canvas.height =resultHeight;
    scanvas.style.width = resultWidth+'px';
    scanvas.style.height = resultHeight+'px';
    ctx.clearRect(0, 0, resultWidth, resultHeight);
		ctx.fillStyle ='rgba(' + parseInt(settings.BackgroundColor[0]) + ', ' +parseInt(settings.BackgroundColor[1]) + ', ' +parseInt(settings.BackgroundColor[2]) + ', 1.0)';
		ctx.fillRect(0, 0, resultWidth, resultHeight);
    
    BezierCurveBrush.init();
    for (var i = 0; i < contourFinder.allContours.length; i++) {
      //console.log('contour #' + i + ' length: ' + contourFinder.allContours[i].length);
      drawContour(i);
    }
    
    animate();

  }
 function draw()
 {

 }
  function drawContour(index) {
    var points = contourFinder.allContours[index];
  
    var optimizedPoints = [],
        direction = null;

    points.reduce(function(accumulator, currentValue, currentIndex, array) {
      if (optimizedPoints.length === 0) {
        optimizedPoints.push(currentValue);
        return null;
      } else {
        var direction = findOutDirection(currentValue, array[currentIndex - 1]);
        if (direction === DIRECTIONS.SAME) {
          return accumulator;
        }
        if (direction !== accumulator) {
          optimizedPoints.push(currentValue);
        } else {
          optimizedPoints[optimizedPoints.length -1] = currentValue;
        }
        return direction;
      }
    }, null);

    var pointsString = optimizedPoints.map(function(point) {
      return point.x + ',' + point.y;
    }).join(' ');

    var sk_points = optimizedPoints.map(function(point) {
      return point.x + ',' + point.y;
    });
    
    var ind=0;
    var px,py=0;
    BezierCurveBrush.startCurve(px, py, false, false, false, false, false, false, px, py, 0, 0);

for (var dpts in optimizedPoints) {

     ind++;
     px= optimizedPoints[dpts].x;
     py= optimizedPoints[dpts].y;
     BezierCurveBrush.draw(optimizedPoints[dpts].x,optimizedPoints[dpts].y, false, false, false, false, false, false, optimizedPoints[dpts].x, optimizedPoints[dpts].y, 0, 0);
 

  }
    var polyline = document.createElementNS('http://www.w3.org/2000/svg','polyline');
    polyline.setAttributeNS(null, 'points', pointsString.trim());

    var svg = document.querySelector('#svg2');
    svg.appendChild(polyline);
    svg.setAttribute('viewBox', '0 0 ' + resultWidth + ' ' + resultHeight);
    svg.setAttribute('style', 'width:' + imageWidth + 'px');
  }

  function animate() {
    
    var polylines = document.querySelectorAll('#svg2 polyline');
    [].forEach.call(polylines, function(polyline, index) {
      var length = contourFinder.allContours[index].length;
     
      // Clear any previous transition
      polyline.style.transition = polyline.style.WebkitTransition =
        'none';

      // Set up the starting positions
      polyline.style.strokeDasharray = length + ' ' + length;
      polyline.style.strokeDashoffset = length;
      // Trigger a layout so styles are calculated & the browser
      // picks up the starting position before animating
      polyline.getBoundingClientRect();
      // Define our transition
      polyline.style.transition = polyline.style.WebkitTransition =
        'stroke-dashoffset 2s linear';
      // Go!
      polyline.style.strokeDashoffset = '0';
    });

    setTimeout(function() {
    
    console.log("finish");
       var img_dataurl = scanvas.toDataURL("image/png");
       var  svg = document.querySelector('#svg2');

       var polylines = document.querySelectorAll('#svg2 polyline');
      if (polylines.length) {
        for (var i = 0; i < polylines.length; i++) {
          polylines[i].parentNode.removeChild(polylines[i]);
        }
       }
      importCanvas(scanvas,svg);
      //alert( document.querySelector(scanvas.width));
       document.querySelector('.container img').style.opacity = 0;
      document.querySelector('.container svg').style.opacity = 1;
      NProgress.done();
    }, 2500);
  }

  });

  function canvasToImage(backgroundColor)
{
	//cache height and width		
	var w = canvas.width;
	var h = canvas.height;
 
	var data;
 
	if(backgroundColor)
	{
		//get the current ImageData for the canvas.
		data = context.getImageData(0, 0, w, h);
 
		//store the current globalCompositeOperation
		var compositeOperation = context.globalCompositeOperation;
 
		//set to draw behind current content
		context.globalCompositeOperation = "destination-over";
 
		//set background color
		context.fillStyle = backgroundColor;
 
		//draw background / rect on entire canvas
		context.fillRect(0,0,w,h);
	}
 
	//get the image data from the canvas
	var imageData = this.canvas.toDataURL("image/png");
 
	if(backgroundColor)
	{
		//clear the canvas
		context.clearRect (0,0,w,h);
 
		//restore it with original / cached ImageData
		context.putImageData(data, 0,0);
 
		//reset the globalCompositeOperation to what it was
		context.globalCompositeOperation = compositeOperation;
	}
 
	//return the Base64 encoded data url string
	return imageData;
}