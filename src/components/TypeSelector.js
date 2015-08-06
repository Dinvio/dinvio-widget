'use strict';

var _ = require('lodash');
var component = require('../core/component');
var actions = require('../actions');

/**
 * @class
 * @augments ComponentProto
 */
var DinvioWidgetTypeSelector = component.factory('DinvioWidgetTypeSelector',
    /**
     * @lends DinvioWidgetTypeSelector#
     */
    {
        /**
         * @constructs
         */
        bind: function() {
            var _this = this;
            this._handleButtonClick = function(e) {
                e.preventDefault();
                var type = _this.getButtonType(this);
                actions.selectDeliveryType(_this.store, type);
            };
            _.forEach(this.getElements('button'), function(el) {
                el.addEventListener('click', this._handleButtonClick);
            }, this);
            this.store.on('deliveryType-select', this.handleDeliveryTypeSelect, this);
        },
        unbind: function() {
            this.store.off('deliveryType-select', this.handleDeliveryTypeSelect, this);
            _.forEach(this.getElements('button'), function(el) {
                el.removeEventListener('click', this._handleButtonClick);
            }, this)
            delete this._handleButtonClick;
        },

        getButtonType: function(buttonEl) {
            return buttonEl.getAttribute('data-type');
        },

        handleDeliveryTypeSelect: function(deliveryType) {
            _.forEach(this.getElements('button'), function(buttonEl) {
                if (this.getButtonType(buttonEl) === deliveryType) {
                    this.addModifierToElement(buttonEl, 'button', 'active');
                } else {
                    this.removeModifierFromElement(buttonEl, 'button', 'active');
                }
            }, this)
        }
    },
    require('../templates/TypeSelector.html')
);
module.exports = DinvioWidgetTypeSelector;
