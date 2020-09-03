function main() {
    document.querySelector('.titlebar__window-action_minimise')
        .addEventListener('click', api.minimiseWindow)
    ;
    document.querySelector('.titlebar__window-action_maximise')
        .addEventListener('click', api.fullscreenWindow)
    ;
    document.querySelector('.titlebar__window-action_close')
        .addEventListener('click', api.closeWindow)
    ;
}

window.addEventListener('DOMContentLoaded', main);
