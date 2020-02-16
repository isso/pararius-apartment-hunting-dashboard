var express = require("express");
var router = express.Router();

const Db = require("../db");

const config = require("../config");

const db = new Db();

const RESULT_PER_PAGE = config.resultsPerPage;


router.get("(/(|new|interesting|shortlisted|hidden|all|not_available))?(/page-:page)?", function (req, res) {
  let state = "new"
  if (req.params['0'] && req.params['0'].length > 1) {
    state = req.params['0'].slice(1);
  }
  let properties = db.getProperties(state)
  let page = req.params.page ? req.params.page : 1;
  let totalPages = Math.ceil(properties.length / RESULT_PER_PAGE)
  if (page < 0 || page > totalPages) {
    page = 1;
  }
  const initialLocation = (page - 1) * RESULT_PER_PAGE;
  const endLocation = initialLocation + RESULT_PER_PAGE;
  let results = properties.slice(initialLocation, endLocation);
  res.render("index", {
    properties: results,
    pagination: {
      total: properties.length,
      count: results.length,
      pages: totalPages,
      page: parseInt(page),
      state: state
    }
  });
});

router.get("/map(/(|new|interesting|shortlisted|hidden|all|not_available))?(/page-:page)?", function (req, res) {
  let state = "new"
  if (req.params['0'] && req.params['0'].length > 1) {
    state = req.params['0'].slice(1);
  }
  let properties = db.getProperties(state)
  let page = req.params.page ? req.params.page : 1;
  let totalPages = Math.ceil(properties.length / RESULT_PER_PAGE)
  if (page < 0 || page > totalPages) {
    page = 1;
  }
  const initialLocation = (page - 1) * RESULT_PER_PAGE;
  const endLocation = initialLocation + RESULT_PER_PAGE;
  let results = properties.slice(initialLocation, endLocation);
  res.render("map", {
    apiKey: config.googleApi,
    properties: results,
    pagination: {
      total: properties.length,
      count: results.length,
      pages: totalPages,
      page: parseInt(page),
      state: state
    }
  });
});

module.exports = router;