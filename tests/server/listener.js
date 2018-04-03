'use strict';

var path = require('path');
var chai = require('chai');
var spies = require('chai-spies');
var openVeoApi = require('@openveo/api');
var mock = require('mock-require');
var ResourceFilter = openVeoApi.storages.ResourceFilter;

var assert = chai.assert;
chai.should();
chai.use(spies);

describe('Listeners', function() {
  var listener;
  var database;
  var VideoProvider;
  var settingProvider;
  var expectedMedias;
  var expectedSettings;
  var coreApi;
  var realCoreApi;

  // Mocks
  beforeEach(function() {
    expectedMedias = [];
    expectedSettings = [];

    VideoProvider = function() {};
    VideoProvider.prototype.getAll = chai.spy(function(filter, fields, sort, callback) {
      callback(null, expectedMedias);
    });
    VideoProvider.prototype.updateOne = chai.spy(function(filter, modifications, callback) {
      callback(null, 1);
    });
    VideoProvider.prototype.removeField = chai.spy(function(field, filter, callback) {
      callback(null, 1);
    });

    settingProvider = {
      getOne: chai.spy(function(filter, fields, callback) {
        callback(null, expectedSettings[0]);
      }),
      updateOne: chai.spy(function(filter, modifications, callback) {
        callback(null, 1);
      })
    };

    database = {};
    coreApi = {
      getDatabase: function() {
        return database;
      },
      getCoreApi: function() {
        return coreApi;
      },
      settingProvider: settingProvider
    };

    realCoreApi = process.api;
    process.api = coreApi;
    mock(path.join(process.rootPublish, 'app/server/providers/VideoProvider.js'), VideoProvider);
  });

  // Initializes tests
  beforeEach(function() {
    listener = mock.reRequire(path.join(process.rootPublish, 'app/server/listener.js'));
  });

  // Stop mocks
  afterEach(function() {
    mock.stopAll();
    process.api = realCoreApi;
  });

  describe('onUsersDeleted', function() {

    it('should remove deleted user references from medias', function(done) {
      var deletedUsersIds = ['42'];
      expectedMedias = [
        {
          id: '43'
        }
      ];

      VideoProvider.prototype.getAll = chai.spy(function(filter, fields, sort, callback) {
        assert.deepEqual(
          filter.getComparisonOperation(ResourceFilter.OPERATORS.IN, 'metadata.user').value,
          deletedUsersIds,
          'Wrong users'
        );
        callback(null, expectedMedias);
      });

      VideoProvider.prototype.updateOne = chai.spy(function(filter, modifications, callback) {
        assert.equal(
          filter.getComparisonOperation(ResourceFilter.OPERATORS.EQUAL, 'id').value,
          expectedMedias[0].id,
          'Wrong media id'
        );
        assert.isNull(modifications['metadata.user'], 'Unexpected user');
        callback(null, 1);
      });

      listener.onUsersDeleted(deletedUsersIds, function(error) {
        assert.isNull(error, 'Unexpected error');
        VideoProvider.prototype.getAll.should.have.been.called.exactly(1);
        VideoProvider.prototype.updateOne.should.have.been.called.exactly(1);
        done();
      });
    });

    it('should execute callback with an error if getting medias failed', function(done) {
      var expectedError = new Error('Something went wrong');

      VideoProvider.prototype.getAll = chai.spy(function(filter, fields, sort, callback) {
        callback(expectedError);
      });

      listener.onUsersDeleted(['42'], function(error) {
        assert.strictEqual(error, expectedError, 'Wrong error');
        VideoProvider.prototype.updateOne.should.have.been.called.exactly(0);
        done();
      });
    });

    it('should execute callback with an error if updating medias failed', function(done) {
      var expectedError = new Error('Something went wrong');
      expectedMedias = [
        {
          id: '43'
        }
      ];

      VideoProvider.prototype.updateOne = chai.spy(function(filter, modifications, callback) {
        callback(expectedError);
      });

      listener.onUsersDeleted(['42'], function(error) {
        assert.strictEqual(error, expectedError, 'Wrong error');
        VideoProvider.prototype.getAll.should.have.been.called.exactly(1);
        done();
      });
    });

    it('should remove deleted user references from configuration', function(done) {
      var deletedUsersIds = ['42'];
      expectedSettings = [
        {
          id: 'publish-defaultUpload',
          value: {
            owner: {
              name: 'User name',
              value: deletedUsersIds[0]
            }
          }
        }
      ];

      settingProvider.getOne = chai.spy(function(filter, fields, callback) {
        assert.deepEqual(
          filter.getComparisonOperation(ResourceFilter.OPERATORS.EQUAL, 'id').value,
          'publish-defaultUpload',
          'Wrong setting'
        );
        callback(null, expectedSettings[0]);
      });

      settingProvider.updateOne = chai.spy(function(filter, modifications, callback) {
        assert.equal(
          filter.getComparisonOperation(ResourceFilter.OPERATORS.EQUAL, 'id').value,
          'publish-defaultUpload',
          'Wrong updated setting'
        );
        assert.isNull(modifications.value.owner.name, 'Unexpected user name');
        assert.isNull(modifications.value.owner.value, 'Unexpected user id');
        callback(null, 1);
      });

      listener.onUsersDeleted(deletedUsersIds, function(error) {
        assert.isNull(error, 'Unexpected error');
        settingProvider.getOne.should.have.been.called.exactly(1);
        settingProvider.updateOne.should.have.been.called.exactly(1);
        done();
      });
    });

    it('should execute callback with an error if getting settings failed', function(done) {
      var expectedError = new Error('Something went wrong');

      settingProvider.getOne = chai.spy(function(filter, fields, callback) {
        callback(expectedError);
      });

      listener.onUsersDeleted(['42'], function(error) {
        assert.strictEqual(error, expectedError, 'Wrong error');
        settingProvider.getOne.should.have.been.called.exactly(1);
        settingProvider.updateOne.should.have.been.called.exactly(0);
        done();
      });
    });

    it('should execute callback with an error if updating settings failed', function(done) {
      var expectedError = new Error('Something went wrong');
      expectedSettings = [
        {
          id: 'publish-defaultUpload',
          value: {
            owner: {
              name: 'User name',
              value: '42'
            }
          }
        }
      ];

      settingProvider.updateOne = chai.spy(function(filter, modifications, callback) {
        callback(expectedError);
      });

      listener.onUsersDeleted(['42'], function(error) {
        assert.strictEqual(error, expectedError, 'Wrong error');
        settingProvider.getOne.should.have.been.called.exactly(1);
        done();
      });
    });

  });

  describe('onPropertiesDeleted', function() {

    it('should remove deleted properties references from medias', function(done) {
      var deletedProperties = ['42'];

      VideoProvider.prototype.removeField = chai.spy(function(field, filter, callback) {
        assert.equal(field, 'properties.' + deletedProperties[0], 'Wrong field');
        assert.isNull(filter, 'Unexpected filter');
        callback(null, expectedMedias);
      });

      listener.onPropertiesDeleted(deletedProperties, function(error) {
        assert.isNull(error, 'Unexpected error');
        VideoProvider.prototype.removeField.should.have.been.called.exactly(1);
        done();
      });
    });

    it('should execute callback with an error if removing fields failed', function(done) {
      var expectedError = new Error('Something went wrong');

      VideoProvider.prototype.removeField = chai.spy(function(field, filter, callback) {
        callback(expectedError);
      });

      listener.onPropertiesDeleted(['42'], function(error) {
        assert.strictEqual(error, expectedError, 'Wrong error');
        done();
      });
    });

  });

});
