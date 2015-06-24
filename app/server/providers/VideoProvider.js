"use scrict"

// Module dependencies
var util = require("util");
var openVeoAPI = require("openveo-api");

/**
 * Creates a VideoProvider.
 * @param Database database The database to interact with
 */
function VideoProvider(database){
  openVeoAPI.EntityProvider.prototype.init.call(this, database, "videos");
}

module.exports = VideoProvider;
util.inherits(VideoProvider, openVeoAPI.EntityProvider);

/**
 * Updates video state.
 * @param String id The id of the video
 * @param String oldState The actual state of the video
 * @param String newState The new state of the video
 * @param Function callback The function to call when it's done
 *   - Error The error if an error occurred, null otherwise
 */
VideoProvider.prototype.updateVideoState = function(id, oldState, newState, callback){
  this.database.update(this.collection, {id : id, state : oldState}, {state : newState}, function(error){
    if(callback)
      callback(error);
  });
};