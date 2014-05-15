var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    nunjucks = require('nunjucks'),
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

var usernames = {};
var anon_users = 0;
var emotes = {
    ':angry:': {
        'image': 'angry.gif'
    },
    ':hi:': {
        'image': 'hi.gif'
    },
    ':sigh:': {
        'image': 'sigh.gif'
    },
    ':smirk:': {
        'image': 'smirk.gif'
    }
};

function generate_img_string (arg) {
    var str = "<img src='/custom/images/" + emotes[arg]['image'] + "'";
    if('height' in emotes[arg]) {
        str += "style='height:" + emotes[arg]['height'] + "px; padding-bottom:" +
                        emotes[arg]['height']/10 + "px;'";
    }
    str += ">";
    return str;
}

io.set('log level', 1);
io.sockets.on('connection', function (socket) {

    anon_users += 1;
    io.sockets.emit('updateusers', {'usernames':usernames, 'anon': anon_users});

    // Broadcasts the message sent to all users after escaping it
    socket.on('sendchat', function (data) {
        if(socket.username == null) {
            socket.emit('server-message', 'You are not connected.');
        } else if (data == '/help') {
            var help_message = 'This is the help message. Only you can see this.<br />Emotes :<br />';
            for (var key in emotes) {
                help_message += generate_img_string(key) + " " + key + "&nbsp;&nbsp;";
            };
            help_message += '<br />Commands :<br />/dash : Launches a wild pony over the screen of everyone !';
            socket.emit('server-message', help_message);
        } else if (data == '/dash') {
            io.sockets.emit('dash');
            io.sockets.emit('server-message', socket.username + ' launches a wild pony !');
        }else {
            var data = validator.escape(data);
            for(var key in emotes) {
                if(data.indexOf(key) != -1) {
                    var re = new RegExp(key,"g");
                    data = data.replace(re, generate_img_string(key));
                }
            };
            io.sockets.emit('updatechat', socket.username, data);
        }
    });

    // Adding the user and support nickname changing
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
                socket.emit('server-message', 'Now connected as ' + new_username + ' (/help for commands)');
                socket.emit('connection-success');
                socket.broadcast.emit('server-message', new_username + ' is now connected');
                anon_users -= 1;
            }
            socket.username = new_username;
            usernames[new_username] = new_username;
            io.sockets.emit('updateusers', {'usernames':usernames, 'anon': anon_users});
        }
    });

    // Removing the user in case the websocket is closed
    socket.on('disconnect', function(){
        if(typeof socket.username != 'undefined') {
            delete usernames[socket.username];
            io.sockets.emit('updateusers', {'usernames':usernames, 'anon': anon_users});
            socket.broadcast.emit('server-message', socket.username + ' has disconnected');
        } else {
            anon_users -= 1;
        }
    });
});

// Simple route with websocket inside it
app.get('/', function(req, res) {
    res.render('index.html');
});

// Listening on port 8080
server.listen(8080, '0.0.0.0');