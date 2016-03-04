'use strict';

var util = require('util');
var e2e = require('@openveo/test').e2e;
var Helper = e2e.helpers.Helper;

/**
 * Creates a new PropertyHelper to help manipulate properties without interacting with the web browser.
 *
 * Each function is inserting in protractor's control flow.
 *
 * @param {PropertyModel} model The entity model that will be used by the Helper
 */
function PropertyHelper(model) {
  PropertyHelper.super_.call(this, model);
}

module.exports = PropertyHelper;
util.inherits(PropertyHelper, Helper);

/**
 * Adds multiple entities at the same time with automatic index.
 *
 * This method bypass the web browser to directly add entities into database.
 *
 * All created entities will have the same name suffixed by the index.
 *
 * @method addEntitiesAuto
 * @param {String} name Base name of the entities to add
 * @param {Number} total Number of entities to add
 * @param {Number} [offset=0] Index to start from for the name suffix
 * @return {Promise} Promise resolving with the added entities
 */
PropertyHelper.prototype.addEntitiesAuto = function(name, total, offset) {
  var entities = [];
  offset = offset || 0;

  for (var i = offset; i < total; i++) {
    entities.push({
      name: name + ' ' + i,
      description: name + ' description ' + i,
      type: 'text'
    });
  }

  return this.addEntities(entities);
};
