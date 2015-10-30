'use strict';

var component = require('../core/component');
var style = require('../utils/style');
var pluralize = require('../utils/pluralize');
var actions = require('../actions');

/**
 * @class
 * @augments ComponentProto
 */
var DinvioWidgetVariant = component.factory('DinvioWidgetVariant',
    /**
     * @lends DinvioWidgetVariant#
     */
    {
        /**
         * @constructs
         */
        bind: function() {
            var _this = this;
            this._handleClick = function(e) {
                e.preventDefault();
                actions.selectVariant(_this.store, _this.state);
            };
            this.element.addEventListener('click', this._handleClick);
            this.store.on('variant-select', this.handleSelectedVariant, this);
        },
        unbind: function() {
            this.store.off('variant-select', this.handleSelectedVariant, this);
            this.element.removeEventListener('click', this._handleClick)
        },
        renderState: function() {
            var service = this.store.getService(this.state['service']);
            var name = service['name'];
            if (this.state['desc']) {
                // remove service name from description (ex. for DPD)
                name += ', ' + this.state['desc'].replace(new RegExp('^' + name + '\s*'), '');
            }
            style.set(this.getElement('logoImg'), {
                'background-image': 'url(' + service['logo'] + ')'
            });
            this.setElementsHTML({
                name: name,
                cost: this.state['cost'] + ' &#8381;',
                eta: this.state['eta'] + ' ' + pluralize(this.state['eta'], ['день', 'дня', 'дней'])
            });
        },
        handleSelectedVariant: function() {
            this.toggleModifier('selected', this.store.isVariantEquals(this.store.getSelectedVariant(), this.state));
        }
    },
    require('../templates/Variant.html')
);
module.exports = DinvioWidgetVariant;
