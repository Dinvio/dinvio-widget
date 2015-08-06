'use strict';

module.exports = function(value, forms) {
    var i = parseInt(value);

    if (i % 100 >= 11 && i % 100 <= 14) {
        return forms[2];
    }

    if (i % 10 === 1) {
        return forms[0]
    }

    if (i % 10 >= 2 && i <= 4) {
        return forms[1];
    }

    return forms[2];
};

