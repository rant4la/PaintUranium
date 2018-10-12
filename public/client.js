var socket = io.connect('localhost:8080')

//ELEMENTS
var paintCanvas;
var loadingText;

var redSlider;
var blueSlider;
var greenSlider;

var sizeSlider;
var sizeText;


var imageLoadedForFirstTime = false;

var paintImage;
var context;

var mouseLocX;
var mouseLocY;

var brushColor;
var brushSize = 30;

var mouseDrawTimer;
var mouseDrawUpdatesPerSecond = 60;

var windowUpdateTimer;
var windowUpdatesPerSecond = 60;

function load() {
    //ELEMENTS
    paintCanvas = document.getElementById('paintCanvas');
    context = paintCanvas.getContext('2d');

    loadingText = document.getElementById('loadingText');

    redSlider = document.getElementById("redSlider");
	blueSlider = document.getElementById("blueSlider");
    greenSlider = document.getElementById("greenSlider");
    
    sizeSlider = document.getElementById("sizeSlider");
    sizeText = document.getElementById("sizeText");

    //IMAGE
    paintImage = new Image();

    //LISTENERS
    paintCanvas.addEventListener('mousedown', function() {
        mouseTimer = setInterval(mouseDraw, 1000 / mouseDrawUpdatesPerSecond);
    });

    paintCanvas.addEventListener('mouseup', function() {
        clearInterval(mouseTimer);
    })

    paintCanvas.addEventListener('mousemove', function(event) {
        mouseLocX = event.clientX - paintCanvas.offsetLeft;
        mouseLocY = event.clientY - paintCanvas.offsetTop;
    });

    windowUpdateTimer = setInterval(updateColorPicker, 1000 / windowUpdatesPerSecond);

    //GETS THE WHOLE IMAGE WHEN JOINS
    socket.emit('clientGetImage', {});
}

function updateColorPicker() {
    brushColor = intToHex(redSlider.value) + intToHex(greenSlider.value) + intToHex(blueSlider.value);

    brushSize = sizeSlider.value;
    sizeText.innerHTML = "Brush Size: " + brushSize;

	var colorPreview = document.getElementById("colorPreview");
	var context = colorPreview.getContext("2d");
	
	context.fillStyle = '#' + brushColor;
    context.fillRect(0, 0, colorPreview.width, colorPreview.height);
}

function mouseDraw() {
    //DRAWS THE PIXEL TO OWN CANVAS BECOUSE THE SERVER WON'T SEND IT TO THE SENDER
    context.fillStyle = '#' + brushColor;
    context.fillRect(mouseLocX - brushSize / 2, mouseLocY - brushSize / 2, brushSize, brushSize);

    //SENDS THE PIXEL TO THE SERVER
    socket.emit('clientDraw', {
        x: mouseLocX - brushSize / 2,
        y: mouseLocY - brushSize / 2,
        color: brushColor,
        size: brushSize
    })
    
}

socket.on('serverDraw', function(data) {
    var clr = data.color.split(",");

    context.fillStyle = '#' + data.color;
    context.fillRect(data.x, data.y, data.size, data.size);
});

socket.on('serverImage', function(data) {
    for(var y = 0; y < 600; y++) {
        for(var x = 0; x < 600; x++) {
            var hexColor = data.image[x][y];

            context.fillStyle = '#' + hexColor;
            context.fillRect(x, y, 1, 1);
        }
    }

    if(!(imageLoadedForFirstTime)) {
        imageLoadedForFirstTime = true;
        loadingText.style.display = 'none';
        paintCanvas.style.display = 'block';
    }
});

function intToHex(int) {
    return parseInt(int).toString(16).padStart(2, " ");
}