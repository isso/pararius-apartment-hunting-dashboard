let config = {};

// We will parse the listings from this URL, open it in your browser first, adjust the filters and make sure it is in the list mode not the maps.
config.url = "https://www.pararius.com/apartments/amsterdam/1500-1900/75m2/2-bedrooms/furnished";

// Frequency of scraping and updates from Pararius in minutes. (Minimum: 15)
config.updateFrequency = 60;

// Used to calculate distance and commute time, can be any string. Please try it on Google maps first.
config.commuteAddress = "1011 DJ, Amsterdam"

// Used to calculate distance and commute time to commuteAddress. It can be: driving, walking, bicycling or transit. (transit calculate it as if you are commuting now)
config.commuteMode = "bicycling";

// Max results per page in the dashboard.
config.resultsPerPage = 20

// So as not to leech Pararius, a sane limit has to be in place.
config.maxScrapingResults = 500

// Maximum requests per second for Pararius.
config.parariusMaxRequestPerSecond = 10

// Maximum requests per second for Google APIs.
config.googleApisMaxRequestPerSecond = 10

// Very important to calculate distance, coordinates, and displaying maps in the dashboard.
// These APIs have to be enabled on https://console.developers.google.com/: Geocoding API, Maps JavaScript API, and Distance Matrix API
config.googleApi = "GOOGLE_API_KEY"

// Where to serve the app
config.port = 8080

module.exports = config;