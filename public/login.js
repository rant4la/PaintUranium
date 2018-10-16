//CONNECTS TO SERVER TO CHECK THAT THERE ARE NO SAME USERNAMES
if(socket == null) {
    var socket = io.connect('localhost:8080')
}

function load() {

    document.getElementById("loginButton").addEventListener("click", function(){
        var username = document.getElementById('usernameInput').value

        if(username) {
            socket.emit('clientLogin', {
                username: username
            })
        } else {
            document.getElementById('invalidLoginText').innerHTML = "Username cannot be empty";
        }
        
    }); 

}

socket.on('serverLoginFailed', function(data) {
    document.getElementById('invalidLoginText').innerHTML = data.reason;
});

socket.on('serverLoginSuccessful', function(data) {
    document.getElementById('invalidLoginText').innerHTML = "Login successful";
    window.location = 'http://localhost:8080/index.html';
});