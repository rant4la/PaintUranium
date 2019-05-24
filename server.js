//CHANGE THIS PASSWORD!!!!
var correctAdminPassword = 'abc';

var express = require('express');
var socket = require('socket.io');

var serverPort = 80;

//APP SETUP
var app = express();
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

var server = app.listen(serverPort, function() {
	console.log("Server started on port: " + serverPort)
});
app.use(express.static('public'));

//SOCKET SETUP
var io = socket(server);

//IMAGE
var paintImage = [];
for(var i = 0; i <= 600; i++) {
    paintImage[i] = [];
}
initImage();

//CHAT
var chatText = [];
var usernames = {};
usernames[0] = '[SERVER]'
var scores = {};
//USERNAMES THAT ARE FORBIDDEN:
var bannedUsernames = ['server', 'admin', 'mati', 'rant', 'urani', ' '];
var scoreboardUpdatesPerSecond = 1;

//ADMIN
var adminSocketIDs = [];
var resetChat ='/resetChat';
var resetImage = '/resetImage'

io.on('connection', function(socket) {
    console.log('User connected with socket id:', socket.id);
    //RESETS SOCKET INFO WHEN JOINS
    usernames[socket.id] = null;
    scores[socket.id] = 0;

    socket.on('disconnect', function() {
        //CLEARS SOCKET FROM USERNAMES
        chatMessageAll(0, usernames[socket.id] + ' left')
        updateScoreboard()
    });

    //LOGIN
    socket.on('clientLogin', function(data) {
        //IF ADMIN PASSWORD IS DEFINED CHECKS IF IT IS CORRECT AND GIVES ADMIN PERMISSION
        if(data.adminPassword) {
            if(data.adminPassword === correctAdminPassword && data.username) {
                //LOGS IN AS ADMIN
                adminSocketIDs.push(socket.id);
                usernames[socket.id] = '[ADMIN] ' + data.username;
                socket.emit('serverLoginSuccessful', {
                    username: usernames[socket.id],
                    color: getUsernameColor(socket.id)
                });
                chatMessageAll(0, usernames[socket.id] + ' joined as admin, this is epic!')
                updateScoreboard()
                return;
            } else {
                socket.emit('serverLoginFailed', {
                    reason: "Are you really an admin?"
                });
                return;
            }
        }

        //ALLOWED LENGHT
        if(data.username.length < 4 || data.username.length > 20) {
            socket.emit('serverLoginFailed', {
                reason: "Username must be 4-20 characters long."
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
        var usernameIDs = Object.keys(usernames);
        for(var i = 0; i < usernameIDs.length; i++) {   
            if(usernames[usernameIDs[i]] && usernames[usernameIDs[i]] === data.username) {
                socket.emit('serverLoginFailed', {
                    reason: "That username is already in use."
                });
                return;
            }
        }
        //LOGIN
        usernames[socket.id] = data.username;
        socket.emit('serverLoginSuccessful', {
            username: usernames[socket.id],
            color: getUsernameColor(socket.id)
        });
        chatMessageAll(0, usernames[socket.id] + ' joined')
        updateScoreboard();
    });

    //IMAGE
    socket.on('clientGetImage', function(data) {
        //IF NOT LOGGED IN DOESN'T RESPONSE
        if(!(usernames[socket.id])) { return;};

        socket.emit('serverImage', {
            image: paintImage
        });
    });
    socket.on('clientDraw', function(data) {
        //IF NOT LOGGED IN DOESN'T RESPONSE
        if(!(usernames[socket.id])) { return;};

        if(data.color.toString().length < 3) {
            //CUSTOM BRUSHES DON'T HAVE 6 LETTERS LIKE HEX COLORS
            paintImage[parseInt(data.x)][parseInt(data.y)] = data.color;
            io.sockets.emit('serverDraw', {
                x: data.x,
                y: data.y,
                color: data.color,
            });
        } else {
            //NORMAL BRUSH
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
        }

        
        //INCREASES SCORE WHEN PAINTS
        scores[socket.id] += 10;
    });

    //CHAT
    socket.on('clientGetChat', function(data) {
        //IF NOT LOGGED IN DOESN'T RESPONSE
        if(!(usernames[socket.id])) { return;};

        //RESPONSES TO CLIENT CHAT REQUEST
        socket.emit('serverChat', {
            chatArray: chatText
        });
    });
    socket.on("clientChatMessage", function(data) {
        //IF NOT LOGGED IN DOESN'T RESPONSE
        if(!(usernames[socket.id])) { return;};

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
//SCOREBOARD
var scoreboardTimer = new setInterval(updateScoreboard, 1000 / scoreboardUpdatesPerSecond);
function updateScoreboard() {
    var usernameHTML = [];
    var scoreHTML = []

    var sortedUsers = (Object.keys(scores).sort(function(a,b){return scores[a]-scores[b]})).reverse();
    for(var i = 0; i < sortedUsers.length; i++) {
        if(usernames[sortedUsers[i]]) {
            usernameHTML.push('<span style="color:' + getUsernameColor(sortedUsers[i]) + '">' + usernames[sortedUsers[i]] + '</span>');
            scoreHTML.push(scores[sortedUsers[i]]);
        }
    }
    io.sockets.emit('serverScoreboard', {
        usernames: usernameHTML,
        scores: scoreHTML
    });
}

//CHAT
function chatMessageAll(socketID, message) {
    var time = new Date();
    var line = '<span style="color:' + getUsernameColor(socketID) + ';">[' + time.getHours().toString().padStart(2, '0') + ':' + time.getMinutes().toString().padStart(2, '0') + '] ' + usernames[socketID] + '</span>: ' + message;
    chatText.push(line);
    io.sockets.emit('serverChatMessage', {
        message: line
    });
}
function getUsernameColor(socketID) {
    if(socketID == 0) {
        return 'yellow';
    } else if(isAdmin(socketID)) {
        return 'red';
    } else {
        return '#8cb8ff';
    }
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
            paintImage[x][y] = '777777';
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
