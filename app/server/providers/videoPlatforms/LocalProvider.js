'use strict';

/**
 * @module publish-providers
 */

// Module dependencies
var path = require('path');
var util = require('util');
var async = require('async');
var shortid = require('shortid');
var openVeoAPI = require('@openveo/api');
var VideoPlatformProvider = process.requirePublish('app/server/providers/VideoPlatformProvider.js');

/**
 * Defines a LocalProvider class to interact with local platform
 * (https://local.com/).
 *
 * @example
 *     // providerConf example
 *     {
 *       "clientId" : "****",
 *       "clientSecret" : "****",
 *       "accessToken" : "****"
 *     }
 *
 * @class LocalProvider
 * @constructor
 * @extends VideoPlatformProvider
 * @param {Object} providerConf A local configuration object
 */
function LocalProvider(providerConf) {
  VideoPlatformProvider.call(this, providerConf);

  this.localConf = providerConf;
}

module.exports = LocalProvider;
util.inherits(LocalProvider, VideoPlatformProvider);

/**
 * Uploads a video to the Local platform.
 *
 * TODO Find a way to avoid sending default preset request on Local
 * for each upload.
 *
 * @method upload
 * @async
 * @param {String} videoFilePath System path of the video to upload
 * @param {Function} callback The function to call when the upload
 * is done
 *   - **Error** The error if an error occurred, null otherwise
 */
LocalProvider.prototype.upload = function(videoFilePath, callback) {
  var self = this;

  // Retrieve video tmp directory
  // e.g E:/openveo/node_modules/@openveo/publish/tmp/
  var mediaId;

  async.series([

    // Checks user quota
    function(callback) {
      var tmpId = shortid.generate();
      var videoFinalPath = path.normalize(self.localConf.vodFilePath + tmpId + '/video.mp4');
      openVeoAPI.fileSystem.copy(videoFilePath, path.normalize(videoFinalPath), function(error) {
        if (error) {
          process.logger.warn(error.message, {
            action: 'copyVideo',
            mediaId: tmpId
          });

          callback(error);
        } else {
          mediaId = tmpId;
          callback();
        }
      });
    }
  ], function(error) {
    callback(error, mediaId);
  });
};

/**
 * Gets information about a video hosted by Local.
 *
 * @example
 *     // Returned data example
 *     {
 *       available : true,
 *       sources : {
 *         adaptive:[
 *         {
 *           mimeType : application/dash+xml,
 *           link : "http://192.168.1.20:1935/openveo/mp4:sample.mp4/manifest.mpd"
 *         },
 *         ...
 *       ]
 *     }
 *
 * @method getVideoInfo
 * @async
 * @param {String} mediaId The local id of the video
 * @param {String} expectedDefintion The expected video definition (e.g. 720, 1080) _ not use on local
 * @param {Function} callback The function to call when it's done
 *   - **Error** The error if an error occurred, null otherwise
 *   - **Object** Information about the video
 */
LocalProvider.prototype.getVideoInfo = function(mediaIds, expectedDefinition, callback) {
  var self = this;
  if (!mediaIds) {
    callback(new Error('media id should be defined'), null);
    return;
  }

  var infos = {sources: [], available: true};
  mediaIds.forEach(function(mediaId) {
    var info = {};
    var basePath = self.localConf.streamPath + mediaId + '/video.mp4';
    info.files = [{
      quality: 2, // 0 = mobile, 1 = sd, 2 = hd
      height: expectedDefinition,
      link: basePath
    }];
    infos.sources.push(info);
  });

  callback(null, infos);
};
