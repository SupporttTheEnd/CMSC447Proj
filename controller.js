import * as home from './codebase/home.js';
import * as search from './codebase/search.js';

window.globalVariables = {
    years: 4,
}

$(document).ready(function () {
    controller();
});


async function controller() {
    await home.main(); 
}

