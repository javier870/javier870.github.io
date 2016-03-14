(function () {
  'use strict';

  var initialWeatherForecast = {
    key: 'newyork',
    label: 'New York, NY',
    currently: {
      time: 1453489481,
      summary: 'Clear',
      icon: 'partly-cloudy-day',
      temperature: 52.74,
      apparentTemperature: 74.34,
      precipprobability: 0.20,
      humidity: 0.77,
      windBearing: 125,
      windSpeed: 1.52
    },
    daily: {
      data: [
        {icon: 'clear-day', temperatureMax: 55, temperatureMin: 34},
        {icon: 'rain', temperatureMax: 55, temperatureMin: 34},
        {icon: 'snow', temperatureMax: 55, temperatureMin: 34},
        {icon: 'sleet', temperatureMax: 55, temperatureMin: 34},
        {icon: 'fog', temperatureMax: 55, temperatureMin: 34},
        {icon: 'wind', temperatureMax: 55, temperatureMin: 34},
        {icon: 'partly-cloudy-day', temperatureMax: 55, temperatureMin: 34}
      ]
    }
  };

  var app = {
    isLoading: true,
    visibleCards: {},
    selectedCities: [],
    spinner: document.querySelector('.loader'),
    cardTemplate: document.querySelector('.cardTemplate'),
    container: document.querySelector('.main'),
    addDialog: document.querySelector('.dialog-container'),
    daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    hasRequestPending: false
  };

  app.saveSelectedCities = function () {
    var selectedCities = JSON.stringify(app.selectedCities);
    //IMPORTANT: See notes about localStorage
    localStorage.selectedCities = selectedCities;
  };


  /*****************************************************************************
   *
   * Event listeners for UI elements
   *
   ****************************************************************************/

  document.getElementById('butRefresh').addEventListener('click', function () {
    // Refresh all of the forecasts
    app.updateForecasts();
  });

  document.getElementById('butAdd').addEventListener('click', function () {
    // Open/show the add new city dialog
    app.toggleAddDialog(true);
  });

  document.getElementById('butAddCity').addEventListener('click', function () {
    // Add the newly selected city
    var select = document.getElementById('selectCityToAdd');
    var selected = select.options[select.selectedIndex];
    var key = selected.value;
    var label = selected.textContent;
    app.getForecast(key, label);
    app.selectedCities.push({key: key, label: label});
    app.saveSelectedCities();
    app.toggleAddDialog(false);
  });

  document.getElementById('butAddCancel').addEventListener('click', function () {
    // Close the add new city dialog
    app.toggleAddDialog(false);
  });


  /*****************************************************************************
   *
   * Methods to update/refresh the UI
   *
   ****************************************************************************/

  // Toggles the visibility of the add new city dialog.
  app.toggleAddDialog = function (visible) {
    if (visible) {
      app.addDialog.classList.add('dialog-container--visible');
    } else {
      app.addDialog.classList.remove('dialog-container--visible');
    }
  };

  // Updates a weather card with the latest weather forecast. If the card
  // doesn't already exist, it's cloned from the template.
  app.updateForecastCard = function (data) {
    var card = app.visibleCards[data.key];
    if (!card) {
      card = app.cardTemplate.cloneNode(true);
      card.classList.remove('cardTemplate');
      card.querySelector('.location').textContent = data.label;
      card.removeAttribute('hidden');
      app.container.appendChild(card);
      app.visibleCards[data.key] = card;
    }
    card.querySelector('.description').textContent = data.currently.summary;
    card.querySelector('.date').textContent =
            new Date(data.currently.time * 1000);
    card.querySelector('.current .icon').classList.add(data.currently.icon);
    card.querySelector('.current .temperature .value').textContent =
            Math.round(data.currently.temperature);
    card.querySelector('.current .feels-like .value').textContent =
            Math.round(data.currently.apparentTemperature);
    card.querySelector('.current .precip').textContent =
            Math.round(data.currently.precipProbability * 100) + '%';
    card.querySelector('.current .humidity').textContent =
            Math.round(data.currently.humidity * 100) + '%';
    card.querySelector('.current .wind .value').textContent =
            Math.round(data.currently.windSpeed);
    card.querySelector('.current .wind .direction').textContent =
            data.currently.windBearing;
    var nextDays = card.querySelectorAll('.future .oneday');
    var today = new Date();
    today = today.getDay();
    for (var i = 0; i < 7; i++) {
      var nextDay = nextDays[i];
      var daily = data.daily.data[i];
      if (daily && nextDay) {
        nextDay.querySelector('.date').textContent =
                app.daysOfWeek[(i + today) % 7];
        nextDay.querySelector('.icon').classList.add(daily.icon);
        nextDay.querySelector('.temp-high .value').textContent =
                Math.round(daily.temperatureMax);
        nextDay.querySelector('.temp-low .value').textContent =
                Math.round(daily.temperatureMin);
      }
    }
    if (app.isLoading) {
      app.spinner.setAttribute('hidden', true);
      app.container.removeAttribute('hidden');
      app.isLoading = false;
    }
  };


  /*****************************************************************************
   *
   * Methods for dealing with the model
   *
   ****************************************************************************/

  // Gets a forecast for a specific city and update the card with the data
  app.getForecast = function (key, label) {
    var url = 'https://publicdata-weather.firebaseio.com/';
    url += key + '.json';
    // Make the XHR to get the data, then update the card

    if ('caches' in window) {
      caches.match(url).then(function (response) {
        if (response) {
          response.json().then(function (json) {
            if (app.hasRequestPending) {
              console.log('updated from cache');
              json.key = key;
              json.label = label;
              app.updateForecastCard(json);
            }
          });
        }
      });
    }

    var request = new XMLHttpRequest();
    app.hasRequestPending = true;
    request.onreadystatechange = function () {
      if (request.readyState === XMLHttpRequest.DONE) {
        if (request.status === 200) {
          var response = JSON.parse(request.response);
          response.key = key;
          response.label = label;
          app.hasRequestPending = false;
          app.updateForecastCard(response);
        }
      }
    };
    request.open('GET', url);
    request.send();
  };

  // Iterate all of the cards and attempt to get the latest forecast data
  app.updateForecasts = function () {
    var keys = Object.keys(app.visibleCards);
    keys.forEach(function (key) {
      app.getForecast(key);
    });
  };

//  var fakeForecast = {
//    key: 'newyork',
//    label: 'New York, NY',
//    currently: {
//      time: 1453489481,
//      summary: 'Clear',
//      icon: 'partly-cloudy-day',
//      temperature: 30,
//      apparentTemperature: 21,
//      precipProbability: 0.80,
//      humidity: 0.17,
//      windBearing: 125,
//      windSpeed: 1.52
//    },
//    daily: {
//      data: [
//        {icon: 'clear-day', temperatureMax: 36, temperatureMin: 31},
//        {icon: 'rain', temperatureMax: 34, temperatureMin: 28},
//        {icon: 'snow', temperatureMax: 31, temperatureMin: 17},
//        {icon: 'sleet', temperatureMax: 38, temperatureMin: 31},
//        {icon: 'fog', temperatureMax: 40, temperatureMin: 36},
//        {icon: 'wind', temperatureMax: 35, temperatureMin: 29},
//        {icon: 'partly-cloudy-day', temperatureMax: 42, temperatureMin: 40}
//      ]
//    }
//  };
  // Uncomment the line below to test with the provided fake data
//   app.updateForecastCard(fakeForecast);


  app.selectedCities = localStorage.selectedCities;
  if (app.selectedCities) {
    app.selectedCities = JSON.parse(app.selectedCities);
    app.selectedCities.forEach(function (city) {
      app.getForecast(city.key, city.label);
    });
  } else {
    app.updateForecastCard(initialWeatherForecast);
    app.selectedCities = [
      {
        key: initialWeatherForecast.key,
        label: initialWeatherForecast.label
      }
    ];
    app.saveSelectedCities();
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
            .then(function (registration) {
              console.log('Service Worker Registred with scope:', registration.scope);
            }).catch(function (err) {
      console.log('ServiceWorker registration failed: ', err);
    });
  }

//  var gulp = require('gulp');
//  var $ = require('gulp-load-plugins')();
//  var del = require('del');
//  var express = require('express');
//  var ghPages = require('gh-pages');
//  var packageJson = require('../package.json');
//  var path = require('path');
//  var runSequence = require('run-sequence');
//  var swPrecache = require('../lib/sw-precache.js');
//
//  var DEV_DIR = 'app';
//  var DIST_DIR = 'dist';
//
//  function runExpress(port, rootDir) {
//    var app = express();
//
//    app.use(express.static(rootDir));
//    app.set('views', path.join(rootDir, 'views'));
//    app.set('view engine', 'jade');
//
//    app.get('/dynamic/:page', function (req, res) {
//      res.render(req.params.page);
//    });
//
//    var server = app.listen(port, function () {
//      var host = server.address().address;
//      var port = server.address().port;
//      console.log('Server running at http://%s:%s', host, port);
//    });
//  }
//
//  function writeServiceWorkerFile(rootDir, handleFetch, callback) {
//    var config = {
//      cacheId: packageJson.name,
//      dynamicUrlToDependencies: {
//        'dynamic/page1': [
//          path.join(rootDir, 'views', 'layout.jade'),
//          path.join(rootDir, 'views', 'page1.jade')
//        ],
//        'dynamic/page2': [
//          path.join(rootDir, 'views', 'layout.jade'),
//          path.join(rootDir, 'views', 'page2.jade')
//        ]
//      },
//      // If handleFetch is false (i.e. because this is called from generate-service-worker-dev), then
//      // the service worker will precache resources but won't actually serve them.
//      // This allows you to test precaching behavior without worry about the cache preventing your
//      // local changes from being picked up during the development cycle.
//      handleFetch: handleFetch,
//      logger: $.util.log,
//      runtimeCaching: [{
//          // See https://github.com/GoogleChrome/sw-toolbox#methods
//          urlPattern: /runtime-caching/,
//          handler: 'cacheFirst',
//          // See https://github.com/GoogleChrome/sw-toolbox#options
//          options: {
//            cache: {
//              maxEntries: 1,
//              name: 'runtime-cache'
//            }
//          }
//        }],
//      staticFileGlobs: [
//        rootDir + '/css/**.css',
//        rootDir + '/**.html',
//        rootDir + '/images/**.*',
//        rootDir + '/js/**.js'
//      ],
//      stripPrefix: rootDir + '/',
//      // verbose defaults to false, but for the purposes of this demo, log more.
//      verbose: true
//    };
//
//    swPrecache.write(path.join(rootDir, 'service-worker.js'), config, callback);
//  }
//
//  gulp.task('default', ['serve-dist']);
//
//  gulp.task('build', function (callback) {
//    runSequence('copy-dev-to-dist', 'generate-service-worker-dist', callback);
//  });
//
//  gulp.task('clean', function () {
//    del.sync([DIST_DIR]);
//  });
//
//  gulp.task('serve-dev', ['generate-service-worker-dev'], function () {
//    runExpress(3001, DEV_DIR);
//  });
//
//  gulp.task('serve-dist', ['build'], function () {
//    runExpress(3000, DIST_DIR);
//  });
//
//  gulp.task('gh-pages', ['build'], function (callback) {
//    ghPages.publish(path.join(__dirname, DIST_DIR), callback);
//  });
//
//  gulp.task('generate-service-worker-dev', function (callback) {
//    writeServiceWorkerFile(DEV_DIR, false, callback);
//  });
//
//  gulp.task('generate-service-worker-dist', function (callback) {
//    writeServiceWorkerFile(DIST_DIR, true, callback);
//  });
//
//  gulp.task('copy-dev-to-dist', function () {
//    return gulp.src(DEV_DIR + '/**')
//            .pipe(gulp.dest(DIST_DIR));
//  });

})();
