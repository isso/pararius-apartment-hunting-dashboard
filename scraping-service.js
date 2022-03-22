'use strict';

const EventEmitter = require("events");

const axios = require("axios");
const cheerio = require("cheerio");
const throttledQueue = require('throttled-queue');

const config = require("./config");

const throttle = throttledQueue(config.parariusMaxRequestPerSecond, 1000);

const URL_REGEX = /^(https:\/\/)(www.)?(pararius.com\/apartments)(\/(?!page)[a-zA-z0-9\-]+)+(\/page\-\d{0,2})?(\/?)/;
const MAX_RESULT = config.maxScrapingResults;

module.exports = class ScrapingService extends EventEmitter {

  constructor(url, updateFrequency, cookies) {
    super();
    this.scrapingWorker = null;
    this.url = url;
    this.cookies = cookies;
    this.updateFrequency = updateFrequency < 15 ? 15 : updateFrequency;
    this.isWorking = false;
    this._sanitizeUrl();
  }

  start() {
    if (this._isUrlValid() && !this.isWorking) {
      let self = this;
      this.stop();
      this._startScraping();
      this.scrapingWorker = setInterval(() => {
        if (!self.isWorking)
          self._startScraping();
      }, this.updateFrequency * 60 * 1000);
    }
  }


  stop() {
    if (this.scrapingWorker) clearInterval(this.scrapingWorker);
    this.isWorking = false;
  }

  _fetchWebsite(pageNumber) {
    let self = this;
    var promise = new Promise(function (resolve, reject) {
      throttle(() => {
        axios.get(self.url + pageNumber, {
          headers: {
            "Cookie": this.cookies,
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.74 Safari/537.36"
          },
          httpsAgent: self.httpsAgent
        }).then(function (result) {
            resolve(cheerio.load(result.data));
          })
          .catch(function (error) {
            reject(error);
          })
      });
    });
    return promise;
  }

  _isUrlValid() {
    return URL_REGEX.test(this.url);
  }

  _startScraping() {
    this.isWorking = true;
    let self = this;
    self.emit("start")
    self._fetchWebsite(1).then(($) => {
      self._scrap($);
      let count = parseInt($("div.search-results-wrapper > div.header > p.count").clone().children().remove().end().text())
      count = count > MAX_RESULT ? MAX_RESULT : count
      const pages = Math.ceil(count / 30)
      if (pages > 1) {
        let unProcessedPages = pages - 1;
        for (let i = 2; i <= pages; i++) {
          self._fetchWebsite(i).then(($) => {
            unProcessedPages--;
            self._scrap($)
            if (unProcessedPages == 0 && self.isWorking) {
              self.isWorking = false;
              self.emit("end")
            }
          }).catch((error) => {
            unProcessedPages--;
            self.emit("error", error)
            if (unProcessedPages == 0 && self.isWorking) {
              self.isWorking = false;
              self.emit("end")
            }
          });
        }
      } else {
        self.isWorking = false;
        self.emit("end");
      }
    }).catch(error => {
      self.emit("error", error)
      self.isWorking = false;
      self.emit("end");
    });
  }

  _sanitizeUrl() {
    if (this._isUrlValid()) {
      this.url = this.url.match(URL_REGEX)[0];
      const matchingGroups = this.url.match(URL_REGEX);
      if (matchingGroups[5] && matchingGroups[5].length > 0) {
        this.url = this.url.substring(0, this.url.indexOf("/page-"));
      }
      this.url = this.url + "/page-"
    }
  }

  _scrap($) {
    let self = this;
    $("ul.search-list li.search-list__item").each((_, element) => {
      if ($(element).find(".ad-unit").length > 0) {
        return;
      }
      let id = $(element).find("a.listing-search-item__link").attr("href").split("/")[3];
      let price = parseInt($(element).find(".listing-search-item__price").text().replace(/[€,]+/g, '').trim());
      let name = $(element).find(".listing-search-item__title").text().replace(/\s\s+/g, ' ').trim();
      let url = "https://www.pararius.nl" + $(element).find(".listing-search-item__link").attr("href").trim();

      let location = $(element).find(".listing-search-item__location").text().trim().split(" ");
      let zipCode = location[0] + " " + location[1];
      let city = location[2];
      let neighborhood = location[3].replace('(', '').replace(')', '');
      let estateAgentName = $(element).find(".listing-search-item__info").text().replace(/\s\s+/g, ' ').trim();
      let estateAgentLink = "https://www.pararius.nl" + $(element).find(".listing-search-item__link").attr("href").trim();
      let surfaceArea = parseInt($(element).find(".illustrated-features__item--surface-area").text().replace(/[m²]+/g, '').trim());
      let bedrooms = parseInt($(element).find(".illustrated-features__item--number-of-rooms").text().replace(/[room]+/g, '').trim());
      let furniture = $(element).find(".illustrated-features__item--interior").text().trim();
      let availability = $(element).find(".listing-search-item__availability").text().trim();
      let locationUrl = `https://www.google.com/maps/place/${zipCode.replace(" ","+")}+${city}`
      self.emit("property", {
        id: id,
        price: price,
        name: name,
        url: url,
        zipCode: zipCode,
        city: city,
        neighborhood: neighborhood,
        agentName: estateAgentName,
        agentUrl: estateAgentLink,
        surfaceArea: surfaceArea,
        bedrooms: bedrooms,
        furniture: furniture,
        availability: availability,
        discoveryDate: new Date().toLocaleDateString('en-NL'),
        locationUrl: locationUrl
      })
    });
  }
}