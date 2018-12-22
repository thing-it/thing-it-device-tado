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
            label: 'Polling Interval',
            id: 'pollingInterval',
            type: {
                id: 'number',
            },
            defaultValue: '10',
            unit: "s"
        }],
    },

    create: function () {
        return new TadoConnector();

    },
};


//todo needed?
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
    const Tado = require('node-tado-client');

    if (this.isSimulated()) {
        this.logDebug("Starting Tado Connector in simulated mode.");

        deferred.resolve();
    } else {

        this.tado = new Tado();

        this.tado.login(this.configuration.username, this.configuration.password)
            .then(() => {
                this.tado.getMe()
                    .then(resp => {
                        this.state.homes = resp.homes;
                        console.log('##############################');
                        console.log(' Homes #######################');
                        console.log(this.state.homes);
                        console.log('##############################');
                        console.log('##############################');

                        if (!this.configuration.homeId) {
                            this.configuration.homeId = this.state.homes[0].id;
                        }

                        this.tado.getZones(this.configuration.homeId)
                            .then(resp => {
                                console.log('##############################');
                                console.log(' Zones #######################');
                                this.state.zones = resp;
                                console.log(this.state.zones);
                                console.log('##############################');
                                console.log('##############################');
                            });

                        setInterval(function () {
                            this.tado.getZoneState(this.configuration.homeId, '2')
                                .then(resp => {
                                    console.log('##############################');
                                    console.log(' Zones #######################');
                                    this.state.zones = resp;
                                    console.log(this.state.zones.sensorDataPoints.insideTemperature.celsius);
                                    console.log('##############################');
                                    console.log('##############################');
                                })
                        }.bind(this),2000);


                    })


            })
            .catch(err => {
                this.operationalState.status = "ERROR";
                this.operationalState.message = err;
                this.publishOperationalStateChange();
            });

        this.operationalState.status = "PENDING";
        this.operationalState.message = "INITIALIZING...";
        this.publishOperationalStateChange();

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
