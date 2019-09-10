module.exports = {
  metadata: {
    plugin: 'tadoConnector',
    label: 'Tado Connector',
    family: 'connector',
    actorTypes: [],
    sensorTypes: [],
    events: [],
    services: [
      //TODO ADD SERVICES
    ],
    state: [{
      id: 'homes', label: 'Homes',
      type: {
        id: 'object',
      },
    }, {
      id: 'zones', label: 'Zones',
      type: {
        id: 'object',
      },
    }, {
      id: 'weatherState', label: 'Weather state',
      type: {
        id: 'string',
      },
    }, {
      id: 'outsideTemperature', label: 'Outside temperature',
      type: {
        id: 'number',
      },
      unit: '°C',
    }, {
      id: 'solarIntensity', label: 'Solar intensity',
      type: {
        id: 'number',
      },
      unit: '%',
    }],
    configuration: [{
      label: 'Username (Email)',
      id: 'username',
      type: {
        id: 'string',
      },
      defaultValue: '',
    }, {
      label: 'Password',
      id: 'password',
      type: {
        id: 'password',
      },
      defaultValue: '',
    }, {
      label: 'Home ID',
      id: 'homeId',
      type: {
        id: 'string',
      },
      defaultValue: '',
    }, {
      label: 'Weather update interval',
      id: 'weatherUpdateInterval',
      type: {
        id: 'integer',
      },
      defaultValue: 10,
      unit: 's',
    }],
  },

  create: function() {
    return new TadoConnector();

  },
};


function TadoConnector() {
  this.state = {};
}

const q = require('q');
const deferred = q.defer();
const TadoAdapter = require('./lib/tadoAdapter');
const Helper = require('./lib/helper');
const _ = require('lodash');
/**
 *
 *
 */
TadoConnector.prototype.start = function() {

  if (this.isSimulated()) {
    this.logDebug('Starting Tado Connector in simulated mode.');

    deferred.resolve();
  } else {

    this.tado = new TadoAdapter();
    this.tado.initialized = this.tado.initialize(this.configuration.username, this.configuration.password, this.configuration.homeId)
      .then((homeId) => {
        this.operationalState.status = 'OK';
        this.operationalState.message = 'Successful connected to Home: ' + homeId;
        this.publishOperationalStateChange();

        this.weatherInterval = setInterval(() => {
          this.tado.getWeather()
            .then((weather) => {
              let oldState = _.clone(this.state);
              this.state.solarIntensity = weather.solarIntensity.percentage;
              this.state.outsideTemperature = weather.outsideTemperature.celsius;
              this.state.weatherState = weather.weatherState.value;

              let newState = Helper.diff(this.state, oldState);
              if (Object.keys(newState).length > 0 && newState.constructor === Object) {
                this.publishStateChange(newState);
              }
            })
            .catch((err) => {
              this.logDebug('Unable to update weather state with error: ', err);
            });
        }, this.configuration.weatherUpdateInterval * 1000);
      })
      .then(() => {
        this.tado.getZones()
          .then(zones => {
            this.state.zones = zones;
            this.publishStateChange();
          })
          .catch((err) => {
            this.logError('Unable to get Zones with error: ', err);
          });
      });
  }

  deferred.resolve();
  return deferred.promise;
};


/**
 * stop - TadoConnector.
 *
 */
TadoConnector.prototype.stop = function() {
  clearInterval(this.weatherInterval);
};


/**
 *
 *
 */
TadoConnector.prototype.setState = function(state) {
  //TODO
};

/**
 *
 *
 */
TadoConnector.prototype.getState = function() {
  return this.state;
};
