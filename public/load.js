function main() {
    document.querySelector('.titlebar__window-action_minimise')
        .addEventListener('click', api.window.minimiseWindow)
    ;
    document.querySelector('.titlebar__window-action_maximise')
        .addEventListener('click', api.window.fullscreenWindow)
    ;
    document.querySelector('.titlebar__window-action_close')
        .addEventListener('click', api.window.closeWindow)
    ;
}

window.addEventListener('DOMContentLoaded', main);
