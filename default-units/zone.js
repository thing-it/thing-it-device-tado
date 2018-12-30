module.exports = {
    metadata: {
        plugin: "zone",
        label: "Zone",
        role: "actor",
        family: "thermostat",
        deviceTypes: ["tado/tadoConnector"],
        services: [
            //TODO
            //identifyZoneDevices
        ],
        events: [],
        state: [{
            id: 'temperature',
            label: 'Temperature',
            type: {
                id: 'number',
            },
        }, {
            id: 'setpoint',
            label: 'Setpoint',
            type: {
                id: 'number',
            },
            unit: '°C'
        }, {
            id: 'humidity',
            label: 'Humidity',
            type: {
                id: 'number',
            },
            unit: '%'
        }, {
            id: 'heatingPower',
            label: 'Heating Power',
            type: {
                id: 'number',
            },
            unit: '%'
        }, {
            id: 'openWindowDetected',
            label: 'Open Window Detected',
            type: {
                id: 'boolean',
            },
        }, {
            id: 'power',
            label: 'Power',
            type: {
                id: 'string',
            },
        },],
        configuration: [{
            id: 'zoneId',
            label: 'Zone ID',
            type: {
                id: 'string'
            },
            defaultValue: '',
        }, {
            id: 'pollingIntervalTime',
            label: 'Polling Interval Time',
            type: {
                id: 'number'
            },
            unit: 's',
            defaultValue: 10
        }]
    },
    create: function () {
        return new Zone();
    }
};

var q = require('q');

/**
 *
 */
function Zone() {
    /**
     *
     */
    Zone.prototype.start = function () {
        let deferred = q.defer();

        // this.logLevel = 'debug';

        //this.update();

        if (this.isSimulated()) {

            //TODO
            deferred.resolve();
        }
        else {

            this.updateInterval = setInterval(() => {
                this.device.tado.getZoneState(this.configuration.homeId, this.configuration.zoneId)
                    .then((res) => {
                        if (res) {
                            this.state.temperature = res.sensorDataPoints.insideTemperature.celsius;
                            this.state.setpoint = res.setting.temperature.celsius;
                            this.state.power = res.setting.power;
                            this.state.heatingPower = res.activityDataPoints.heatingPower.percentage;
                            this.state.humidity = res.sensorDataPoints.humidity.percentage;

                            if (!this.state.openWindowDetected && res.setting.openWindow) {
                                this.publishEvent("openWindowDetected");
                            }

                            this.state.openWindowDetected = res.setting.openWindow;

                            this.publishStateChange();
                            //SAMPLE RESPONSE
                            // { tadoMode: 'HOME',
                            //     geolocationOverride: false,
                            //     geolocationOverrideDisableTime: null,
                            //     preparation: null,
                            //     setting:
                            //     { type: 'HEATING',
                            //         power: 'ON',
                            //         temperature: { celsius: 20, fahrenheit: 68 } },
                            //     overlayType: null,
                            //         overlay: null,
                            //     openWindow: null,
                            //     nextScheduleChange:
                            //     { start: '2018-12-11T17:00:00Z',
                            //         setting: { type: 'HEATING', power: 'ON', temperature: [Object] } },
                            //     link: { state: 'ONLINE' },
                            //     activityDataPoints:
                            //     { heatingPower:
                            //     { type: 'PERCENTAGE',
                            //         percentage: 0,
                            //         timestamp: '2018-12-11T09:36:41.451Z' } },
                            //     sensorDataPoints:
                            //     { insideTemperature:
                            //      { celsius: 21.5,
                            //         fahrenheit: 70.7,
                            //         timestamp: '2018-12-11T09:47:59.946Z',
                            //         type: 'TEMPERATURE',
                            //         precision: [Object] },
                            //         humidity:
                            //         { type: 'PERCENTAGE',
                            //             percentage: 41.6,
                            //             timestamp: '2018-12-11T09:47:59.946Z' }
                            //      }
                            // }
                            // ##############################
                        }
                    })
                    .catch((err) => {
                        this.logError("Error while updating Zone: ", err)
                    });
            }, this.configuration.pollingIntervalTime);


            deferred.resolve();
        }

        return deferred.promise;
    };


    /**
     *
     */
    Zone.prototype.getState = function () {
        //this.update();
        return this.state;
    };

    // /**
    //  *
    //  */
    // Zone.prototype.update = function () {
    //
    //     let deferred = q.defer();
    //
    //
    //     return deferred.promise;
    //
    //
    // };

    // /**
    //  * TODO
    //  */
    // Zone.prototype.identifyZoneDevices = function () {
    //     for (let deviceId of this.state.deviceId) {
    //         this.device.tado.identifyDevice(deviceId)
    //             .then((res) => {
    //                 this.logDebug("Succseful identified device: ", deviceId);
    //             })
    //             .catch((err) => {
    //                 this.logError("Device indetification unsucessful for device: ", deviceId, " with error: ", err);
    //             });
    //     }
    // };

    /**
     *
     */
    Zone.prototype.setState = function (state) {
        if ((state)) {
            if (state.setpoint !== this.state.setpoint) {
                this.device.tado.setZoneOverlay(this.device.configuration.homeId, this.configuration.zoneId, 'on', state.setpoint, 'auto')
                    .then((resp) => {
                        this.logInfo("Succseful adjusted setpoint to: ", state.setpoint);
                        this.state = state;
                    })
                    .catch((err) => {
                        this.logError("Cannot adjusted setpoint!");
                    });
            }
        } else {
            this.logError("Cannot setState without state");
        }
    };

    /**
     *
     */
    Zone.prototype.stop = function () {
        if (this.isSimulated()) {

        } else {
            clearInterval(this.updateInterval);
        }
    }
}