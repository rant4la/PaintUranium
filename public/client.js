//SOCKET
var socket = io.connect('localhost:8080')

//ELEMENTS
var paintCanvas;
var context;

//MOUSE
var mouseLocX;
var mouseLocY;

//DRAW
var brushColor;
var brushSize;

var mouseDrawTimer;
var mouseDrawUpdatesPerSecond = 60;

//WINDOW
var windowUpdateTimer;
var windowUpdatesPerSecond = 30;

//LOGIN
var loggedIn = false

function load() {
    //CHECKS IF SERVER HAS SOCKETS USERNAME, IF NOT SHOWS LOGIN
    socket.emit('clientGetUsername', {});

    //LOGIN
    document.getElementById("loginButton").addEventListener("click", function(){
        login()
    }); 
    document.getElementById("usernameInput").addEventListener("keyup", function(event){
        if(event.keyCode === 13) {
            login();
        }   
    }); 

    //CANVAS AND ITS LISTENERS
    paintCanvas = document.getElementById('paintCanvas');
    context = paintCanvas.getContext('2d');
    paintCanvas.addEventListener('mousedown', function() {
        mouseTimer = setInterval(mouseDraw, 1000 / mouseDrawUpdatesPerSecond);
    });
    paintCanvas.addEventListener('mouseup', function() {
        clearInterval(mouseTimer);
    })
    paintCanvas.addEventListener('mousemove', function(event) {
        var position = paintCanvas.getBoundingClientRect()
        mouseLocX = event.clientX - position.left;
        mouseLocY = event.clientY - position.top;
    });

    //CHAT AND ITS LISTENERS
    document.getElementById("sendMessageButton").addEventListener("click", function(){
        sendMessage();
    });
    document.getElementById("messageTextBox").addEventListener("keyup", function(event){
        if(event.keyCode === 13) {
            sendMessage();
        }
    });
    socket.emit('clientGetChat', {});

    //WINDOW
    windowUpdateTimer = setInterval(windowUpdate, 1000 / windowUpdatesPerSecond);
}

function windowUpdate() {
    brushColor = document.getElementById("brushColorInput").value.substring(1,7);
    brushSize = document.getElementById("brushSizeInput").value;
    document.getElementById("brushInfo").innerHTML = "Color: " + brushColor + " Size: " + brushSize;
}

//LOGIN
socket.on('serverUsername', function(data) {
    if(data.username) {
        setLoggedIn(true);
    } else {
        setLoggedIn(false);
    }
});
socket.on('serverLoginFailed', function(data) {
    document.getElementById('invalidLoginText').innerHTML = data.reason;
});
socket.on('serverLoginSuccessful', function(data) {
    setLoggedIn(true);
});
function setLoggedIn(value) {
    loggedIn = value;
    if(value) {
        //REGUESTS THE WHOLE IMAGE
        socket.emit('clientGetImage', {});
        document.getElementById('websiteForm').style.display = "block";
        document.getElementById('loginForm').style.display = "none";

        document.getElementById('loginInfoText').innerHTML = "Logged in as: " + document.getElementById('usernameInput').value;
    } else {
        document.getElementById('websiteForm').style.display = "none";
        document.getElementById('loginForm').style.display = "block";

        document.getElementById('loginInfoText').innerHTML = "Not logged in";
    }
}
function login() {
    var username = document.getElementById('usernameInput').value
    if(username) {
        socket.emit('clientLogin', {
            username: username
        });
    } else {
        document.getElementById('invalidLoginText').innerHTML = "Username cannot be empty";
    }
}

//DRAW
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
});

//CHAT
socket.on('serverChatMessage', function(data) {
    document.getElementById('chatTextArea').value += data.message + "\n";
});
socket.on('serverChat', function(data) {
    document.getElementById('chatTextArea').value = '';
    for(var i = 0; i < data.chatArray.length; i++) {
        document.getElementById('chatTextArea').value += data.chatArray[i] + "\n";
    }
});
function sendMessage() {
    var message = document.getElementById("messageTextBox").value;
    document.getElementById("messageTextBox").value = '';
    document.getElementById("chatTextArea").value += '[' + document.getElementById('usernameInput').value + '] ' + message + '\n';
    if(message) {
        socket.emit('clientChatMessage', {
            message: message
        });
    }  
}



function intToHex(int) {
    return parseInt(int).toString(16).padStart(2, "0");
}

