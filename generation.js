var staticData = require('./static_data');

var generate_img_string = function (arg) {
    var str = "<img src='" + staticData.emotes[arg]['image'] + "'";
    if('height' in staticData.emotes[arg]) {
        str += "style='height:" + staticData.emotes[arg]['height'] + "px; padding-bottom:" +
               staticData.emotes[arg]['height']/10 + "px;'";
    }
    str += ">";
    return str;
}

var generate_help_string = function () {
    var help_message = 'This is the help message. Only you can see this.<br />Emotes :<br />';
    for (var key in staticData.emotes) {
        help_message += generate_img_string(key) + " " + key + "&nbsp;&nbsp;";
    };
    help_message += '<br />Commands :<br />/dash : Launches a wild pony over the screen of everyone !';
    return help_message;
}

module.exports.generate_img_string = generate_img_string;
module.exports.generate_help_string = generate_help_string;