'use strict';

var _ = require('lodash');
var classNames = require('../utils/classNames');

function ComponentProto(className, proto) {
    _.extend(this, proto);
    this.element = undefined;
    this.store = undefined;
    this.className = className;
}

ComponentProto.prototype._bind = function(element, store, state) {
    this.state = {};
    this.element = element;
    this.store = store;
    this._elementsCache = {};
    classNames.add(this.element, this.className);
    this.bind();
    if (state) {
        this.setState(state);
    }
};

ComponentProto.prototype.bind = function() {};
ComponentProto.prototype.unbind = function() {};

ComponentProto.prototype.renderState = function() {};

ComponentProto.prototype.setState = function(newState) {
    var hasChanges = false;
    _.forOwn(newState, function(value, key) {
        if (this.state[key] !== value) {
            this.state[key] = value;
            hasChanges = true;
        }
    }, this);
    if (hasChanges) {
        this.renderState();
    }
};

ComponentProto.prototype.destroy = function() {
    this.unbind();
    if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
    }
    delete this.element;
    delete this.store;

};

ComponentProto.prototype.toggleModifier = function(modifier, state) {
    if (state) {
        return this.addModifier(modifier);
    } else {
        return this.removeModifier(modifier);
    }
};

ComponentProto.prototype.addModifier = function(modifier) {
    classNames.add(this.element, this.className + '--' + modifier);
};

ComponentProto.prototype.removeModifier = function(modifier) {
    classNames.remove(this.element, this.className + '--' + modifier);
};

ComponentProto.prototype.addModifierToElement = function(element, elementName, modifier) {
    classNames.add(element, this.className + '-' + elementName + '--' + modifier);
};

ComponentProto.prototype.removeModifierFromElement = function(element, elementName, modifier) {
    classNames.remove(element, this.className + '-' + elementName + '--' + modifier);
};

ComponentProto.prototype.toggleElementModifier = function(elementName, modifier, state) {
    if (state) {
        return this.addModifierToElement(this.getElement(elementName), elementName, modifier);
    } else {
        return this.removeModifierFromElement(this.getElement(elementName), elementName, modifier);
    }
};

ComponentProto.prototype.toggle = function(state) {
    if (state) {
        return this.show();
    } else {
        return this.hide();
    }
};

ComponentProto.prototype.show = function() {
    this.addModifier('show');
    this.removeModifier('hide');
};

ComponentProto.prototype.hide = function() {
    this.removeModifier('show');
    this.addModifier('hide');
};

ComponentProto.prototype.createElement = function(name) {
    var el = document.createElement('div');
    el.className = this.className + '-' + name;
    delete this._elementsCache[name];
    delete this._elementsCache[name + '*'];
    return el;
};

ComponentProto.prototype.getElement = function(name) {
    if (!this._elementsCache[name]) {
        this._elementsCache[name] = this.element.querySelector('.' + this.className + '-' + name);
    }
    return this._elementsCache[name];
};

ComponentProto.prototype.setElementHTML = function(name, html) {
    var element = this.getElement(name);
    if (element) {
        element.innerHTML = html;
    }
};
ComponentProto.prototype.setElementsHTML = function(dict) {
    for (var name in dict) {
        if (dict.hasOwnProperty(name)) {
            this.setElementHTML(name, dict[name]);
        }
    }
};

ComponentProto.prototype.getElements = function(name) {
    var key = name + '*';
    if (!this._elementsCache[key]) {
        this._elementsCache[key] = this.element.querySelectorAll('.' + this.className + '-' + name);
    }
    return this._elementsCache[key];
};

ComponentProto.prototype.bindComponentToElement = function(Component, element) {
    element = _.isString(element) ? this.getElement(element) : element;
    if (element) {
        return Component.bindTo(element, this.store);
    }
};

module.exports = {
    ComponentProto: ComponentProto,
    /**
     * Creates new component
     * @param {String} className
     * @param {Object} proto
     * @param {String} [html]
     * @return {Function}
     */
    factory: function(className, proto, html) {
        var Component = new Function('return function ' + className + '(element, store, state) { this._bind(element, store, state); }').call(null);
        Component.prototype = new ComponentProto(className, proto);
        Component.prototype.constructor = Component;
        Component.bindTo = function(element, store, state) {
            if (html) {
                element.innerHTML = html;
            }
            return new Component(element, store, state);
        };
        Component.create = function(store, state) {
            return Component.bindTo(document.createElement('div'), store, state);
        };

        return Component;
    }
};
