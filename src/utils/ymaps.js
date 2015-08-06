'use strict';

var Q = require('q');

var defaultScriptUrl = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU';

var deferred = Q.defer();

function load(scriptUrl) {
    if (!scriptUrl) {
        scriptUrl = defaultScriptUrl;
    }
    var scriptElement = document.createElement('script');
    scriptElement.setAttribute('type', 'text/javascript');
    scriptElement.src = scriptUrl;
    appendScript(scriptElement);
}

function appendScript(element) {
    var parentElement = document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0];
    if (!parentElement) {
        window.setTimeout(function() { appendScript(element); }, 1);
    } else {
        parentElement.appendChild(element);
        checkGlobal(true);
    }
}

function bindReady() {
    global['ymaps'].ready(function() {
        deferred.resolve();
    });
}

function checkGlobal(async) {
    if (global['ymaps']) {
        bindReady();
    } else if (async) {
        window.setTimeout(function() { checkGlobal(true); }, 1);
    }
}

if (global['ymaps']) {
    bindReady();
} else {
    load(defaultScriptUrl);
}

module.exports = {
    ready: deferred.promise
};
