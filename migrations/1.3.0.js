'use strict';

var async = require('async');
var openVeoAPI = require('@openveo/api');
var db = openVeoAPI.applicationStorage.getDatabase();


module.exports.update = function(callback) {
  process.logger.info('Publish 1.3.0 migration launched.');

  // Prefix collection with the module name : publish
  db.renameCollection('test', 'publish_properties', function(error, value) {
    console.log("properties: " + error);
    if (error) {
      callback(error);
      return;
    }
  });
  db.renameCollection('configurations', 'publish_configurations', function(error, value) {
    console.log("configurations: " + error);
    if (error) {
      callback(error);
      return;
    }
  });
  db.renameCollection('videos', 'publish_videos', function(error, value) {
    console.log("videos: " + error);
    if (error) {
      callback(error);
      return;
    }
  });
  
  db.get('publish_videos', {}, null, null, function(error, value) {
    if (error) {
      callback(error);
      return;
    }

    // No need to change anything
    if (!value || !value.length) callback();

    else {
      var series = [];

      value.forEach(function(video) {
        if (video.files) {

          // backup files property in sources property
          if (!video.sources) {
            series.push(function(callback) {
              db.update('publish_videos', {id: video.id}, {sources: {files: video.files}}, function(error) {
                callback(error);
              });
            });
          }

          // delete files property
          if (video.files) {
            series.push(function(callback) {
              db.removeProp('publish_videos', 'files', {id: video.id}, function(error) {
                callback(error);
              });
            });
          }
        }
      });

      async.series(series, function(error) {
        if (error) {
          callback(error);
          return;
        }
        process.logger.info('Publish 1.3.0 migration done.');
        callback();
      });
    }
  });
};
