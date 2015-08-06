'use strict';

var component = require('../core/component');
var style = require('../utils/style');

/**
 * @class
 * @augments ComponentProto
 */
var DinvioWidgetProgress = component.factory('DinvioWidgetProgress',
    /**
     * @lends DinvioWidgetProgress#
     */
    {
        /**
         * @constructs
         */
        bind: function() {
            this.store.on('calculate-start', this.handleStart, this);
            this.store.on('calculate-progress', this.update, this);
        },
        unbind: function() {
            this.store.off('calculate-progress', this.update, this);
            this.store.off('calculate-start', this.handleStart, this);
        },
        handleStart: function() {
            style.set(this.getElement('bar'), {
                width: 0
            });
        },
        update: function(isReady, progressState) {
            var loaded = progressState[1] + progressState[2],
                total = progressState[0];

            style.set(this.getElement('bar'), {
                width: (loaded + 1) / (total + 1) * 100 + '%'
            });
            if (isReady) {
                this.hide();
            } else {
                this.show();
            }
        }
    },
    require('../templates/Progress.html')
);
module.exports = DinvioWidgetProgress;
