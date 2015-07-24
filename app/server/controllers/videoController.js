"use strict"

/**
 * @module publish-controllers
 */

/**
 * Provides route actions for all requests relative to videos.
 *
 * @class videoController
 */

// Module dependencies
var winston = require("winston");
var openVeoAPI = require("openveo-api");
var errors = process.requirePublish("app/server/httpErrors.js");

var VideoModel = process.requirePublish("app/server/models/VideoModel.js");
var videoModel = new VideoModel();
var applicationStorage = openVeoAPI.applicationStorage;

// Retrieve logger
var logger = winston.loggers.get("openveo");

/**
 * Displays video player template.
 *
 * Checks first if the video id is valid and if the video is published
 * before returning the template.
 *
 * @method displayVideoAction
 * @static
 */
module.exports.displayVideoAction = function(request, response, next){
  response.locals.scripts = [];
  response.locals.css = [];

  // Retrieve openveo sub plugins
  var plugins = applicationStorage.getPlugins();

  // Got sub plugins
  if(plugins){
    var player = false;
    plugins.forEach(function(subPlugin){
      if(subPlugin.name === "publish"){
        if(subPlugin.custom){
          response.locals.scripts = response.locals.scripts.concat(subPlugin.custom.scriptFiles || []);
          response.locals.css = response.locals.css.concat(subPlugin.custom.cssFiles || []);
        }
      }
    });

    response.render("player", response.locals);
  }
  
  // No sub plugins
  else
    next();
};

/**
 * Gets information about a video.
 *
 * Expects one GET parameter :
 *  - **id** The id of the video
 *
 * @example
 *     {
 *       video : {
 *         id : 123456789,
 *         ...
 *       }
 *     }
 *
 * @method getVideoAction
 * @static
 */
module.exports.getVideoAction = function(request, response, next){
  if(request.params.id){
    videoModel.getOne(request.params.id, function(error, video){
      if(error)
        next(errors.GET_VIDEO_ERROR);
      else
        response.send({ video : video });
    });
  }

  // Missing id of the video
  else
    next(errors.GET_VIDEO_MISSING_PARAMETERS);
};

/**
 * Publishes a video.
 *
 * Expects one GET parameter :
 *  - **id** The id of the video
 *
 * Change the state of the video to published
 *
 * @example
 *     {
 *       state : 7
 *     }
 *
 * @method publishVideoAction
 * @static
 */
module.exports.publishVideoAction = function(request, response, next){
  if(request.params.id){
    videoModel.publishVideo(request.params.id, function(error){
      if(error)
        next(errors.PUBLISH_VIDEO_ERROR);
      else
        response.send({state : VideoModel.PUBLISHED_STATE});
    });
  }

  // Missing type and / or id of the video
  else
    next(errors.PUBLISH_VIDEO_MISSING_PARAMETERS);
};

/**
 * Unpublishes a video.
 *
 * Expects one GET parameter :
 *  - **id** The id of the video
 *
 * Change the state of the video to unpublished.
 *
 * @example
 *     {
 *       state : 6
 *     }
 *
 * @method unpublishVideoAction
 * @static
 */
module.exports.unpublishVideoAction = function(request, response, next){
  if(request.params.id){
    videoModel.unpublishVideo(request.params.id, function(error){
      if(error)
        next(errors.UNPUBLISH_VIDEO_ERROR);
      else
        response.send({state : VideoModel.SENT_STATE});
    });
  }

  // Missing type and / or id of the video
  else
    next(errors.UNPUBLISH_VIDEO_MISSING_PARAMETERS);
};