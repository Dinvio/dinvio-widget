'use strict';

function clear(el) {
    el.style.cssText = '';
}

module.exports = {
    clear: clear,
    set: function(el, styles) {
        var arr = [];
        if (!styles) {
            return clear(el);
        }
        for (var name in styles) {
            if (styles.hasOwnProperty(name)) {
                arr.push(name + ':' + styles[name]);
            }
        }
        el.style.cssText = arr.join(';');
    },
    get: function(el, name) {
        return getComputedStyle(el, name);
    }
};
