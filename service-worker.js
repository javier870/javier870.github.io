/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var cacheName = "weatherPWA-step-5-1";
var filesToCache = [
  '/',
  '/index.html',
  '/scripts/app.js',
  '/styles/inline.css',
  '/images/clear.png',
  '/images/cloudy-scattered-showers.png',
  '/images/cloudy.png',
  '/images/cloudy_s_sunny.png',
  '/images/fog.png',
  '/images/ic_add_white_24px.svg',
  '/images/ic_refresh_white_24px.svg',
  '/images/partly-cloudy.png',
  '/images/rain.png',
  '/images/scattered-showers.png',
  '/images/sleet.png',
  '/images/snow.png',
  '/images/thunderstorm.png',
  '/images/wind.png',
];

self.addEventListener('install', function (e) {
  console.log('[ServiceWorker] Install');
  e.waitUntil(caches.open(cacheName).then(function (cache) {
    console.log('[ServiceWorker] Caching app shell');
    return cache.addAll(filesToCache);
  }));
});

self.addEventListener('activate', function (e) {
  console.log('[ServiceWorker] Activate');
  e.waitUntil(
          caches.keys().then(function (keylist) {
    return Promise.all(keylist.map(function (key) {
      console.log('[ServiceWorker] Removing old cache');
      if (key !== cacheName) {
        return cache.delete(key);
      }
    }));
  }));
});

var dataCacheName = "weatherData-v1";

self.addEventListener('fetch', function (e) {
  console.log('[ServiceWorker] Fetch', e.request.url);
  var dataUrl = 'https://publicdata-weather.firebaseio.com/';
  if (e.request.url.indexOf(dataUrl) === 0) {
    e.respondWith(
            fetch(e.request).then(function (response) {
      return caches.open(dataCacheName).then(function (cache) {
        cache.put(e.request.url, response.clone());
        console.log('[ServiceWorker] Fetch&CacheData');
        return response;
      });
    }));
  } else {
    e.respondWith(
            caches.match(e.request).then(function (response) {
      return response || fetch(e.request);
    }));
  }
});
