module.exports = {
    metadata: {
        plugin: "smartRadiatorThermostat",
        label: "Smart Radiator Thermostat",
        role: "actor",
        family: "thermostat",
        deviceTypes: ["tadoConnector/tadoConnector"],
        services: [],
        events: [],
        state: [],
        configuration: []
    },
    create: function () {
        return new SmartRadiatorThermostat();
    }
};

var q = require('q');

/**
 *
 */
function SmartRadiatorThermostat() {
    /**
     *
     */
    SmartRadiatorThermostat.prototype.start = function () {
        let deferred = q.defer();

        // this.logLevel = 'debug';

        this.update();

        if (this.isSimulated()) {

            //TODO
            deferred.resolve();
        }
        else {


            //TODO
            deferred.resolve();
        }

        return deferred.promise;
    };


    /**
     *
     */
    SmartRadiatorThermostat.prototype.getState = function () {
        //this.update();
        return this.state;
    };

    /**
     *
     */
    SmartRadiatorThermostat.prototype.update = function () {

        let deferred = q.defer();
        //TODO

        return deferred.promise;


    };


    /**
     *
     */
    SmartRadiatorThermostat.prototype.setState = function (state) {
        this.state = state;
    };

    /**
     *
     */
    SmartRadiatorThermostat.prototype.stop = function () {
        if (this.isSimulated()) {

        } else {

        }
    }
}