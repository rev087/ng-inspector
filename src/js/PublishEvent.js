module.exports = function(command, payload, origin) {
    var msg = JSON.stringify({
        command: command,
        payload: payload
    });
    window.postMessage(msg, origin || '*');
};
