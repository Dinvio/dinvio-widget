'use strict';

require('./styles/index.styl');

var _ = require('lodash');
var EventEmitter = require('eventemitter3');

var isDOMElement = require('./utils/isDOMElement');

var Store = require('./store');
var dispatcher = require('./dispatcher');
var actions = require('./actions');

var DinvioWidgetComponent = require('./components/Widget');


/**
 * Creates new Widget object and bind it to element
 * @param {HTMLElement|string} element
 * @param {Object} settings
 * @constructor
 */
function DinvioWidget(element, settings) {
    if (_.isString(element)) {
        this.element = document.getElementById(element);
    } else if (isDOMElement(element)) {
        this.element = element;
    } else {
        throw new Error('`element` should be either DOMElement or String');
    }
    if (!this.element) {
        throw new Error('`element` not defined or null');
    }

    this.packages = undefined;
    this.totalCost = undefined;
    this.destination = undefined;

    this.store = new Store(settings);
    this.store.on('variant-select', function() {
        this.emit('select');
    }, this);

    var widgetComponent = new DinvioWidgetComponent.create(this.store);
    this.element.innerHTML = '';
    this.element.appendChild(widgetComponent.element);

    /**
     * Unbind Widget from element
     */
    this.unbind = function() {
        widgetComponent.destroy();
        widgetComponent = null;
        this.store.removeAllListeners(null);
        delete this.store;
    }
}

/**
 * Update parcel information
 * @param {Array} packages
 * @param {Number} [totalCost]
 */
DinvioWidget.prototype.setParcelData = function(packages, totalCost) {
    totalCost = parseFloat(totalCost);
    if (!(totalCost > 0)) {
        totalCost = 0;
    }
    if (!_.isEqual(this.packages, packages) || totalCost !== this.totalCost) {
        this.totalCost = totalCost;
        this.packages = _.clone(packages);
    }
};

/**
 * Update destination
 * @param {String} destination
 */
DinvioWidget.prototype.setDestination = function(destination) {
    if (destination !== this.destination) {
        this.destination = destination;
    }
};

/**
 * Start calculation
 */
DinvioWidget.prototype.calc = function() {
    if (this.packages && this.destination) {
        actions.calculate(this.store, this.destination, this.packages, this.totalCost || 0);
    }
};

/**
 * Start calculation for predefined order
 */
DinvioWidget.prototype.calcOrderId = function(orderId) {
    actions.calculateOrderId(this.store, orderId);
};

DinvioWidget.prototype.getSelectedVariant = function() {
    return this.store.getSelectedVariant(true);
};

DinvioWidget.prototype.getRequestId = function() {
    return this.store.getRequestId();
};

DinvioWidget.prototype.getServiceInfo = function(service) {
    return this.store.getService(service);
};

_.extend(DinvioWidget.prototype, EventEmitter.prototype);

global.DinvioWidget = DinvioWidget;
module.exports = DinvioWidget;
