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
var loggedIn = false;
var adminLogin = false;

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
    document.getElementById("adminLoginButton").addEventListener("click", function(){
        if(adminLogin) {
            adminLogin = false;
            document.getElementById("adminPasswordInput").style.display = 'none';
            document.getElementById("adminLoginButton").innerHTML = 'I am admin';
        } else {
            adminLogin = true;
            document.getElementById("adminPasswordInput").style.display = 'inline-block';
            document.getElementById("adminLoginButton").innerHTML = 'I am not admin';
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

    //WINDOW
    windowUpdateTimer = setInterval(windowUpdate, 1000 / windowUpdatesPerSecond);
}

function windowUpdate() {
    brushColor = document.getElementById("brushColorInput").value.substring(1,7);
    brushSize = document.getElementById("brushSizeInput").value;
    document.getElementById("brushInfo").innerHTML = "Color: " + brushColor + " Size: " + brushSize;

    if(document.getElementById("automaticScroll").checked) {
        var chatTextDiv = document.getElementById("chatTextDiv")
        chatTextDiv.scrollTop = chatTextDiv.scrollHeight;
    }
}

//DISCONNECT
socket.on('disconnect', function() {
    alert('Connection lost');
    setLoggedIn(false);
});

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
        //REGUESTS THE WHOLE IMAGE AND CHAT
        socket.emit('clientGetChat', {});
        socket.emit('clientGetImage', {});
        
        document.getElementById('websiteForm').style.display = "block";
        document.getElementById('loginForm').style.display = "none";

        document.getElementById('loginInfoText').innerHTML = "Logged in as: " + document.getElementById('usernameInput').value;
    } else {
        //SHOWS ONLY THE LOGIN FORM
        document.getElementById('websiteForm').style.display = "none";
        document.getElementById('loginForm').style.display = "block";

        document.getElementById('loginInfoText').innerHTML = "Not logged in";
    }
}
function login() {
    if(!(socket.connected)) {
        alert('Connection lost');
        return;
    }

    var username = document.getElementById('usernameInput').value;
    var adminPassword;
    if(adminLogin) {
        adminPassword = document.getElementById('adminPasswordInput').value;
        if(!(adminPassword)) {
            document.getElementById('invalidLoginText').innerHTML = "Admin password cannot be empty.";
            return;
        } 
    } else {
        adminPassword = '';
    }
    if(username) {
        socket.emit('clientLogin', {
            username: username,
            adminPassword: adminPassword
        });
    } else {
        document.getElementById('invalidLoginText').innerHTML = "Username cannot be empty";
    }
}

//DRAW
function mouseDraw() {
    var rectLocX = Math.round(mouseLocX - brushSize / 2);
    var rectLocY = Math.round(mouseLocY - brushSize / 2);
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
    document.getElementById('chatText').innerHTML += data.message + "<br>";
});
socket.on('serverChat', function(data) {
    var chatHTML = ''
    for(var i = 0; i < data.chatArray.length; i++) {
        chatHTML += data.chatArray[i] + "<br>";
    }
    document.getElementById('chatTextDiv').innerHTML = '<p id="chatText">' + chatHTML + '</p>';
});
socket.on('serverMessageFailed', function(data) {
    document.getElementById('messageStateText').innerHTML = data.reason;
});
function sendMessage() {
    document.getElementById('messageStateText').innerHTML = '';
    var message = document.getElementById("messageTextBox").value;
    document.getElementById("messageTextBox").value = '';
    if(message) {
        socket.emit('clientChatMessage', {
            message: message
        });
    }  
}



function intToHex(int) {
    return parseInt(int).toString(16).padStart(2, "0");
}

