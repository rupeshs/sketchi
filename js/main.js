
"use strict";
var dismsg;
var image;
var gimage;
 var ctx;
var contourFinder;
var startTime = 0;
var resultWidth;
var resultHeight;
var imageWidth;
var scanvas;
var filters, canny, canvas;

$(document).ready(function () {

  NProgress.configure({ showSpinner: false });
  NProgress.configure({ trickle: false });
  dismsg = document.getElementById("stat");

  var settings = {
    Style: 'sketch',
    BrushSize: 1.0,
    Smoothness:1,
    SketchStrength: 20,
    BrushColor: [50, 50, 50],
    BackgroundColor: [255, 255, 255]
  };

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
  var count = 1;

  var gui = new dat.gui.GUI();
 
  gui.add(settings, 'Style', ['sketch', 'simple', 'chalkboard']).onChange(function (style) {
    
    if (style == 'chalkboard') {
      settings.BackgroundColor = [50, 50, 50];
      settings.BrushColor = [200, 200, 200];
    }
    else {
      settings.BackgroundColor = [255, 255, 255];
      settings.BrushColor = [50, 50, 50];

    }

  });
 
  gui.add(settings, 'BrushSize').min(0).max(5).step(1);
  gui.add(settings, 'Smoothness').min(1).max(5).step(1);
  gui.add(settings, 'SketchStrength').min(1).max(100).step(1);
  
  var f1 = gui.addFolder('Colors');
  f1.addColor(settings, 'BrushColor').listen();;
  f1.addColor(settings, 'BackgroundColor').listen();;

  function downloadCanvas(link, sourceCanvas, filename) {
    link.href = sourceCanvas.toDataURL();
    link.download = filename;
  }

  document.getElementById('download').addEventListener('click', function () {
    downloadCanvas(this, scanvas, 'sketch.png');
  }, false);
  
  document.getElementById('redo').addEventListener('click', function () {
    sketchi();
  }, false);


  function sketchi() {
    
    var ctxt;
    var imageTmp = new Image();
    imageTmp.id = 'result';
    imageTmp.src = gimage.src;
    imageTmp.onload = function () {

      var aspectRatio = imageTmp.width / imageTmp.height;
      console.log("w x h " + imageTmp.width + " " + imageTmp.height);
      console.log("AR :" + aspectRatio);
      if (imageTmp.width > 640) {
        resultWidth = 640;
        resultHeight = 640 / aspectRatio;
      }
      else {
        resultWidth = imageTmp.width;
        resultHeight = imageTmp.height;

      }

      console.log("w x h" + resultWidth + " " + resultHeight);

      scanvas = document.createElement('canvas');
      scanvas.id = 'canvas2';
      scanvas.width = resultWidth;
      scanvas.height = resultHeight;
      ctxt = scanvas.getContext("2d");
      ctxt.drawImage(imageTmp, 0, 0, resultWidth, resultHeight);
      gimage.src = scanvas.toDataURL();
      //delete imageTmp;
      $("#stat").fadeIn();
      dismsg.innerHTML = "Loading photo...";
      gimage.onload = function () {
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
        gimage.style.opacity = 1;
        imageWidth = gimage.width;

        dismsg.innerHTML = "Processing...";
        document.querySelector('.container')
          .appendChild(gimage);
        canvas.loadImg(gimage.src, 0, 0, resultWidth, resultHeight).then(process);

      }
    }

  }

  function importCanvas(sourceCanvas, targetSVG) {
    var img_dataurl = sourceCanvas.toDataURL("image/png");

    var svg_img = document.createElementNS(
      "http://www.w3.org/2000/svg", "image");

    svg_img.setAttributeNS(
      "http://www.w3.org/1999/xlink", "xlink:href", img_dataurl);

    targetSVG.appendChild(svg_img);
  }

  var BezierCurveBrush = {
    // inner variables
    iPrevX: 0,
    iPrevY: 0,
    points: null,
    // initialization function
    init: function () { },
    startCurve: function (x, y) {
      this.iPrevX = x;
      this.iPrevY = y;
      this.points = new Array();

    },
    getPoint: function (iLength, a) {
      var index = a.length - iLength, i;
      for (i = index; i < a.length; i++) {
        if (a[i]) {
          return a[i];
        }
      }
    },
    draw: function (x, y) {
      if (Math.abs(this.iPrevX - x) > 1 || Math.abs(this.iPrevY - y) > 0) {
        this.points.push([x, y]);
        // draw main path stroke
        ctx.beginPath();
        ctx.moveTo(this.iPrevX, this.iPrevY);
        ctx.lineTo(x, y);

        ctx.lineWidth = settings.BrushSize;
        
        if (settings.Style != 'simple')
          ctx.strokeStyle = 'rgba(' + parseInt(settings.BrushColor[0]) + ', ' + parseInt(settings.BrushColor[1]) + ', ' + parseInt(settings.BrushColor[2]) + ', 0.4)';
        else
          ctx.strokeStyle = 'rgba(' + parseInt(settings.BrushColor[0]) + ', ' + parseInt(settings.BrushColor[1]) + ', ' + parseInt(settings.BrushColor[2]) + ', 1.0)';

        ctx.stroke();
        ctx.closePath();

        // draw extra strokes
        if (settings.Style != 'simple') {
          ctx.strokeStyle = 'rgba(' + parseInt(settings.BrushColor[0]) + ', ' + parseInt(settings.BrushColor[1]) + ', ' + parseInt(settings.BrushColor[2]) + ', 0.4)';
          ctx.beginPath();
          ctx.lineWidth = 1;
          var iStartPoint = this.getPoint(settings.SketchStrength, this.points);
          var iFirstPoint = this.getPoint(10, this.points);

          var iSecondPoint = this.getPoint(parseInt(settings.SketchStrength / 3), this.points);
          ctx.moveTo(iStartPoint[0], iStartPoint[1]);
          //ctx.shadowBlur = parseInt(Math.random() * (8 - 1) + 1);
          //console.log(ctx.shadowBlur);
          //ctx.shadowColor = 'rgba(0, 0, 0,0.5)';
          ctx.bezierCurveTo(iFirstPoint[0], iFirstPoint[1], iSecondPoint[0], iSecondPoint[1], x, y);
          ctx.stroke();
          ctx.closePath();
        }
        this.iPrevX = x;
        this.iPrevY = y;

      }
    }
  };

  var dropAreaElement = document.querySelector('.main');

  var imageProvider = new ImageProvider({
    element: dropAreaElement,
    onImageRead: function (image) {
      gimage = image;
      sketchi();


      dropAreaElement.classList.add('dropped');
      contourFinder = new ContourFinder();
      console.log("first");
      canvas = new Canvas('canvas', resultWidth, resultHeight);

      canny = new Canny(canvas);
      filters = new Filters(canvas);



    }
  });

  imageProvider.init();

  function process() {

    NProgress.start();
    startTime = Date.now();
    NProgress.set(0.1);
    dismsg.innerHTML = "Loading...";
    canvas.setImgData(filters.grayscale());
    dismsg.innerHTML = "Processing...10%";
    NProgress.set(0.2);
    
    //find odd num odd=a+(n-1)d;
    // odd=1+(n-1)*2

    var sm=1+((settings.Smoothness-1)*2);
    console.log(sm);
    canvas.setImgData(filters.gaussianBlur(5,sm));
    dismsg.innerHTML = "Processing...40%";
    NProgress.set(0.3);
    canvas.setImgData(canny.gradient('sobel'));
    dismsg.innerHTML = "Processing...50%";
    NProgress.set(0.4);
    canvas.setImgData(canny.nonMaximumSuppress());
    dismsg.innerHTML = "Processing...60%";
    NProgress.set(0.5);
    canvas.setImgData(canny.hysteresis());
    dismsg.innerHTML = "Processing...80%";
    console.log(dismsg.innerHTML);
    NProgress.set(0.55);
    contourFinder.init(canvas.getCanvas());
    contourFinder.findContours();
    dismsg.innerHTML = "Sketching...";
    NProgress.set(0.6);
    
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
    ctx.canvas.height = resultWidth;
    ctx.canvas.height = resultHeight;
    scanvas.style.width = resultWidth + 'px';
    scanvas.style.height = resultHeight + 'px';
    ctx.clearRect(0, 0, resultWidth, resultHeight);
    ctx.fillStyle = 'rgba(' + parseInt(settings.BackgroundColor[0]) + ', ' + parseInt(settings.BackgroundColor[1]) + ', ' + parseInt(settings.BackgroundColor[2]) + ', 1.0)';
    ctx.fillRect(0, 0, resultWidth, resultHeight);

    BezierCurveBrush.init();
    for (var i = 0; i < contourFinder.allContours.length; i++) {
      //console.log('contour #' + i + ' length: ' + contourFinder.allContours[i].length);
      drawContour(i);
    }

    animate();
  }
  function draw() {

  }
  function drawContour(index) {
    var points = contourFinder.allContours[index];

    var optimizedPoints = [],
      direction = null;

    points.reduce(function (accumulator, currentValue, currentIndex, array) {
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
          optimizedPoints[optimizedPoints.length - 1] = currentValue;
        }
        return direction;
      }
    }, null);

    var pointsString = optimizedPoints.map(function (point) {
      return point.x + ',' + point.y;
    }).join(' ');

    var sk_points = optimizedPoints.map(function (point) {
      return point.x + ',' + point.y;
    });

    var ind = 0;
    var px, py = 0;
    BezierCurveBrush.startCurve(px, py, false, false, false, false, false, false, px, py, 0, 0);

    for (var dpts in optimizedPoints) {

      ind++;
      px = optimizedPoints[dpts].x;
      py = optimizedPoints[dpts].y;
      BezierCurveBrush.draw(optimizedPoints[dpts].x, optimizedPoints[dpts].y, false, false, false, false, false, false, optimizedPoints[dpts].x, optimizedPoints[dpts].y, 0, 0);


    }
    var polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttributeNS(null, 'points', pointsString.trim());

    var svg = document.querySelector('#svg2');
    svg.appendChild(polyline);
    svg.setAttribute('viewBox', '0 0 ' + resultWidth + ' ' + resultHeight);
    svg.setAttribute('style', 'width:' + imageWidth + 'px');
  }

  function animate() {

    var polylines = document.querySelectorAll('#svg2 polyline');
    [].forEach.call(polylines, function (polyline, index) {
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

    setTimeout(function () {

      var img_dataurl = scanvas.toDataURL("image/png");
      var svg = document.querySelector('#svg2');

      var polylines = document.querySelectorAll('#svg2 polyline');
      if (polylines.length) {
        for (var i = 0; i < polylines.length; i++) {
          polylines[i].parentNode.removeChild(polylines[i]);
        }
      }

      importCanvas(scanvas, svg);
     
      document.querySelector('.container img').style.opacity = 0;
      document.querySelector('.container svg').style.opacity = 1;
      
      $("#stat").fadeOut();

      NProgress.done();
    }, 2000);
  }

});

