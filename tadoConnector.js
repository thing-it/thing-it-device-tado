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
            id: 'homeId', label: 'Home ID',
            type: {
                id: 'string',
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
    var deferred = q.defer();
    const Tado = require('node-tado-client');

    if (this.isSimulated()) {
        this.logDebug("Starting Tado Connector in simulated mode.");

        deferred.resolve();
    } else {

        this.tado = new Tado();

        this.tado.login(this.configuration.username, this.configuration.password)
            .then(resp => {
                //TODO
            });


        this.operationalState = {
            status: "PENDING",
            message: "INITIALIZING...",
        };
        this.publishOperationalStateChange();


        deferred.resolve();
    }

    return deferred.promise;


}


/**
 * stop - TadoConnector.
 *
 */
TadoConnector.prototype.stop = function () {
    //TODO;
}


/**
 *
 *
 *
 */
TadoConnector.prototype.setState = function (state) {
    //TODO
}

/**
 *
 *
 *
 */
TadoConnector.prototype.getState = function () {
    return this.state;
}
