'use strict';

/**
 * @module publish-controllers
 */

/**
 * Provides route actions for all requests relative to videos.
 *
 * @class videoController
 */

var path = require('path');
var openVeoAPI = require('@openveo/api');
var configDir = openVeoAPI.fileSystem.getConfDir();
var errors = process.requirePublish('app/server/httpErrors.js');
var platforms = require(path.join(configDir, 'publish/videoPlatformConf.json'));

var VideoModel = process.requirePublish('app/server/models/VideoModel.js');
var videoModel = new VideoModel();
var async = require('async');

var PropertyModel = process.requirePublish('app/server/models/PropertyModel.js');
var propertyModel = new PropertyModel();
var applicationStorage = openVeoAPI.applicationStorage;

var env = (process.env.NODE_ENV === 'production') ? 'prod' : 'dev';

/**
 * Displays video player template.
 *
 * Checks first if the video id is valid and if the video is published
 * before returning the template.
 *
 * @method displayVideoAction
 * @static
 */
module.exports.displayVideoAction = function(request, response, next) {
  response.locals.scripts = [];
  response.locals.css = [];

  // Retrieve openveo sub plugins
  var plugins = applicationStorage.getPlugins();

  // Got sub plugins
  if (plugins) {
    plugins.forEach(function(subPlugin) {
      if (subPlugin.name === 'publish') {
        if (subPlugin.custom) {
          var customScripts = subPlugin.custom.scriptFiles;
          var playerScripts = customScripts['publishPlayer'];
          response.locals.scripts = response.locals.scripts.concat(
            (customScripts['base'] || []),
            ((playerScripts && playerScripts[env]) ? playerScripts[env] : [])
          );
          response.locals.css = response.locals.css.concat(subPlugin.custom.cssFiles || []);
        }
      }
    });

    response.render('player', response.locals);
  }

  // No sub plugins
  else
    next();
};

/**
 * Gets all media platforms available.
 *
 * @example
 *     {
 *       "platforms" : ["vimeo", "youtube"]
 *     }
 *
 * @method getPlatformsAction
 * @static
 */
module.exports.getPlatformsAction = function(request, response) {
  response.send({
    platforms: Object.keys(platforms) || []
  });
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
module.exports.getVideoAction = function(request, response, next) {
  if (request.params.id) {
    videoModel.getOne(request.params.id, function(error, video) {
      if (error)
        next(errors.GET_VIDEO_ERROR);
      else
        response.send({
          video: video
        });
    });
  }

  // Missing id of the video
  else
    next(errors.GET_VIDEO_MISSING_PARAMETERS);
};

/**
 * Gets information about a ready video (state is ready or published).
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
 * @method getVideoReadyAction
 * @static
 */
module.exports.getVideoReadyAction = function(request, response, next) {
  if (request.params.id) {
    videoModel.getOneReady(request.params.id, function(error, video) {
      if (error || (video.state === VideoModel.READY_STATE && !request.isAuthenticated()))
        next(errors.GET_VIDEO_READY_ERROR);
      else
        response.send({
          video: video
        });
    });
  }

  // Missing id of the video
  else
    next(errors.GET_VIDEO_READY_MISSING_PARAMETERS);
};

/**
 * Gets published videos by properties.
 *
 * Optional GET parameters :
 *  - **query** To search on both videos title and description
 *  - **states** To filter videos by state
 *  - **dateStart** To get videos after a date
 *  - **dateEnd** To get videos before a date
 *  - **categories** To filter videos by category
 *  - **sortBy** To sort videos by either title, description or date
 *  - **sortOrder** Sort order (either asc or desc)
 *  - **limit** To limit the number of videos per page
 *  - **page** The expected page
 *  - **properties** A list of properties with the property name as the key and the expected property
 *    value as the value. (e.g. properties[property1Name]=property1Value)
 *
 * @example
 *     {
 *       "videos" : [
 *         ...
 *       ]
 *     }
 *
 * @method getVideoByPropertiesAction
 * @static
 */
module.exports.getVideoByPropertiesAction = function(request, response, next) {
  var params;
  var orderedProperties = ['title', 'description', 'date', 'state'];

  try {
    params = openVeoAPI.util.shallowValidateObject(request.query, {
      query: {type: 'string'},
      states: {type: 'array<number>'},
      dateStart: {type: 'date'},
      dateEnd: {type: 'date'},
      categories: {type: 'array<string>'},
      limit: {type: 'number', gt: 0},
      page: {type: 'number', gt: 0, default: 1},
      sortBy: {type: 'string', in: orderedProperties, default: 'date'},
      sortOrder: {type: 'string', in: ['asc', 'desc'], default: 'desc'}
    });
  } catch (error) {
    return response.status(500).send({
      error: {
        message: error.message
      }
    });
  }

  // Build sort
  var sort = {};
  sort[params.sortBy] = params.sortOrder === 'asc' ? 1 : -1;

  // Build filter
  var filter = {};

  // Add search query
  if (params.query) {
    filter.$text = {
      $search: params.query
    };
  }

  // Add states
  if (params.states && params.states.length) {
    filter.state = {
      $in: params.states
    };
  }

  // Add categories
  if (params.categories && params.categories.length) {
    filter.category = {
      $in: params.categories
    };
  }

  // Add date
  if (params.dateStart || params.dateEnd) {
    filter.date = {};
    if (params.dateStart) filter.date.$gte = params.dateStart;
    if (params.dateEnd) filter.date.$lt = params.dateEnd;
  }

  var wsSearch = request.query.properties || {};
  var series = [];

  // Construct MongoDb search query with parameters
  Object.keys(wsSearch).forEach(function(key) {
    series.push(function(callback) {

      // get property which name corresponding to parameter
      propertyModel.getByFilter({name: key}, function(error, prop) {
        if (error) return callback(error);

        // Error if no property corresponding
        if (!prop || prop.length == 0) return callback(errors.UNKNOWN_PROPERTY_ERROR);
        var val = wsSearch[key];

        // Build search for each existing property
        filter['properties.' + prop.id] = {$in: [].concat(val)};
        callback();
      });
    });
  });

  // Do series call function and execute final search
  async.series(series, function(err) {
    if (err) {
      process.logger.error(err);
      next(errors.GET_VIDEOS_ERROR);
    }

    // find in mongoDb
    else videoModel.getPaginatedFilteredEntities(filter, params.limit, params.page, sort, true,
      function(error, entities, pagination) {
        if (error) {
          process.logger.error(error);
          next(errors.GET_VIDEOS_ERROR);
        } else {
          response.send({
            videos: entities,
            pagination: pagination
          });
        }
      }
    );
  });
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
 *       state : 12
 *     }
 *
 * @method publishVideoAction
 * @static
 */
module.exports.publishVideoAction = function(request, response, next) {
  if (request.params.id) {
    var arrayId = request.params.id.split(',');
    videoModel.publishVideo(arrayId, function(error) {
      if (error)
        next(errors.PUBLISH_VIDEO_ERROR);
      else
        response.send({
          state: VideoModel.PUBLISHED_STATE
        });
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
 *       state : 11
 *     }
 *
 * @method unpublishVideoAction
 * @static
 */
module.exports.unpublishVideoAction = function(request, response, next) {
  if (request.params.id) {
    var arrayId = request.params.id.split(',');
    videoModel.unpublishVideo(arrayId, function(error) {
      if (error)
        next(errors.UNPUBLISH_VIDEO_ERROR);
      else
        response.send({
          state: VideoModel.READY_STATE
        });
    });
  }

  // Missing type and / or id of the video
  else
    next(errors.UNPUBLISH_VIDEO_MISSING_PARAMETERS);
};
