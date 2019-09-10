module.exports = {
  metadata: {
    plugin: 'zone',
    label: 'Zone',
    role: 'actor',
    family: 'thermostat',
    deviceTypes: ['tado/tadoConnector'],
    services: [
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
      unit: '°C',
    }, {
      id: 'humidity',
      label: 'Humidity',
      type: {
        id: 'number',
      },
      unit: '%',
    }, {
      id: 'heatingPower',
      label: 'Heating Power',
      type: {
        id: 'number',
      },
      unit: '%',
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
    }],
    configuration: [{
      id: 'zoneId',
      label: 'Zone ID',
      type: {
        id: 'integer',
      },
      unit: 'id',
      defaultValue: '',
    }, {
      id: 'showTemperature',
      label: 'Show temperature',
      type: {
        id: 'boolean',
      },
      defaultValue: true,
    }, {
      id: 'minSetpoint',
      label: 'Min Setpoint',
      type: {
        id: 'integer',
      },
      unit: 'grad',
      defaultValue: 5,
    }, {
      id: 'maxSetpoint',
      label: 'Max setpoint',
      type: {
        id: 'integer',
      },
      unit: 'grad',
      defaultValue: 25,
    }, {
      id: 'pollingIntervalTime',
      label: 'Polling Interval Time',
      type: {
        id: 'integer',
      },
      unit: 's',
      defaultValue: 10,
    }],
  },
  create: function() {
    return new Zone();
  },
};

const q = require('q');
const _ = require('lodash');
const Helper = require('../lib/helper');

/**
 *
 */
function Zone() {
  /**
   *
   */
  Zone.prototype.start = function() {
    let deferred = q.defer();
    this.state = {};
    if (this.isSimulated()) {


      deferred.resolve();
    } else {
      this.device.tado.initialized
        .then(() => {
          this.updateInterval = setInterval(() => {
            this.device.tado.getZoneState(this.configuration.zoneId)
              .then((res) => {
                if (res) {
                  let oldState = _.clone(this.state);

                  this.state.runningMode = res.tadoMode;
                  this.state.temperature = res.sensorDataPoints.insideTemperature.celsius;
                  this.state.heatingPower = res.activityDataPoints.heatingPower.percentage;
                  this.state.power = res.setting.power;
                  this.state.humidity = res.sensorDataPoints.humidity.percentage;


                  this.state.linkState = res.link.state;

                  let oldOpState = _.clone(this.operationalState);

                  if (this.state.linkState !== 'ONLINE') {
                    this.operationalState.status = 'ERROR';
                    this.operationalState.message = 'Thermostat offline';
                  } else {
                    this.operationalState.status = 'OK';
                    this.operationalState.message = 'Thermostat online';
                  }

                  let newOpState = Helper.diff(this.operationalState, oldOpState);
                  if (Object.keys(newOpState).length > 0 && newOpState.constructor === Object) {
                    this.publishOperationalStateChange(newOpState);
                  }


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
                      this.publishEvent('openWindowDetected');
                    }
                    this.state.openWindowDetected = true;
                    this.state.openWindowDetectTimestamp = res.openWindow.detectedTime;
                  } else {
                    this.state.openWindowDetected = false;
                    this.state.openWindowDetectTimestamp = '';
                  }

                  let newState = Helper.diff(this.state, oldState);
                  if (Object.keys(newState).length > 0 && newState.constructor === Object) {
                    this.publishStateChange(newState);
                  }
                }
              })
              .catch((err) => {
                this.logError('Error while updating Zone: ', err);
              });
          }, this.configuration.pollingIntervalTime * 1000);
        });

      deferred.resolve();
    }

    return deferred.promise;
  };


  /**
   *
   */
  Zone.prototype.getState = function() {
    //this.update();
    return this.state;
  };


  // /**
  //  *
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
   * //TODO Handle fast calls
   */
  Zone.prototype.setState = function(state) {
    if ((state)) {
      if (state.setpoint !== this.state.setpoint) {
        this.device.tado.setZoneOverlay(this.configuration.zoneId, state.setpoint)
          .then(() => {
            this.logInfo('Succseful adjusted setpoint to: ', state.setpoint);
            this.state = state;
          })
          .catch((err) => {
            this.logDebug('Cannot adjusted setpoint!', err);
          });
      }
    } else {
      this.logError('Cannot setState without state');
    }
  };

  /**
   *
   */
  Zone.prototype.stop = function() {
    if (this.isSimulated()) {

    } else {
      clearInterval(this.updateInterval);
    }
  };
}
