'use strict';

var component = require('../core/component');
var deliveryTypes = require('../constants/deliveryTypes');

var Progress = require('./Progress');
var Destination = require('./Destination');
var TypeSelector = require('./TypeSelector');
var Variant = require('./Variant');
var PointsMap = require('./PointsMap');

/**
 * @class
 * @augments ComponentProto
 */
var DinvioWidget = component.factory('DinvioWidget',
    /**
     * @lends DinvioWidget#
     */
    {
        /**
         * @constructs
         */
        bind: function() {
            this.progressBar = this.bindComponentToElement(Progress, 'progress');
            this.destination = this.bindComponentToElement(Destination, 'destination');
            this.typeSelector = this.bindComponentToElement(TypeSelector, 'typeSelector');
            this.pointsMap = this.bindComponentToElement(PointsMap, 'pointsMap');
            this.variants = [];
            this.store.on('calculate-start', this.handleCalculateStart, this);
            this.store.on('variants', this.handleVariantsUpdate, this);
            this.store.on('deliveryType-select', this.handleDeliveryTypeSelect, this);
            this.store.on('variant-select', this.handleVariantSelect, this);
        },
        unbind: function() {
            this.store.off('variant-select', this.handleVariantSelect, this);
            this.store.off('deliveryType-select', this.handleDeliveryTypeSelect, this);
            this.store.off('variants', this.handleVariantsUpdate, this);
            this.store.off('calculate-start', this.handleCalculateStart, this);
            this.destroyVariants();
            this.pointsMap.destroy();
            this.typeSelector.destroy();
            this.destination.destroy();
            this.progressBar.destroy();
        },

        destroyVariants: function() {
            this.variants.forEach(function(variant) { variant.destroy(); });
            this.variants = [];
        },

        handleCalculateStart: function() {
            this.show();
            this.destroyVariants();
            this.pointsMap.clear();
        },

        handleVariantsUpdate: function() {
            var _this = this;
            var variants = this.store.getVariants();
            if (!variants) {
                return;
            }
            this.typeSelector.show();
            var variantsElRoot = this.getElement('variants');

            for (var i = 0; i < variants.length; i++) {
                var variantComponent = this.variants[i], variant = variants[i];
                if (!variantComponent || !this.store.isVariantEquals(variantComponent.state, variant)) {
                    var newVariant = Variant.create(this.store, variant);
                    newVariant.toggle(variant['delivery_type'] === this.deliveryType);
                    if (variantComponent) {
                        variantsElRoot.insertBefore(newVariant.element, variantComponent.element);
                    } else {
                        variantsElRoot.appendChild(newVariant.element);
                    }
                    this.variants.splice(i, 0, newVariant);
                    return this.handleVariantsUpdate();
                }
            }
        },
        handleDeliveryTypeSelect: function(deliveryType) {
            this.deliveryType = deliveryType;
            this.variants.forEach(function(variant) {
                variant.toggle(variant.state['delivery_type'] === deliveryType);
            });
            this.toggleElementModifier('pointsMap', 'show', deliveryType === deliveryTypes.PICKPOINT);
        },
        handleVariantSelect: function() {
        }
    },
    require('../templates/Widget.html')
);
module.exports = DinvioWidget;
