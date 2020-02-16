'use strict';

const EventEmitter = require("events");

const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

var fs = require('fs');
var dir = './db';

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}

const adapter = new FileSync('./db/db.json')
const db = low(adapter)

db.defaults({
        properties: [],
        config: {}
    })
    .write();


module.exports = class Db extends EventEmitter {

    addProperty(property) {
        if (property && property.hasOwnProperty("id") && !this.hasProperty(property.id)) {
            property.state = "new"
            db.get('properties')
                .push(property)
                .write()
            this.emit("added", property)
        }
    }

    getProperty(id) {
        return db.get('properties').find(p => p.id == id).value()
    }

    hasProperty(id) {
        return db.get('properties').find(p => p.id == id).value() != undefined
    }

    hideProperty(id) {
        this.updateProperty(id, {
            state: "hidden"
        }).write();
    }

    getCount() {
        return db.get('properties')
            .size()
            .value()
    }

    updateProperty(id, property) {
        db.get('properties')
            .find({
                id: id
            })
            .assign(property)
            .write()
        this.emit("updated", property)
    }

    getProperties(state) {
        switch (state) {
            case "all":
                return db.get('properties').value();
            case "new":
                return db.get('properties').filter(p => p.state == "new").value();
            case "hidden":
                return db.get('properties').filter(p => p.state == "hidden").value();
            case "interesting":
                return db.get('properties').filter(p => p.state == "interesting").value();
            case "shortlisted":
                return db.get('properties').filter(p => p.state == "shortlisted").value();
            case "not_available":
                return db.get('properties').filter(p => p.state == "not_available").value();
            case "visible":
                return db.get('properties').filter(p => p.state != "hidden").value();
            default:
                return db.get('properties').value();
        }
    }

    getPropertiesWithoutDistance() {
        return db.get('properties').filter(p => !db._.has(p, "distance") || !db._.has(p, "duration") || !db._.has(p, "navigation")).value()
    }

    getPropertiesWithoutCoordinates() {
        return db.get('properties').filter(p => !db._.has(p, "coordinates")).value()
    }

    deleteAllDistances() {
        return db.get('properties').filter(p => db._.has(p, "distance") || db._.has(p, "duration") || !db._.has(p, "navigation") || !db._.has(p, "coordinates")).each(p => {
            db._.unset(p, "distance")
            db._.unset(p, "duration")
            db._.unset(p, "navigation")
            db._.unset(p, "coordinates")
        }).write()
    }
}