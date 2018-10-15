var socket = io.connect('localhost:8080')

//ELEMENTS
var paintCanvas;
var loadingText;

var redSlider;
var blueSlider;
var greenSlider;

var sizeSlider;
var sizeText;

var chatTextArea;
var sendMessageButton;
var messageTextArea;
var usernameTextArea;

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

    chatTextArea = document.getElementById("chat");
    messageTextArea = document.getElementById("message");
    usernameTextArea = document.getElementById("username");

    sendMessageButton = document.getElementById("sendMessageButton");

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

    sendMessageButton.onclick = function() {
        chatTextArea.value += '[' + usernameTextArea.value + '] ' + messageTextArea.value + "\n";

        socket.emit('clientChat', {
            username: usernameTextArea.value,
            message: messageTextArea.value
        })
    }

    windowUpdateTimer = setInterval(updateColorPicker, 1000 / windowUpdatesPerSecond);

    //GETS THE WHOLE IMAGE WHEN JOINS
    socket.emit('clientGetImage', {});
    //GETS ALL THE CHAT MESSAGES WHEN JOINS
    socket.emit('clientGetChat', {});
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
    var rectLocX = Math.round(mouseLocX - brushSize / 2);
    var rectLocY = Math.round(mouseLocY - brushSize / 2);

    //DRAWS THE PIXEL TO OWN CANVAS BECOUSE THE SERVER WON'T SEND IT TO THE SENDER
    context.fillStyle = '#' + brushColor;
    context.fillRect(rectLocX, rectLocY, brushSize, brushSize);

    //SENDS THE PIXEL TO THE SERVER
    socket.emit('clientDraw', {
        x: rectLocX,
        y: rectLocY,
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

socket.on('serverChat', function(data) {
    chatTextArea.value = '';
    for(var i = 0; i < data.chat.length; i++) {
        chatTextArea.value += data.chat[i] + "\n";
    }
});

function intToHex(int) {
    return parseInt(int).toString(16).padStart(2, "0");
}