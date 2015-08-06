'use strict';

var actionTypes = require('./constants/actionTypes');
var dispatcher = require('./dispatcher');

module.exports = {
    calculate: function(store, destination, packages, totalCost) {
        dispatcher.dispatch({
            type: actionTypes.CALCULATE,
            store: store,
            destination: destination,
            packages: packages,
            totalCost: totalCost
        });
    },

    selectDeliveryType: function(store, type) {
        dispatcher.dispatch({
            type: actionTypes.SELECT_DELIVERY_TYPE,
            store: store,
            deliveryType: type
        });
    },

    selectVariant: function(store, variant) {
        dispatcher.dispatch({
            type: actionTypes.SELECT_VARIANT,
            store: store,
            variant: variant
        });
    },

    selectPoint: function(store, point) {
        dispatcher.dispatch({
            type: actionTypes.SELECT_POINT,
            store: store,
            point: point
        });
    }
};
