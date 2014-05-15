function scrollDown () {
    var objDiv = document.getElementById('toscroll');
    objDiv.scrollTop = objDiv.scrollHeight;
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
    if(!isActive && document.title != "[New] Unicorn Chat") document.title = "[New] Unicorn Chat";
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
    socket.on('dash', function() {
        current_dash += 1
        var this_dash = current_dash;
        $('body').append('<img id="dash_'+ this_dash +
                         '" src="/custom/images/rdash.gif" style="position: absolute; bottom:' +
                         Math.floor((Math.random() * windowHeight) + 1) + 'px;">');
        $("#dash_" + this_dash).animate({
            left: windowWidth
        }, 5000, function() {
            $('#dash_' + this_dash).remove();
        });
    });

});