module.exports = {
    metadata: {
        plugin: 'tadoConnector',
        label: 'Tado Connector',
        family: 'controller',
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
            unit: '°C'
        }, {
            id: 'solarIntensity', label: 'Solar intensity',
            type: {
                id: 'number',
            },
            unit: '%'
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
            unit: "s"
        }],
    },

    create: function () {
        return new TadoConnector();

    },
};


function TadoConnector() {
    this.state = {};
}

/**
 *
 *
 */
TadoConnector.prototype.start = function () {
    let q = require('q');
    let deferred = q.defer();

    this.operationalState = {
        status: 'PENDING',
        message: 'Waiting for initialization...'
    };
    this.publishOperationalStateChange();

    const Tado = require('node-tado-client');

    if (this.isSimulated()) {
        this.logDebug("Starting Tado Connector in simulated mode.");

        this.operationalState = {
            status: 'OK',
            message: 'Tado Connector successfully initialized'
        }
        this.publishOperationalStateChange();

        deferred.resolve();
    } else {

        this.tado = new Tado();

        this.tado.login(this.configuration.username, this.configuration.password)
            .then(() => {
                this.tado.getMe()
                    .then(resp => {
                        this.state.homes = resp.homes;

                        if (!this.configuration.homeId) {
                            this.configuration.homeId = this.state.homes[0].id;
                            this.logDebug("No HomeID configured. Set to the first found: ", this.configuration.homeId);
                        }

                        this.tado.getZones(this.configuration.homeId)
                            .then(resp => {
                                this.state.zones = [];
                                for (let zone of resp) {
                                    this.state.zones.push({
                                        id: zone.id,
                                        name: zone.name
                                    });
                                }
                                this.publishStateChange();
                            })
                            .catch((err) => {
                                this.logError("Unable to get Zones with error: ", err);
                            });

                        this.weatherInterval = setInterval(() => {
                            this.tado.getWeather(this.configuration.homeId)
                                .then((res) => {
                                    this.state.solarIntensity = res.solarIntensity.percentage;
                                    this.state.outsideTemperature = res.outsideTemperature.celsius;
                                    this.state.weatherState = res.weatherState.value;
                                    this.publishStateChange();
                                })
                                .catch((err) => {
                                    this.logDebug("Unable to update weather state with error: ", err);
                                });
                        }, this.configuration.weatherUpdateInterval * 1000);

                        this.operationalState = {
                            status: 'OK',
                            message: 'Tado Connector successfully initialized'
                        }
                        this.publishOperationalStateChange();
                    })
                    .catch(err => {
                        this.operationalState = {
                            status: 'ERROR',
                            message: `Tado Connector Unable to connect to User: , ${this.configuration.username}`
                        }
                        this.publishOperationalStateChange();

                        this.logError("Unable to connect to User: ", this.configuration.username, " with error: ", err);
                    });

            })
            .catch(err => {
                this.operationalState = {
                    status: 'ERROR',
                    message: 'Tado Connector initialization error'
                }
                this.publishOperationalStateChange();
            });
        
        deferred.resolve();
    }

    return deferred.promise;


};


/**
 * stop - TadoConnector.
 *
 */
TadoConnector.prototype.stop = function () {
    //TODO;
};


/**
 *
 *
 *
 */
TadoConnector.prototype.setState = function (state) {
    //TODO
};

/**
 *
 *
 *
 */
TadoConnector.prototype.getState = function () {
    return this.state;
};
