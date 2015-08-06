'use strict';

var _ = require('lodash');

/**
 * is a given value DOMElement
 * @param {*} obj
 * @returns {boolean}
 */
module.exports = function(obj) {
    return _.isObject(value) && obj.nodeType > 0;
};
