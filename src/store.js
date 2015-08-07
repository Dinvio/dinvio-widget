'use strict';

var _ = require('lodash');
var EventEmitter = require('eventemitter3');

var Calculator = require('dinvio-js-sdk/Calculator');

var dispatcher = require('./dispatcher');
var actionTypes = require('./constants/actionTypes');
var deliveryTypes = require('./constants/deliveryTypes');
var isTrue = require('./utils/isTrue');


var CALCULATOR_SETTINGS = ['apiUrl', 'version', 'publicKey'];

function Store(settings) {
    var calculatorSettings = {};
    CALCULATOR_SETTINGS.forEach(function(key) {
        if (settings.hasOwnProperty(key)) {
            calculatorSettings[key] = settings[key];
        }
    });
    this.calculator = new Calculator(calculatorSettings);
    this._state = {
        requestData: {
            destination: '',
            packages: [],
            totalCost: 0
        },
        currentDeliveryType: undefined
    };
    clearCalculateState(this);
    var _this = this;
    this._dispatchToken = dispatcher.register(function(action) {
        if (action.store !== _this) {
            return;
        }
        switch (action.type) {
            case actionTypes.CALCULATE:
                var hasChanges = assignRequestData(_this, {
                    destination: action.destination,
                    packages: action.packages,
                    totalCost: action.totalCost
                });
                if (hasChanges) {
                    calculate(_this);
                }
                break;
            case actionTypes.SELECT_VARIANT:
                selectVariant(_this, action.variant);
                break;
            case actionTypes.SELECT_DELIVERY_TYPE:
                selectDeliveryType(_this, action.deliveryType);
                break;
            case actionTypes.SELECT_POINT:
                selectPoint(_this, action.point);
                break;
        }
    });
}

_.extend(Store.prototype, EventEmitter.prototype);

Store.prototype.unbind = function() {
    dispatcher.unregister(this._dispatchToken);
    delete this.calculator;
    delete this._state;
    delete this._dispatchToken;
};

Store.prototype.getRequestId = function() {
    return this._state.requestId;
};

Store.prototype.getDestination = function() {
    return this._state.destination;
};

Store.prototype.getSelectedDeliveryType = function() {
    return this._state.currentDeliveryType;
};

Store.prototype.getCompany = function(company) {
    return this._state.companies[company];
};

Store.prototype.getVariants = function() {
    return this._state.variants;
};

Store.prototype.getPoints = function(company) {
    if (company) {
        return this._state.points.filter(function(p) { return p['company'] === company; });
    }
    return this._state.points;
};

Store.prototype.getSelectedVariant = function(copy) {
    var variant = this._state.selected;
    return (copy && variant) ? _.assign({}, variant) : variant;
};

Store.prototype.isVariantEquals = function(v1, v2) {
    return (v1 && v2 && v1['company'] === v2['company'] && v1['delivery_type'] === v2['delivery_type'] && v1['name'] === v2['name']);
};

function assignRequestData(store, requestData) {
    if (!_.isEqual(store._state.requestData, requestData)) {
        store._state.requestData = requestData;
        return true;
    }
    return false;
}

function clearCalculateState(store) {
    store._state.companies = {};
    store._state.variants = [];
    store._state.points = [];
    store._state.destination = {};
    store._state.selected = null;
}

function calculate(store) {
    var requestData = store._state.requestData;
    var calcResult;
    clearCalculateState(store);
    store.emit('calculate-start');
    try {
        calcResult = store.calculator.calc(requestData.destination, requestData.packages, requestData.totalCost);
    } catch(e) {
        if (e instanceof Calculator.DestinationError) {
            store.emit('destination-error');
            return;
        } else {
            throw e;
        }
    }
    function handler(result) {
        store._state.requestId = result.requestId;
        store.emit('calculate-progress', result.isReady, result.progress);
        var updates = parseResult(store, result);
        if (updates) {
            if (updates.destination) {
                store.emit('destination', store.getDestination());
            }
            if (updates.variants) {
                store.emit('variants');
                if (!store._state.currentDeliveryType) {
                    selectDeliveryType(store, 'courier');
                }
            }
            if (updates.points) {
                store.emit('points');
            }
        }
    }
    function error(e) {
        store.emit('calculate-error', e);
    }
    calcResult.then(handler, error, handler);
}

function parseResult(store, result) {
    var state = store._state;
    var updates = {};
    var ccResult = result['courier_companies'];
    var companies = ccResult['companies'];
    if (companies) {
        _.forOwn(companies, function(val, key) {
            if (!state.companies[key]) {
                state.companies[key] = val;
            }
        });
    }
    if (!_.isEqual(state.destination, result.destination)) {
        state.destination = result.destination;
        updates.destination = true;
    }
    var variants = ccResult['variants'];
    if (variants) {
        updates.variants = variants.map(insertVariant.bind(store)).some(isTrue);
    }
    var points = ccResult['points'];
    if (points) {
        updates.points = points.map(insertPoint.bind(store)).some(isTrue);
    }
    return updates;
}

function selectVariant(store, variant) {
    if (!store.isVariantEquals(store._state.selected, variant)) {
        var point;
        if (variant['delivery_type'] === deliveryTypes.PICKPOINT) {
            var points = store.getPoints(variant['company']);
            if (!points || !points.length) {
                return;
            }
            point = points[0];
        }
        store._state.selected = _.assign({}, variant);
        store._state.selected.point = point;
        store.emit('variant-select', store._state.selected);
    }
}

function clearVariant(store) {
    store._state.selected = null;
    store.emit('variant-select', null);
}

function selectPoint(store, point) {
    var variant = store._state.selected;
    if (variant && variant['delivery_type'] === deliveryTypes.PICKPOINT && variant['company'] === point['company']
        && (!variant['point'] || variant['point']['code'] !== point['code'])) {
        variant.point = point;
        store.emit('variant-select', variant);
    }
}

function selectDeliveryType(store, deliveryType) {
    if (store._state.currentDeliveryType !== deliveryType) {
        store._state.currentDeliveryType = deliveryType;
        store.emit('deliveryType-select', deliveryType);
        clearVariant(store);
    }
}

function compareVariants(a, b) {
    if (a['cost'] > b['cost']) {
        return 1;
    } else if (a['cost'] < b['cost']) {
        return -1;
    }
    return 0;
}

function comparePoints(a, b) {
    if (a['distance'] > b['distance']) {
        return 1;
    } else if (a['distance'] < b['distance']) {
        return -1;
    }
    return 0;
}


/**
 * Insert variant into store
 * @this {Store}
 * @param {Object} variant
 * @returns {boolean}
 */
function insertVariant(variant) {
    var variants = this._state.variants;
    var exists = variants.some(this.isVariantEquals.bind(this, variant));
    if (!exists) {
        variants.push(variant);
        variants.sort(compareVariants);
    }
    return !exists;
}


/**
 * Insert point into store
 * @this {Store}
 * @param {Object} point
 * @returns {boolean}
 */
function insertPoint(point) {
    var points = this._state.points;
    var exists = points.some(function(p) {
        return (p['company'] === point['company'] && p['code'] === point['code']);
    });
    if (!exists) {
        points.push(point);
        points.sort(comparePoints);
    }
    return !exists;
}

module.exports = Store;
