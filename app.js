const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const ScrapingService = require("./scraping-service");
const DistanceService = require("./mapping-service");
const Db = require("./db");

const config = require("./config");

const indexRouter = require('./routes/index');
const propertiesRouter = require('./routes/properties');

const app = express();

const bodyParser = require('body-parser');
const cors = require('cors');

let scrapingService = new ScrapingService(config.url, config.updateFrequency);
let db = new Db();
let distanceService = new DistanceService(config.commuteAddress, config.commuteMode, config.googleApi);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(cors());

app.use('/', indexRouter);
app.use('/properties', propertiesRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

scrapingService.on("property", (property) => {
  console.log("Got property: ", property.id, property.name)
  db.addProperty(property)
})

distanceService.on("distance", (property) => {
  console.log("Updating property distance: ", property.id)
  db.updateProperty(property.id, property)
})

distanceService.on("coordinates", (property) => {
  console.log("Updating property coordinates: ", property.id)
  db.updateProperty(property.id, property)
})

scrapingService.on("start", () => {
  console.log("Scraping started")
  distanceService.getDistances(db.getPropertiesWithoutDistance())
})
scrapingService.on("end", () => {
  console.log("Scraping Ended")
  distanceService.getDistances(db.getPropertiesWithoutDistance())
  distanceService.getCoordinates(db.getPropertiesWithoutCoordinates());
})
scrapingService.on("error", (error) => {
  console.log(error)
})

db.on("added", (property) => {
  console.log("Property added: ", property.id)
})

db.on("updated", (property) => {
  console.log("Property updated: ", property.id)
})

scrapingService.start();
module.exports = app;