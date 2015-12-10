'use strict';

var google = require('googleapis');
var merge = require('merge');
var path = require('path');
var async = require('async');
var OAuth2 = google.auth.OAuth2;
var openVeoAPI = require('@openveo/api');
var configDir = openVeoAPI.fileSystem.getConfDir();
var publishConf = require(path.join(configDir, 'publish/videoPlatformConf.json'));
var config = publishConf.youtube.googleOAuth;
var ConfigurationModel = process.requirePublish('app/server/models/ConfigurationModel.js');

var logger = require('winston').loggers.get('publish');

/**
 * Construct a new helper for google OAuth association and requests
 *
 * @returns {nm$_googleOAuthHelper.GoogleOAuthHelper}
 */
function GoogleOAuthHelper() {
  this.oauth2Client = new OAuth2(config.clientId, config.clientSecret, config.redirectUrl);
  this.confModel = new ConfigurationModel();
}

/**
 * Persists the tokens retrieved from Google
 *
 * @param {object}   tokens   the tokens retrieved from Google
 * @param {function} callback Optional callback function
 */
GoogleOAuthHelper.prototype.saveToken = function(tokens, callback) {
  var configuration;
  var self = this;
  async.series([

    // Retrieve video information from database
    function(callback) {
      self.confModel.get(function(error, result) {
        if (error || !result || result.length < 1) {
          callback(error);
          return;
        } else {
          configuration = result[0];
        }
        callback();
      });
    }],

    function(error) {
      if (error) {
        callback(error);
        return;
      } else {
        var cb = function(err, data) {
          if (err) {
            logger.error('Error while saving configuration data', err);
          } else {
            logger.debug('Configuration data has been saved : ', data);
          }
          if (callback) {
            callback(null, data);
          }
        };

        if (configuration && configuration.id)
          self.confModel.update(configuration.id, {googleOAuthTokens: tokens}, cb);
        else
          self.confModel.add({googleOAuthTokens: tokens}, cb);
      }
    }
  );
};

/**
 * Retrieve the current token or null if it was not persisted earlier
 *
 * @param {function} callback function
 */
GoogleOAuthHelper.prototype.fetchToken = function(callback) {
  this.confModel.get(function(error, result) {

    if (error || !result || result.length < 1) {
      logger.error('Error while retrieving configuration data', error);
      callback(error);
      return;
    } else {
      var conf = result[0];
      logger.debug('Configuration id retrieved', result && conf && conf.id);
      var tokens = conf && conf.hasOwnProperty('googleOAuthTokens') ? conf.googleOAuthTokens : null;
      logger.debug('Token retrieved from DB', tokens);
      callback(null, tokens);
    }
  });
};

/**
 * Builds the url that will permit to access google association page on the client's browser
 *
 * @param {object} options options to build the url, 'scope' is mandatory
 *
 * @returns {string} the url to the google association page
 */
GoogleOAuthHelper.prototype.getAuthUrl = function(options) {
  if (!options.hasOwnProperty('scope')) {
    throw new Error('Please specify the scope');
  }

  var _options = merge.recursive({
    access_type: 'offline', // eslint-disable-line camelcase
    approval_prompt: 'force', // eslint-disable-line camelcase
    response_type: 'code' // eslint-disable-line camelcase
  }, options);

  return this.oauth2Client.generateAuthUrl(_options);
};

/**
 * Retrieve a token from google with an authorization code, this token is then saved for later use and can be
 * retrieved with @see this.fetchToken
 *
 * @param {string} code The authorization code.
 * @param {function} callback callback function
 */
GoogleOAuthHelper.prototype.persistTokenWithCode = function(code, callback) {
  var self = this;
  self.oauth2Client.getToken(code, function(err, tokens, response) {
    if (err) {
      logger.error('Error while trying to retrieve access token', err);
      logger.error(response.body);
      callback(err, null);
    } else if (tokens && Object.keys(tokens).length > 0) {
      logger.debug('Token as been retrieved sucessfully', tokens);
      self.saveToken(tokens, callback);
    } else if (callback) {
      callback(null, null);
    }
  });
};

/**
 * Check whether or not a previous token has been retrieved
 *
 * @param {function} callback callback function
 */
GoogleOAuthHelper.prototype.hasToken = function(callback) {
  this.fetchToken(function(err, tokens) {
    callback(new Boolean(tokens && Object.keys(tokens).length > 0));
  });
};

/**
 * Retrieve a fresh (=valid) token, if a previous token was set and is still valid it is returned. If this previous
 * token is not valid anymore a new token is retrieved.
 * This function should be used after a previous successfull google association
 *
 * @param {function} callback callback function
 */
GoogleOAuthHelper.prototype.getFreshToken = function(callback) {
  var self = this;
  this.fetchToken(function(err, tokens) {
    if (err) {
      logger.error('Error while retrieving the token', err);
      callback(err, null);
    } else if (!tokens || Object.keys(tokens).length <= 0) {
      callback(new Error('No token was previously set'), null);
    } else {
      var tokenHasExpired = tokens.expiry_date ? tokens.expiry_date <= (new Date()).getTime() : false;
      if (!tokenHasExpired) {
        logger.debug('Token found and up to date');
        callback(null, tokens);
      } else {
        logger.debug('Token found but has expired, querying for a new one');

        // hint : the tokens object also contains our refresh token
        self.oauth2Client.setCredentials(tokens);
        self.oauth2Client.refreshAccessToken(function(err, freshTokens) {
          if (err) {
            logger.error('Error while trying to refresh the access token', err);
            callback(err, freshTokens);
            return;
          }
          logger.debug('Token as been retrieved sucessfully', freshTokens);
          self.saveToken(freshTokens, callback);
        });
      }
    }
  });
};

/**
 * Returns a client to perform request to the google apis.
 * This function should be used after a previous successfull google association
 *
 * @param {function} callback
 */
GoogleOAuthHelper.prototype.getOAuthClient = function(callback) {
  var self = this;
  this.fetchToken(function(err, tokens) {
    if (err) {
      callback(err, null);
    } else if (!tokens || Object.keys(tokens).length <= 0) {
      callback(new Error('No token was previously set'), null);
    } else {
      self.oauth2Client.setCredentials(tokens);
      callback(null, self.oauth2Client);
    }
  });
};

module.exports = new GoogleOAuthHelper();
