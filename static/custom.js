function scrollDown () {
    var objDiv = document.getElementById('toscroll');
    objDiv.scrollTop = objDiv.scrollHeight;
}

function titleNotify(isActive) {
    if(!isActive && document.title != "[New] Unicorn Chat") document.title = "[New] Unicorn Chat";
}

function errorNotify (message) {
    $('#error-message').text(message);
    $('#error-message').show();
    setTimeout(function() {
        $('#error-message').fadeOut(500);
    }, 2000);
}

var isActive;
window.onfocus = function () { isActive = true; document.title = "Unicorn Chat"; };
window.onblur = function () { isActive = false; };

var selfusername = undefined;

var socket = io.connect(window.location.protocol+'//'+window.location.hostname+':'+window.location.port);

socket.on('updatechat', function (username, data) {
    var d = new Date();
    $('#conversation').append(
        '<li class="left"><div class="chat-body"><p>['
        + d.getHours() + ':' + (d.getMinutes()<10?'0':'') + d.getMinutes() + '] ' + username + ' > ' + data
        + '</p></div></li>'
    );
    if(!isActive) {
        if(document.title != "[New] Unicorn Chat") document.title = "[New] Unicorn Chat";
        if ("Notification" in window) {
            if(Notification.permission === "granted") {
                if($('#notify-on-message').is(':checked')) {
                    var notification = new Notification(username + ' : ' + data, {'icon': "/custom/favicon.gif"});
                }
                if ($('#notify-on-hl').is(':checked')) {
                    var patt = new RegExp("(^|\\W)"+selfusername+"(\\W|$)");
                    if(patt.test(data)) {
                        var notification = new Notification(username + ' highlighted you.', {'icon': "/custom/favicon.gif"});
                    }
                }
            }
        }
    }
    scrollDown();
});

socket.on('server-message', function(data) {
    $('#conversation').append('<p>'+ data + '</p>');
    titleNotify(isActive);
    scrollDown();
});

socket.on('username', function(data) {
    if(data['type'] === 'create') {
        $('#nickname-send').html('Change');
        $('#data').show();
        if(Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            $('#activate-browser-notifications').show();
        } else {
            $('#notify-settings').show();
        }
    }
    selfusername = data['username'];
});

socket.on('error', function (data) {
    errorNotify(data);
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
    $('#notify-settings').hide();
    $('#nickname-send').html('Connect');
    $('#conversation').append('<p>You\'re disconnected.</p>');
    titleNotify(isActive);
    scrollDown();
});

$(function() {
    var windowWidth = $(document).width();
    var windowHeight = $(document).height();
    var current_dash = 0;

    $('#data').hide();
    $('#activate-browser-notifications').hide();
    $('#notify-settings').hide();

    if (!("Notification" in window)) {
        $('#activate-browser-notifications').attr('disabled', true);
    }

    $('#activate-browser-notifications').click(function(){
        if (!("Notification" in window)) {
            errorNotify("This browser does not support desktop notification");
        } else if (Notification.permission !== 'granted') {
            Notification.requestPermission(function (permission) {
                if(!('permission' in Notification)) {
                    Notification.permission = permission;
                }
                if (permission === "granted") {
                    var notification = new Notification("Thanks for activating Notifications.", {'icon': "/custom/favicon.gif"});
                    $('#activate-browser-notifications').hide();
                    $('#notify-settings').show();
                }
            });
        }
    });

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

    function launchPony () {
        current_dash += 1;
        var this_dash = current_dash;
        var position = Math.floor((Math.random() * 90) + 1);
        $('body').append(
            '<img id="dash_'+ this_dash + '" src="/custom/images/rdash.gif" style="position: absolute; bottom:' + position + 'px; left:-100px; z-index:-' + position + ';">'
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