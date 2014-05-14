var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    nunjucks = require('nunjucks'),
    events = require('events'),
    validator = require('validator'),
    compress = require('compression');

// Nunjucks configuration
nunjucks.configure('views', {
    autoescape: true,
    express: app
});

// Use the compress middleware to send gzipped content
app.use(compress());
app.use(express.static(__dirname + '/bower_components'));
app.use('/custom', express.static(__dirname + '/static'));

io.set('log level', 1);

var usernames = {};

io.sockets.on('connection', function (socket) {

    io.sockets.emit('updateusers', usernames);

    socket.on('sendchat', function (data) {
        if(socket.username == null) {
            socket.emit('server-message', 'You are not connected.');
        } else {
            io.sockets.emit('updatechat', socket.username, validator.escape(data));
        }
    });

    socket.on('adduser', function(username){
        if(username in usernames) {
            io.sockets.emit('error', 'This nickname is already taken.');
        } else if(username == 'null' || username == '') {
            io.sockets.emit('error', 'This is not a valid nickname.');
        } else {
            var new_username = validator.escape(username);
            if(socket.username in usernames) {
                delete usernames[socket.username];
                socket.emit('server-message', 'Now known as ' + new_username);
                socket.broadcast.emit('server-message', socket.username + ' is now known as ' + new_username);
            } else {
                socket.emit('server-message', 'Now connected as ' + new_username);
                socket.emit('connection-success');
                socket.broadcast.emit('server-message', new_username + ' is now connected');
            }
            socket.username = new_username;
            usernames[new_username] = new_username;
            io.sockets.emit('updateusers', usernames);
        }
    });

    socket.on('disconnect', function(){
        delete usernames[socket.username];
        io.sockets.emit('updateusers', usernames);
        socket.broadcast.emit('server-message', socket.username + ' has disconnected');
    });
});

// Simple route with websocket inside it
app.get('/', function(req, res) {
    res.render('index.html');
});

// Listening on port 8080
server.listen(8080, '0.0.0.0');