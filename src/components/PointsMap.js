'use strict';

var component = require('../core/component');
var ymapsLoader = require('../utils/ymaps');
var actions = require('../actions');
var deliveryTypes = require('../constants/deliveryTypes');
var pointTypes = require('../constants/pointTypes');

var MapPointBalloonHTML = require('../templates/MapPointBalloon.html');

var defaultZoom = 12;

var PLACEMARK_PRESETS = {
    default: 'islands#grayDotIcon',
    selected: 'islands#blueDotIcon'
};

function prepareCoords(long, lat) {
    var ymaps = global['ymaps'];
    var coordinatesOrder = ymaps.meta.coordinatesOrder;
    if (coordinatesOrder === 'longlat') {
        return [long, lat];
    }
    return [lat, long];
}


/**
 * @class
 * @augments ComponentProto
 */
var DinvioWidgetPointsMap = component.factory('DinvioWidgetPointsMap',
    /**
     * @lends DinvioWidgetPointsMap#
     */
    {
        /**
         * @constructs
         */
        bind: function() {
            this.service = null;
            this.points = [];
            this.store.on('destination', this.handleDestinationUpdate, this);
            this.store.on('points', this.handlePointsUpdate, this);
            this.store.on('variant-select', this.handleVariantSelect, this);
        },
        unbind: function() {
            this.store.off('variant-select', this.handleVariantSelect, this);
            this.store.off('points', this.handlePointsUpdate, this);
            this.store.off('destination', this.handleDestinationUpdate, this);
            if (this.ymap) {
                this.ymap.destroy();
                delete this.ymap;
                delete this.__mapBinding;
                delete this.points;
            }
        },

        createMap: function(center) {
            var _this = this;
            var ymaps = global['ymaps'];
            var store = this.store;
            this.ymap = new ymaps.Map(this.element, {
                center: center,
                zoom: defaultZoom,
                controls: ['zoomControl']
            }, {
                autoFitToViewport: 'always'
            });
            var balloonTemplate = this.balloonTemplate = ymaps.templateLayoutFactory.createClass(MapPointBalloonHTML, {
                build: function() {
                    balloonTemplate.superclass.build.call(this);
                    this._controlListeners = this.events.group().add('click', this.onClick, this);
                },
                clear: function() {
                    this._controlListeners.removeAll();
                    balloonTemplate.superclass.clear.call(this);
                },
                onClick: function(e) {
                    var el = e.originalEvent.domEvent.originalEvent.target;
                    var data = e.originalEvent.target.getData();
                    if (el.getAttribute('data-action') === 'select') {
                        _this.closeBalloon();
                        actions.selectPoint(store, data.properties.get('point'));
                    }
                }
            });
            this.pointsClusterer = new ymaps.Clusterer({
                hasHint: false,
                zoomMargin: 20,
                clusterBalloonItemContentLayout: this.balloonTemplate,
                clusterBalloonContentLayout: 'cluster#balloonCarousel'
            });
            this.ymap.geoObjects.add(this.pointsClusterer);
        },

        clear: function() {
            this.service = null;
            this.points = [];
            if (this.ymap) {
                this.pointsClusterer.removeAll();
            }
        },

        closeBalloon: function() {
            var clustererBalloon = this.pointsClusterer.balloon;
            if (clustererBalloon) {
                clustererBalloon.close();
            }
            this.pointsClusterer.getGeoObjects().forEach(function(object) {
                if (object.balloon) {
                    object.balloon.close();
                }
            });
        },

        handleDestinationUpdate: function(destination) {
            var _this = this;
            if (this.ymap) {
                var coords = prepareCoords(destination['long'], destination['lat']);
                this.ymap.setCenter(coords, defaultZoom);
            } else {
                if (!this.__mapBinding) {
                    this.__mapBinding = true;
                    ymapsLoader.ready.then(function() {
                        var coords = prepareCoords(destination['long'], destination['lat']);
                        _this.createMap(coords);
                    });
                }
            }
        },

        handleVariantSelect: function(variant) {
            if (!this.ymap) {
                return;
            }
            var clusterer = this.pointsClusterer;
            if (!variant || variant['delivery_type'] !== deliveryTypes.PICKPOINT) {
                var destination = this.store.getDestination();
                clusterer.removeAll();
                this.ymap.setCenter(prepareCoords(destination['long'], destination['lat']));
            } else {
                if (variant['service'] !== this.service) {
                    clusterer.removeAll();
                    clusterer.add(this.points.filter(function (p) {
                        return p.properties.get('service').code === variant.service;
                    }));
                }
                var objects = clusterer.getGeoObjects();
                var point = variant['point'];
                objects.forEach(function(object) {
                    if (object.properties.get('point')['code'] === point['code']) {
                        object.options.set('preset', PLACEMARK_PRESETS.selected);
                    } else {
                        object.options.set('preset', PLACEMARK_PRESETS.default);
                    }
                });
                this.ymap.setCenter(prepareCoords(point['long'], point['lat']), defaultZoom, {
                    duration: 300
                });
            }
        },

        handlePointsUpdate: function() {
            var _this = this;
            if (!this.ymap) {
                return;
            }
            var ymaps = global['ymaps'];
            var current = this.points;
            var variant = this.store.getSelectedVariant();
            this.store.getPoints().forEach(function(point) {
                var service = point['service'], code = point['code'];
                var exists = current.some(function(p) {
                    return (p.properties.get('service').code === service && p.properties.get('point').code === code);
                });
                if (!exists) {
                    var serviceInfo = _this.store.getService(service);
                    var title = pointTypes[point['type']] + ': ' + point['address'];
                    var placemark = new ymaps.Placemark(
                        prepareCoords(point['long'], point['lat']),
                        {
                            hintContent: title,
                            clusterCaption: title,
                            service: serviceInfo,
                            point: point,
                            hasBalloon: true
                        }, {
                            balloonContentLayout: _this.balloonTemplate,
                            clusterBalloonContentLayout: _this.balloonTemplate,
                            preset: PLACEMARK_PRESETS.default
                        }
                    );
                    _this.points.push(placemark);
                    if (variant && variant['delivery_type'] === deliveryTypes.PICKPOINT && service == variant.service) {
                        _this.pointsClusterer.add(placemark);
                    }
                }
            });
        }
    }
);
module.exports = DinvioWidgetPointsMap;
