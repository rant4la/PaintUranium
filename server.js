var express = require('express');
var socket = require('socket.io');

var serverPort = 8080;

//APP SETUP
var app = express();
var server = app.listen(8080, function() {
	console.log("Server started on port: " + serverPort)
});
app.use(express.static('public'));

//SOCKET SETUP
var io = socket(server);

//INITS IMAGE
var paintImage = [];
for(var i = 0; i <= 600; i++) {
    paintImage[i] = [];
}
for(var y = 0; y <= 600; y++) {
    for(var x = 0; x <= 600; x++) {
        paintImage[x][y] = '000000';
    }
}
//CHAT
var chatText = [];

//SOCKET INFO
var usernames = {};


io.on('connection', function(socket) {
    console.log('User connected with socket id:', socket.id);
    usernames[socket.id] = '';
    
    //LOGIN
    socket.on('clientLogin', function(data) {
        if(data.username.length < 6) {
            socket.emit('serverLoginFailed', {
                reason: "Username must be atleast 6 characters long"
            });
            return;
        }
        //CHECKS IF NO USER WITH SAME USERNAME AND ALSO THAT IT IS CORRECT LENGHT
        var sameUsernameFound = false;

        var clientIDs = Object.keys(io.engine.clients)
        for(var i = 0; i < clientIDs.length; i++) { 
            
            if(usernames[clientIDs[i]] && usernames[clientIDs[i]] === data.username) {
                sameUsernameFound = true;
                break;
            }
        }
        if(sameUsernameFound) {
            socket.emit('serverLoginFailed', {
                reason: "That username is already in use"
            });
        } else {
            usernames[socket.id] = data.username;
            socket.emit('serverLoginSuccessful', {});
            console.log(usernames[socket.id], 'joined game');
        }
    });
    socket.on('clientGetUsername', function(data) {
        socket.emit('serverUsername', {
            username: socket.username
        });
    });

    //IMAGE
    socket.on('clientGetImage', function(data) {
        socket.emit('serverImage', {
            image: paintImage
        });
    });
    socket.on('clientDraw', function(data) {
        //SAVES THE DRAW TO SERVER SIDE
        fillRectangle(parseInt(data.x), parseInt(data.y), parseInt(data.size), data.color);   
        
        //BROADCASTS THE NEW DRAW TO ALL SOCKETS EXCEPT SENDING
        socket.broadcast.emit('serverDraw', {
            x: data.x,
            y: data.y,
            color: data.color,
            size: data.size
        });
    });

    //CHAT
    socket.on('clientGetChat', function(data) {
        //RESPONSES TO CLIENT CHAT REQUEST
        socket.emit('serverChat', {
            chatArray: chatText
        });
    });
    socket.on("clientChatMessage", function(data) {
        var line = '[' + usernames[socket.id] + '] ' + data.message;
        chatText.push(line);
        socket.broadcast.emit('serverChatMessage', {
            message: line
        });
    });

});

function fillRectangle(x, y, size, color) {
    var minX = x;
    var minY = y;
    var maxX = x + size;
    var maxY = y + size;

    if(minX < 0) {
        minX = 0;
    } else if(maxX > 600) {
        maxX = 600;
    }
    if(minY < 0) {
        minY = 0;
    } else if(maxY > 600) {
        maxY = 600;
    }

    for(var y = minY; y < maxY; y++) {
        for(var x = minX; x < maxX; x++) {
            paintImage[x][y] = color;
        }
    }
}

function intToHex(int) {
    return parseInt(int).toString(16).padStart(2, " ");
}