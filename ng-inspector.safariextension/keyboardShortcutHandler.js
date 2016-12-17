// Listening for a keydown event
window.addEventListener('keydown', handleKeydown, false);

// Function to send message to Global.html when required shortcut detected
function handleKeydown(e) {
    // Watch for Cmd-Shift-I shortcut
    if (e.keyCode == 73 && e.ctrlKey && e.metaKey) {
        e.preventDefault();
        safari.self.tab.dispatchMessage('toggleInspector');
    }
}
