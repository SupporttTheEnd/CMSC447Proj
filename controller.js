import * as home from './codebase/home.js';

window.globalVariables = {
    years: 4,
}

$(document).ready(function () {
    controller();
});


async function controller() {
    await home.main(); 
}

