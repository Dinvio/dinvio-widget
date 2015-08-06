'use strict';

var _ = require('lodash');
var SPACE_RE = /\s+/;

var argSlice = function(args, start) {
    return Array.prototype.slice.call(args, start);
};

function parseClasses(val) {
    var res = [];
    if (Array.isArray(val)) {
        res = val.reduce(function(prev, s) {
            return prev.concat(parseClasses(s));
        }, []);
    } else if (_.isObject(val)) {
        _.forOwn(val, function(value, key) {
            if (value) {
                res.push(key);
            }
        });
    } else if (_.isString(val)) {
        return val ? [val] : [];
    }
    return _.uniq(res);
}

function set(element) {
    var classNames = parseClasses(argSlice(arguments, 1));
    element.className = classNames.join(' ');
}

function splitClassNames(element) {
    return element.className.split(SPACE_RE);
}

function _has(elementClassNames, classNames, every) {
    return classNames[every ? 'every' : 'some'](function(className) {
        return elementClassNames.indexOf(className) > -1;
    })
}

function has(element) {
    return _has(splitClassNames(element), argSlice(arguments, 1), false);
}

function hasAll(element) {
    return _has(splitClassNames(element), argSlice(arguments, 1), false);
}


function add(element) {
    var toAdd = parseClasses(argSlice(arguments, 1));
    return set(element, splitClassNames(element), toAdd);
}

function remove(element) {
    var classNames = element.className.split(SPACE_RE),
        toRemove = parseClasses(argSlice(arguments, 1));
    _.remove(classNames, function(el) {
        return toRemove.indexOf(el) > -1;
    });
    element.className = classNames.join(' ');
}

module.exports = {
    set: set,
    has: has,
    hasAll: hasAll,
    add: add,
    remove: remove,
    toggle: function(element) {
        argSlice(arguments, 1).forEach(function(className) {
            if (has(element, className)) {
                remove(element, className);
            } else {
                add(element, className);
            }
        });
    }
};
