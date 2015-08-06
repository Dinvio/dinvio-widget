'use strict';

var component = require('../core/component');
var deliveryTypes = require('../constants/deliveryTypes');
var pointTypes = require('../constants/pointTypes');


/**
 * @class
 * @augments ComponentProto
 */
var DinvioWidgetDestination = component.factory('DinvioWidgetDestination',
    /**
     * @lends DinvioWidgetDestination#
     */
    {
        /**
         * @constructs
         */
        bind: function() {
            this.store.on('destination', this.update, this);
            this.store.on('variant-select', this.handleVariantSelect, this);
        },
        unbind: function() {
            this.store.off('variant-select', this.handleVariantSelect, this);
            this.store.off('destination', this.update, this);
        },
        update: function() {
            var destination = this.store.getDestination();
            this.getElement('city').innerHTML = destination['locality'];
            var address = '';
            if (destination['street']) {
                address += destination['street'];
                if (destination['house']) {
                    address += ', д. ' + destination['house'];
                }
                if (destination['block']) {
                    address += ', ' + destination['block'];
                }
            }
            this.hasAddress = !!address;
            if (address) {
                this.addModifier('hasAddress');
            } else {
                this.removeModifier('hasAddress');
            }
            this.getElement('address').innerHTML = address;
            this.show();
        },
        toggleElements: function() {
            var variant = this.store.getSelectedVariant(),
                type = this.store.getSelectedDeliveryType();
            var isPickpoint = ((!variant && type === deliveryTypes.PICKPOINT) || (variant && variant['delivery_type'] === deliveryTypes.PICKPOINT));
            this.toggleModifier('hasAddress', (this.hasAddress && !isPickpoint));
            this.toggleModifier('hasPoint', (isPickpoint && variant && variant['point']));
        },
        handleVariantSelect: function(variant) {
            if (variant && variant['delivery_type'] === deliveryTypes.PICKPOINT && variant.point) {
                this.getElement('point').innerHTML = pointTypes[variant.point['type']] + ': ' + variant.point['address'].replace(/^[^,]+,/, '');
            }
            this.toggleElements();
        }
    },
    require('../templates/Destination.html')
);
module.exports = DinvioWidgetDestination;
