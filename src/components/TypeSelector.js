'use strict';

var _ = require('lodash');
var component = require('../core/component');
var actions = require('../actions');
var deliveryTypes = require('../constants/deliveryTypes');

var CAPTIONS = {};
CAPTIONS[deliveryTypes.COURIER] = 'курьером';
CAPTIONS[deliveryTypes.PICKPOINT] = 'самовывоз из ПВЗ/постамата';

var BUTTONS = [ deliveryTypes.COURIER, deliveryTypes.PICKPOINT ];

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
            this.store.on('variants', this.handleVariantsUpdate, this);
            this.store.on('deliveryType-select', this.handleDeliveryTypeSelect, this);
        },
        unbind: function() {
            this.clear();
            this.store.off('deliveryType-select', this.handleDeliveryTypeSelect, this);
            this.store.on('variants', this.handleVariantsUpdate, this);
            delete this._handleButtonClick;
        },

        clear: function() {
            this.element.innerHTML = '';
        },

        getButtonType: function(buttonEl) {
            return buttonEl.getAttribute('data-type');
        },

        getButtonByType: function(deliveryType) {
            return this.element.querySelector('[data-type="' + deliveryType + '"]');
        },

        createButton: function(deliveryType) {
            var buttonIdx = BUTTONS.indexOf(deliveryType);
            if (buttonIdx === -1) {
                return;
            }
            var el = this.createElement('button');
            if (deliveryType === this.store.getSelectedDeliveryType()) {
                this.addModifierToElement(el, 'button', 'active');
            }
            el.setAttribute('data-type', deliveryType);
            el.innerHTML = CAPTIONS[deliveryType];
            var refEl = null;
            if (buttonIdx < BUTTONS.length - 1) {
                refEl = this.getButtonByType(BUTTONS[buttonIdx + 1]);
            }
            if (refEl) {
                this.element.insertBefore(el, refEl);
            } else {
                this.element.appendChild(el);
            }
            el.addEventListener('click', this._handleButtonClick);
            return el;
        },

        handleDeliveryTypeSelect: function(deliveryType) {
            _.forEach(this.getElements('button'), function(buttonEl) {
                if (this.getButtonType(buttonEl) === deliveryType) {
                    this.addModifierToElement(buttonEl, 'button', 'active');
                } else {
                    this.removeModifierFromElement(buttonEl, 'button', 'active');
                }
            }, this)
        },

        handleVariantsUpdate: function() {
            _.forEach(this.store.getDeliveryTypes(), function(deliveryType) {
                if (!this.getButtonByType(deliveryType)) {
                    this.createButton(deliveryType);
                }
            }, this);
        }
    }
);
module.exports = DinvioWidgetTypeSelector;
