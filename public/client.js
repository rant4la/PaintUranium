//CHANGE THIS ADDRESS!!!!!
var socket = io.connect('localhost:8080')

//ELEMENTS
var paintCanvas;
var context;

//MOUSE
var mouseLocX;
var mouseLocY;

//DRAW
var brushColor;
var colorInputChanged = 'temp';
var brushSize;

var mouseDrawTimer;
var mouseDrawUpdatesPerSecond = 60;

//WINDOW
var windowUpdateTimer;
var windowUpdatesPerSecond = 30;

//LOGIN
var loggedIn = false;
var adminLogin = false;

//CUSTOM BRUSHES
var customBrushes = [];
var brushNames = ["jrola", "battus", "koppar", "mika", "pitknen"];
var customBrushSize = 32;
for(var i = 0; i < 10; i++) {
    customBrushes[i] = new Image();
    customBrushes[i].src = "brushes/" + brushNames[i] + ".png";
}

function load() {
    //LOGIN
    setLoggedIn(false);
    document.getElementById("loginButton").addEventListener("click", function(){
        login()
    }); 
    document.getElementById("usernameInput").addEventListener("keyup", function(event){
        if(event.keyCode === 13) {
            login();
        }   
    }); 
    document.getElementById("adminPasswordInput").addEventListener("keyup", function(event){
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
    document.getElementById("logoutButton").addEventListener("click", function(){
        location.reload();
    });

    //CANVAS AND ITS LISTENERS
    paintCanvas = document.getElementById('paintCanvas');
    context = paintCanvas.getContext('2d');
    paintCanvas.addEventListener('mousedown', function() {
        mouseTimer = setInterval(mouseDraw, 1000 / mouseDrawUpdatesPerSecond);
    });
    paintCanvas.addEventListener('mouseup', function() {
        clearInterval(mouseTimer);
    });
    //IF MOUSE EXITS CANVAS RESETS MOUSE TIMER TO FIX LEAVING ON BUG
    paintCanvas.addEventListener('mouseout', function() {
        clearInterval(mouseTimer);
        console.log("mouseout");
    })
    paintCanvas.addEventListener('mousemove', function(event) {
        var position = paintCanvas.getBoundingClientRect()
        mouseLocX = event.clientX - position.left;
        mouseLocY = event.clientY - position.top;
    });

    //CUSTOM BRUSHES
    document.getElementById("normalBrushButton").addEventListener("click", function() {brushColor = document.getElementById("brushColorInput").value.substring(1,7);}); 
    document.getElementById("brushButton0").addEventListener("click", function() {brushColor = 0; }); 
    document.getElementById("brushButton1").addEventListener("click", function() {brushColor = 1; }); 
    document.getElementById("brushButton2").addEventListener("click", function() {brushColor = 2; }); 
    document.getElementById("brushButton3").addEventListener("click", function() {brushColor = 3; }); 
    document.getElementById("brushButton4").addEventListener("click", function() {brushColor = 4; }); 

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

    //FOCUS
    document.getElementById("usernameInput").focus();
}

function windowUpdate() {
    if(document.getElementById("brushColorInput").value.substring(1,7) !== colorInputChanged) {
        brushColor = document.getElementById("brushColorInput").value.substring(1,7);
        colorInputChanged = brushColor;

        document.getElementById("normalBrushButton").style.backgroundColor = '#' + brushColor;
    }   

    brushSize = document.getElementById("brushSizeInput").value;

    if(brushColor.toString().length < 3) {
        document.getElementById("brushInfo").innerHTML = "Color: " + brushNames[brushColor]
    } else {
        document.getElementById("brushInfo").innerHTML = "Color: " + brushColor + " Size: " + brushSize;
    }
    
    if(document.getElementById("automaticScroll").checked) {
        var chatTextDiv = document.getElementById("chatTextDiv")
        chatTextDiv.scrollTop = chatTextDiv.scrollHeight;
    }
}

//DISCONNECT
socket.on('disconnect', function() {
    document.getElementById('invalidLoginText').innerHTML = 'Connection lost to the server';
    setLoggedIn(false);
});

//LOGIN
socket.on('serverLoginFailed', function(data) {
    document.getElementById('invalidLoginText').innerHTML = data.reason;
    setLoggedIn(false);
});
socket.on('serverLoginSuccessful', function(data) {
    document.getElementById('loginInfoText').innerHTML = "Logged in as: " + data.username;
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

        document.getElementById('logoutButton').style.display = "block";
    } else {
        //SHOWS ONLY THE LOGIN FORM
        document.getElementById('websiteForm').style.display = "none";
        document.getElementById('loginForm').style.display = "block";

        document.getElementById('loginInfoText').innerHTML = "Not logged in";
        document.getElementById('logoutButton').style.display = "none";
        //RESETS FIELDS
        document.getElementById('usernameInput').value = '';
        document.getElementById('adminPasswordInput').value = '';
    }
}
function login() {
    var username = document.getElementById('usernameInput').value;
    var adminPassword;
    if(adminLogin) {
        adminPassword = document.getElementById('adminPasswordInput').value;
        if(!(adminPassword)) {
            document.getElementById('invalidLoginText').innerHTML = "Admin password cannot be empty";
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

    //CUSTOM BRUSH
    if(brushColor.toString().length < 3) {
        socket.emit('clientDraw', {
            x: mouseLocX,
            y: mouseLocY,
            color: brushColor
        });
    } else {
        //NORMAL BRUSH
        var rectLocX = Math.round(mouseLocX - brushSize / 2);
        var rectLocY = Math.round(mouseLocY - brushSize / 2);

        socket.emit('clientDraw', {
            x: rectLocX,
            y: rectLocY,
            color: brushColor,
            size: brushSize
        });
    }
    
}
socket.on('serverDraw', function(data) {
    if(data.color.toString().length < 3) {
        //CUSTOM BRUSH
        context.drawImage(customBrushes[data.color], data.x - customBrushSize / 2, data.y - customBrushSize / 2); 
    } else {
        //NORMAL BRUSH
        context.fillStyle = '#' + data.color;
        context.fillRect(data.x, data.y, data.size, data.size);
    }
});
socket.on('serverImage', function(data) {
    //DRAWS NORMAL PIXELS FIRST SO THAT THEY DONT OVERLAP WITH CUSTOM BRUSHES
    for(var y = 0; y < 600; y++) {
        for(var x = 0; x < 600; x++) {
            var color = data.image[x][y];
            if(color.toString().length > 3) {
                context.fillStyle = '#' + color;
                context.fillRect(x, y, 1, 1); 
            }
        }
    }
    for(var y = 0; y < 600; y++) {
        for(var x = 0; x < 600; x++) {
            var color = data.image[x][y];
            if(color.toString().length < 3) {
                context.drawImage(customBrushes[color], x - customBrushSize / 2, y - customBrushSize / 2);
            }
        }
    }

});

//CHAT
socket.on('serverChat', function(data) {
    var chatHTML = ''
    for(var i = 0; i < data.chatArray.length; i++) {
        chatHTML += data.chatArray[i] + "<br>";
    }
    document.getElementById('chatText').innerHTML = chatHTML;
});
socket.on('serverChatMessage', function(data) {
    document.getElementById('chatText').innerHTML += data.message + "<br>";
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

//SCOREBOARD
socket.on('serverScoreboard', function(data) {
    document.getElementById('scoreboardTable').innerHTML = "<tr><th>Username</th><th>Score</th></tr>";
    for(var i = 0; i < data.usernames.length; i++) {
        document.getElementById('scoreboardTable').innerHTML += "<tr><th>" + data.usernames[i] + "</th><th>" + data.scores[i] + "</th></tr>"
    }
});

function intToHex(int) {
    return parseInt(int).toString(16).padStart(2, "0");
}

