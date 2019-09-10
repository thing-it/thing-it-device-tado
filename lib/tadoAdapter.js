const q = require('q');
const Tado = require('node-tado-client');


function TadoAdapter() {
  TadoAdapter.prototype.initialize = function(username, password, homeId) {
    let deferred = q.defer();

    this.tadoApi = new Tado();
    this.tadoApi.login(username, password)
      .then(() => {
        this.tadoApi.getMe()
          .then(resp => {
            this.homes = resp.homes;
            if (!homeId) {
              this.homeId = this.homes[0].id;
            } else {
              this.homeId = homeId;
            }
            deferred.resolve(this.homeId);
          })
          .catch(err => {
            deferred.reject(err);
          });
      })
      .catch(err => {
        deferred.reject(err);
      });
    return deferred.promise;
  };

  /**
   * @return zones
   */
  TadoAdapter.prototype.getZones = function() {
    let deferred = q.defer();

    this.tadoApi.getZones(this.homeId)
      .then(resp => {
        let zones = [];
        for (let zone of resp) {
          zones.push({
            id: zone.id,
            name: zone.name,
          });
        }
        deferred.resolve(zones);
      })
      .catch((err) => {
        this.logError('Unable to get Zones with error: ', err);
      });


    return deferred.promise;
  };

  /**
   * @param zoneId
   * @return res
   */
  TadoAdapter.prototype.getZoneState = function(zoneId) {
    let deferred = q.defer();
    this.tadoApi.getZoneState(this.homeId, zoneId)
      .then((res) => {
        deferred.resolve(res);
      }).catch((err) => {
      deferred.reject(err);
    });
    return deferred.promise;
  };

  /**
   *
   */
  TadoAdapter.prototype.getWeather = function() {
    let deferred = q.defer();
    this.tadoApi.getWeather(this.homeId)
      .then((res) => {
        deferred.resolve(res);
      })
      .catch((err) => {
        deferred.reject(err);
      });
    return deferred.promise;
  };

  /**
   *
   */
  TadoAdapter.prototype.setZoneOverlay = function(zoneId, setpoint) {
    let deferred = q.defer();
    this.tadoApi.setZoneOverlay(this.homeId, zoneId, 'on', setpoint, 'auto')
      .then((resp) => {
        deferred.resolve(resp);
      })
      .catch((err) => {
        deferred.reject(err);
      });
    return deferred.promise;
  };
}


module.exports = TadoAdapter;
