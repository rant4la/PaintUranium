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
initImage();
//CHAT
var chatText = [];

//SOCKET INFO
var usernames = {};
usernames[0] = '[SERVER]'
//ADMINS
var correctAdminPassword = '';
var adminSocketIDs = [];
//ADMIN COMMANDS
var resetChat ='/resetChat';
var resetImage = '/resetImage'

//USERNAMES THAT ARE FORBIDDEN:
var bannedUsernames = ['server', 'admin', 'mati', 'rant', 'urani'];

//TIME
var time = new Date();

io.on('connection', function(socket) {
    console.log('User connected with socket id:', socket.id);
    usernames[socket.id] = '';
    
    //LOGIN
    socket.on('clientLogin', function(data) {
        //IF ADMIN PASSWORD IS DEFINED CHECKS IF IT IS CORRECT AND GIVES ADMIN PERMISSION
        if(data.adminPassword) {
            if(data.adminPassword === correctAdminPassword && data.username) {
                //LOGS IN AS ADMIN
                adminSocketIDs.push(socket.id);
                usernames[socket.id] = '[ADMIN] ' + data.username;
                socket.emit('serverLoginSuccessful', {});
                chatMessageAll(0, usernames[socket.id] + ' joined as admin, this is epic!')
                return;
            } else {
                socket.emit('serverLoginFailed', {
                    reason: "Are you really an admin?"
                });
                return;
            }
        }

        //ALLOWED LENGHT
        if(data.username.length < 6 || data.username.length > 20) {
            socket.emit('serverLoginFailed', {
                reason: "Username must be 6-20 characters long."
            });
            return;
        }
        //CHECKS IF USERNAME IS BANNED
        for(var i = 0; i < bannedUsernames.length; i++) {
            if(data.username.toLowerCase().includes(bannedUsernames[i].toLowerCase())) {
                socket.emit('serverLoginFailed', {
                    reason: "That username is banned."
                });
                return;
            }
        }

        //CHECKS IF NO USER WITH SAME USERNAME AND ALSO THAT IT IS CORRECT LENGHT
        var clientIDs = Object.keys(io.engine.clients)
        for(var i = 0; i < clientIDs.length; i++) {   
            if(usernames[clientIDs[i]] && usernames[clientIDs[i]] === data.username) {
                socket.emit('serverLoginFailed', {
                    reason: "That username is already in use."
                });
                return;
            }
        }
        //REGISTER
        usernames[socket.id] = data.username;
        socket.emit('serverLoginSuccessful', {});
        chatMessageAll(0, usernames[socket.id] + ' joined')
        
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
        if(parseInt(data.size) > 30) {
            //IF THE CLIENT SENDS DRAW WITH BIGGER RADIUS THAN ALLOWED IGNORES IT
            return;
        }
        //SAVES THE DRAW TO SERVER SIDE
        fillRectangle(parseInt(data.x), parseInt(data.y), parseInt(data.size), data.color);   
        io.sockets.emit('serverDraw', {
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
        if(data.message.length > 500) {
            socket.emit('serverMessageFailed', {
                reason: 'That message is too long! Max allowed lenght is 500 characters.'
            });
        } else {
            chatMessageAll(socket.id, data.message);
        }
        //CHECKS COMMANDS
        if(isAdmin(socket.id)) {
            executeCommand(data.message);
        }
    });

});

function chatMessageAll(socketID, message) {
    var senderColor;
    if(socketID == 0 || isAdmin(socketID)) {
        senderColor = 'red'
    } else {
        senderColor = '#5aad7e';
    }
    var line = '<span style="color:' + senderColor + ';">[' + time.getHours() + ':' + time.getMinutes() + '] ' + usernames[socketID] + '</span>: ' + message;
    chatText.push(line);
    io.sockets.emit('serverChatMessage', {
        message: line
    });
}
//ADMIN
function isAdmin(socketID) {
    for(var i = 0; i < adminSocketIDs.length; i++) {
        if(socketID === adminSocketIDs[i]) {
            return true;
        }
    }
    return false;
}
function executeCommand(command) {
    if(command === resetImage) {
        initImage();
        io.sockets.emit('serverImage', {
            image: paintImage
        });
        chatMessageAll(0, 'Image reset complete')
    } else if(command === resetChat) {
        var lastCommand = chatText[chatText.length - 1];
        chatText = [];
        chatText.push(lastCommand);
        io.sockets.emit('serverChat', {
            chatArray: chatText
        });
        chatMessageAll(0, 'Chat reset complete')
    }
}

//IMAGE
function initImage() {
    for(var y = 0; y <= 600; y++) {
        for(var x = 0; x <= 600; x++) {
            paintImage[x][y] = '000000';
        }
    }
}
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