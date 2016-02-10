'use strict';

/**
 * @module publish-providers
 */

// Module dependencies
var fs = require('fs');

var util = require('util');
var mime = require('mime');
var async = require('async');

var google = require('googleapis');
var youtube = google.youtube('v3');
var YoutubeResumableUpload = process.requirePublish('app/server/helper/youtubeResumableUpload.js');

var VideoPlatformProvider = process.requirePublish('app/server/providers/VideoPlatformProvider.js');
var googleOAuthHelper = process.requirePublish('app/server/helper/googleOAuthHelper.js');

var uploadMethods = ['uploadClassic', 'uploadResumable'];
var privacyStatus = ['public', 'private', 'unlisted'];

/**
 * Defines a YoutubeProvider class to interact with youtube platform
 * (https://youtube.com/).
 *
 * @class YoutubeProvider
 * @constructor
 * @extends VideoPlatformProvider
 * @param {Object} providerConf A youtube configuration object
 */
function YoutubeProvider(providerConf) {
  VideoPlatformProvider.call(this, providerConf);
  this.uploadMethod = uploadMethods.indexOf(providerConf.uploadMethod) > -1 ?
    providerConf.uploadMethod : 'uploadClassic';
  this.privacy = privacyStatus.indexOf(providerConf['privacy']) > -1 ? providerConf['privacy'] : 'public';
}

module.exports = YoutubeProvider;
util.inherits(YoutubeProvider, VideoPlatformProvider);

/**
 * Uploads a video to the Youtube platform.
 *
 *
 * @example
 *     // videoPackage example
 *     {
 *       'id' : 1422731934859,
 *       'type' : 'vimeo',
 *       'path' : 'C:/Temp/',
 *       'originalPackagePath' : 'C:/Temp/video-package.tar',
 *       'packagePath' : 'E:/openveo/node_modules/openveo-publish/tmp/1422731934859.tar',
 *       'metadata' : {
 *         'profile': '2',
 *         'audio-input': 'analog-top',
 *         'date': '13/01/1970 20:36:15',
 *         'format': 'mix-pip',
 *         'rich-media': true,
 *         'profile-settings': {
 *           'video-bitrate': 1000000,
 *           'id': '2',
 *           'video-height': 720,
 *           'audio-bitrate': 128000,
 *           'name': 'Haute définition'
 *         },
 *         'id': '1970-01-13_20-36-15',
 *         'format-settings': {
 *           'source': 'mix-raw',
 *           'id': 'mix-pip',
 *           'name': 'Mélangé caméra incrustée',
 *           'template': 'pip'
 *         },
 *         'date-epoch': 1107375,
 *         'storage-directory': '/data/1970-01-13_20-36-15',
 *         'filename': 'video.mp4',
 *         'duration': 20
 *       }
 *     }
 *
 * @method upload
 * @async
 * @param {Object} videoPackage Video package to upload
 * @param {Function} callback The function to call when the upload
 * is done
 *   - **Error** The error if an error occurred, null otherwise
 */
YoutubeProvider.prototype.upload = function(videoFilePath, callback) {

  /* list of possible upload params :
   * {
   *  autoLevels: true,
   *  stabilize: true,
   *  resource: {
   *    snippet: {
   *      title: 'Video name',
   *      description: 'Video description'
   *      tags: [],
   *      categoryId: undefined
   *    },
   *    status: {
   *      publishAt: undefined,
   *      privacyStatus: 'private'
   *      embeddable: undefined,
   *      publicStatsViewable: undefined,
   *      license: undefined
   *    }
   *    recordingDetails: {
   *      locationDescription: undefined,
   *      location: {latitude: undefined, longitude: undefined},
   *      recordingDate: undefined
   *    }
   *  }
   * }
   */

  var uploadParams = {
    resource: {
      snippet: {
        title: 'Video name',
        description: 'Video description'
      },
      status: {
        privacyStatus: this.privacy
      }
    }
  };
  uploadParams.part = (['id'].concat(Object.keys(uploadParams.resource))).join(',');
  this[this.uploadMethod](videoFilePath, uploadParams, callback);
};

/**
 * Upload to youtube in the classic way, using their api
 *
 * @param {string} videoFilePath the path to the video to upload
 * @param {object} uploadParams params to send to youtube when calling their api
 * @param {function} callback callback function
 */
YoutubeProvider.prototype.uploadClassic = function(videoFilePath, uploadParams, callback) {
  var mediaId;
  var video = fs.createReadStream(videoFilePath);

  uploadParams.media = {
    mediaType: mime.lookup(videoFilePath),
    body: video
  };

  async.series([

    // Check auth
    function(callback) {
      googleOAuthHelper.getFreshToken(function(error, tokens) {
        if (error) {
          callback(error);
          return;
        }
        googleOAuthHelper.oauth2Client.setCredentials(tokens);
        callback();
      });
    },

    // Upload video
    function(callback) {
      uploadParams.auth = googleOAuthHelper.oauth2Client;
      youtube.videos.insert(uploadParams, function(error, video) {
        if (error) {
          callback(error);
          return;
        }
        mediaId = video.id;
        callback();
      });

    }
  ], function(error) {
    callback(error, mediaId);
  });

};


/**
 * Upload to youtube in a fail safe way, using resumable uploads
 * The upload can fail 3 times before failing globally, each times it fails it perform an upload again
 * starting where it previously failed (ie: not re-upoloading all the video)
 *
 * @param {string} videoFilePath the path to the video to upload
 * @param {object} uploadParams params to send to youtube when calling their api
 * @param {function} callback callback function
 */
YoutubeProvider.prototype.uploadResumable = function(videoFilePath, uploadParams, callback) {
  var mediaId;
  var stats;

  async.series([

    // Check auth
    function(callback) {
      googleOAuthHelper.getFreshToken(function(error, tokens) {
        if (error) {
          callback(error);
          return;
        }
        uploadParams.auth = tokens;
        callback();
      });
    },

    // Get file size
    function(callback) {
      fs.stat(videoFilePath, function(error, st) {
        if (error) {
          callback(error);
          return;
        }
        stats = st;
        callback();
      });
    },

    // Upload video
    function(callback) {
      if (!uploadParams.hasOwnProperty('auth') || !uploadParams.auth) {
        callback(new Error('Auth has not been set correctly'));
        return;
      }
      var resumableUpload = new YoutubeResumableUpload();

      resumableUpload.tokens = uploadParams.auth;
      resumableUpload.filepath = videoFilePath;
      resumableUpload.stats = stats;
      resumableUpload.metadata = uploadParams.resource;
      resumableUpload.retry = 3; // Maximum retries when upload failed.

      resumableUpload.on('progress', function(progress) {
        process.logger.debug('Upload progress', progress);
      });
      resumableUpload.on('error', function(error) {
        process.logger.debug('Upload error', error);
        if (resumableUpload.retry === 0) {
          callback(error);
        }
      });
      resumableUpload.on('success', function(video) {
        video = JSON.parse(video);
        mediaId = video.id;
        callback();
      });
      resumableUpload.upload();
    }
  ], function(error) {
    callback(error, mediaId);
  });

};

/**
 * Gets information about a video hosted by Youtube.
 *
 * @example
 *     // Returned data example
 *     {
 *       available : true,
 *       pictures : [],
 *       files : [],
 *       mediaId : '123456'
 *     }
 *
 * @method getVideoInfo
 * @async
 * @param {String} mediaId The Youtube id of the video
 * @param {Function} callback The function to call when it's done
 *   - **Error** The error if an error occurred, null otherwise
 *   - **Object** Information about the video
 */
YoutubeProvider.prototype.getVideoInfo = function(mediaId, definition, callback) {
  if (!mediaId) {
    callback(new Error('media id should be defined'), null);
    return;
  }

  // Files and pictures are not necessary: youtube player manage its own data
  callback(null, {available: true, files: [], pictures: [], mediaId: mediaId});
};
