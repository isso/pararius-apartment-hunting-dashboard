const EventEmitter = require("events");

const axios = require("axios");

const throttledQueue = require('throttled-queue');

const config = require("./config");

const throttle = throttledQueue(config.googleApisMaxRequestPerSecond, 1000);

module.exports = class DistanceService extends EventEmitter {

    constructor(destination, mode, apiKey) {
        super();
        this.destination = destination;
        this.mode = mode;
        this.apiKey = apiKey;
    }

    getCoordinates(properties) {
        for (let i = 0; i < properties.length; i++) {
            throttle(() => this.doCoordinatesRequest(properties[i]))
        }
    }

    doCoordinatesRequest(property) {
        let self = this;
        axios.get(this._getGeoCodingApiUrl(property.zipCode.replace(" ", "+") + "+" + property.city)).then(response => {
            let result = response.data;
            if (result["status"] == "OK") {
                let lat = result["results"][0]["geometry"]["location"]["lat"];
                let lng = result["results"][0]["geometry"]["location"]["lng"];
                self.emit("coordinates", {
                    id: property.id,
                    coordinates: {
                        lat: lat,
                        lng: lng
                    }
                })
            }
        }).catch(console.log)
    }

    doDistanceRequest(originsQuery, queryString) {
        let self = this;
        axios.get(this._getDistanceMatrixApiUrl(queryString)).then(response => {
            let result = response.data;
            if (result["status"] == "OK" && result["rows"].length == originsQuery.length) {
                for (let j = 0; j < result["rows"].length; j++) {
                    if (result["rows"][j]["elements"][0]["status"] == "OK") {
                        let distance = result["rows"][j]["elements"][0]["distance"]["value"];
                        let duration = result["rows"][j]["elements"][0]["duration"]["value"];
                        self.emit("distance", {
                            id: originsQuery[j].id,
                            distance: distance,
                            duration: duration,
                            navigation: `https://www.google.com/maps/dir/${originsQuery[j].zipCode.replace(" ","+")}+Netherlands/${this.destination.replace(" ","+")}+Netherlands`
                        })
                    }
                }
            }
        }).catch(console.log)
    }

    getDistances(properties) {
        const originsQuery = []
        const size = 25;
        for (let i = 0; i < properties.length; i += size) {
            originsQuery.push(properties.slice(i, i + size).map(p => {
                return {
                    id: p.id,
                    zipCode: p.zipCode
                }
            }));
        }

        for (let i = 0; i < originsQuery.length; i++) {
            let queryString = originsQuery[i].map(p => p.zipCode).join("|");
            throttle(() => this.doDistanceRequest(originsQuery[i], queryString))
        }
    }



    _getDistanceMatrixApiUrl(origins) {
        return `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${this.destination}&mode=${this.mode}&region=NL&key=${this.apiKey}`
    }

    _getGeoCodingApiUrl(property) {
        return `https://maps.googleapis.com/maps/api/geocode/json?address=${property}&region=NL&key=${this.apiKey}`
    }
}