(function(angular){

  "use strict"

  var app = angular.module("ov.publish", ["ov.route", "ov.i18n", "ov.edit"]);

  /**
   * Configures the ov.publish application by adding new routes.
   */
  app.config(["ovRouteProvider", function(ovRouteProvider){

    // Add route /publish/be/videos with authentication
    // (will be automatically mapped to /admin/publish/be/videos
    // instead of /publish/be/videos).
    // Also retrieve the list of videos
    ovRouteProvider.when("/publish/be/videos", {
      templateUrl: "publish/admin/views/videos.html",
      controller: "VideoController",
      title: "VIDEOS.PAGE_TITLE",
      resolve: {
        videos : ["publishService", function(publishService){
          return publishService.loadVideos();
        }]
      }
    });

    // Add route /publish/be/watcher with authentication
    // (will be automatically mapped to /admin/publish/be/watcher instead
    // of /publish/be/watcher).
    // Also retrieve the watcher status
    ovRouteProvider.when("/publish/be/watcher", {
      templateUrl: "publish/admin/views/watcher.html",
      controller: "WatcherController",
      title: "WATCHER.PAGE_TITLE",
      resolve: {
        watcherStatus : ["publishService", function(publishService){
          return publishService.getWatcherStatus();
        }]
      }
    });

    // Add route /publish/be/properties with authentication
    // (will be automatically mapped
    // to /admin/publish/be/properties instead
    // of /publish/be/properties).
    // Also retrieve the list of properties
    ovRouteProvider.when("/publish/be/properties", {
      templateUrl: "publish/admin/views/properties.html",
      controller: "PropertiesController",
      title: "PROPERTIES.PAGE_TITLE",
      resolve: {
        properties : ["publishService", function(publishService){
          return publishService.loadProperties();
        }]
      }
    });

  }]);
  
})(angular);