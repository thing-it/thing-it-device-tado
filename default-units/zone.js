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
            id: 'zoneName',
            label: 'Zone Name',
            type: {
                id: 'string',
            },
        }, {
            id: 'runningMode',
            label: 'Running Mode',
            type: {
                id: 'string',
            },
        }, {
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
            id: 'openWindowDetectTimestamp',
            label: 'Open Window detect Timestamp',
            type: {
                id: 'string',
            },
        }, {
            id: 'power',
            label: 'Power',
            type: {
                id: 'string',
            },
        }, {
            id: 'linkState',
            label: 'Link State',
            type: {
                id: 'string',
            },
        },],
        configuration: [{
            id: 'zoneId',
            label: 'Zone ID',
            type: {
                id: 'integer'
            },
            defaultValue: '',
        }, {
            id: 'pollingIntervalTime',
            label: 'Polling Interval Time',
            type: {
                id: 'integer'
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
        this.state = {};
        
        this.operationalState = {
            status: 'PENDING',
            message: 'Waiting for initialization...'
        };
        this.publishOperationalStateChange();

        if (this.isSimulated()) {
            this.operationalState = {
                status: 'OK',
                message: 'Zone successfully initialized'
            }
            this.publishOperationalStateChange();
            //TODO
            deferred.resolve();
        } else {
            this.updateInterval = setInterval(() => {
                this.device.tado.getZoneState(this.device.configuration.homeId, this.configuration.zoneId)
                    .then((res) => {
                        if (res) {
                            this.state.runningMode = res.tadoMode;
                            this.state.temperature = res.sensorDataPoints.insideTemperature.celsius;
                            this.state.heatingPower = res.activityDataPoints.heatingPower.percentage;
                            this.state.power = res.setting.power;
                            this.state.humidity = res.sensorDataPoints.humidity.percentage;
                            this.state.linkState = res.link.state;

                            if (res.setting.temperature) {
                                this.state.setpoint = res.setting.temperature.celsius;
                            } else {
                                this.state.setpoint = 'n/a';
                            }

                            if (!this.state.zoneName) {
                                this.state.zoneName = this.device.state.zones.find((zone) => {
                                    return zone.id === this.configuration.zoneId;
                                }).name;
                            }

                            if (res.openWindow) {
                                if (!this.state.openWindowDetected) {
                                    this.publishEvent("openWindowDetected");
                                }
                                this.state.openWindowDetected = true;
                                this.state.openWindowDetectTimestamp = res.openWindow.detectedTime;
                            } else {
                                this.state.openWindowDetected = false;
                                this.state.openWindowDetectTimestamp = '';
                            }
                            this.publishStateChange();
                        }
                    })
                    .catch((err) => {
                        this.logError("Error while updating Zone: ", err)
                    });
            }, this.configuration.pollingIntervalTime * 1000);

            this.operationalState = {
                status: 'OK',
                message: 'Zone successfully initialized'
            }
            this.publishOperationalStateChange();
            
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
                        this.logDebug("Cannot adjusted setpoint!");
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