function scrollDown () {
    var objDiv = document.getElementById('toscroll');
    objDiv.scrollTop = objDiv.scrollHeight;
}

function titleNotify(isActive) {
    if(!isActive && document.title != "[New] Unicorn Chat") document.title = "[New] Unicorn Chat";
}

var isActive;
window.onfocus = function () { isActive = true; document.title = "Unicorn Chat"; };
window.onblur = function () { isActive = false; };

var socket = io.connect(window.location.protocol+'//'+window.location.hostname+':'+window.location.port);

socket.on('updatechat', function (username, data) {
    var d = new Date();
    $('#conversation').append(
        '<li class="left"><div class="chat-body"><p>['
        + d.getHours() + ':' + (d.getMinutes()<10?'0':'') + d.getMinutes() + '] ' + username + ' > ' + data
        + '</p></div></li>'
    );
    if(!isActive && document.title != "[New] Unicorn Chat") document.title = "[New] Unicorn Chat";
    scrollDown();
});

socket.on('server-message', function(data) {
    $('#conversation').append('<p>'+ data + '</p>');
    titleNotify(isActive);
    scrollDown();
});

socket.on('connection-success', function() {
    $('#nickname-send').html('Change');
    $('#data').show();
    $('#activate-browser-notifications').show();
});

socket.on('error', function (data) {
    $('#error-message').text(data);
    $('#error-message').show();
    setTimeout(function() {
        $('#error-message').fadeOut(500);
    }, 2000);
});

socket.on('updateusers', function(data) {
    $('#users').empty();
    $.each(data['usernames'], function(key, value) {
        $('#users').append('<div>' + key + '</div>');
    });
    $('#users').append('<div>Anonymous users : ' + data['anon'] + '</div>');
});

socket.on('disconnect', function() {
    $('#data').hide();
    $('#activate-browser-notifications').hide();
    $('#nickname-send').html('Connect');
    $('#conversation').append('<p>You\'re disconnected.</p>');
    titleNotify(isActive);
});

$(function(){
    $('#data').keypress(function(e) {
        if(e.which == 13) {
            var message = $('#data').val();
            if(message != '') {
                $('#data').val('');
                socket.emit('sendchat', message);
            }
        }
    });

    $('#nickname-send').click(function() {
        socket.emit('adduser', $('#nickname-input').val());
        $('#nickname-input').val('');
    });

    $('#nickname-input').keypress(function(e) {
        if(e.which == 13) {
            socket.emit('adduser', $('#nickname-input').val());
            $('#nickname-input').val('');
        }
    });

    $('#data').hide();
    $('#activate-browser-notifications').hide();

    var windowWidth = $(document).width();
    var windowHeight = $(document).height();
    var current_dash = 0;

    function launchPony () {
        current_dash += 1;
        var this_dash = current_dash;
        var image = "/custom/images/rdash.gif";
        var position = Math.floor((Math.random() * 90) + 1);
        $('body').append(
            '<img id="dash_'+ this_dash + '" src="' + image + '" style="position: absolute; bottom:' + position + 'px; left:-100px;z-index:-' + position + ';">'
        );
        $('#dash_' + this_dash).animate({left: windowWidth}, 5000, function() {
            $('#dash_' + this_dash).remove();
        });
    }

    socket.on('dash', function() {
        launchPony();
    });

    socket.on('dashrain', function() {
        for (var i = 20; i >= 0; i--) {
            var wait = Math.random() * 10000;
            setTimeout(function() {
                launchPony();
            }, wait);
        };
    });
});