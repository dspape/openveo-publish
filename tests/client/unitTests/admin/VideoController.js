'use strict';

window.assert = chai.assert;

// VideoController.js
describe('VideoController', function() {
  var $rootScope,
    $controller,
    $httpBackend,
    scope;

  // Load module publish, entity and ngJSONPath
  beforeEach(function() {
    module('ngJSONPath');
    module('ov.publish');
    module('ov.entity');
    module('ov.tableForm');
  });

  // Dependencies injections
  beforeEach(inject(function(_$rootScope_, _$controller_, _$httpBackend_) {
    $rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;
    $controller = _$controller_;
  }));

  // Initializes tests
  beforeEach(function() {
    scope = $rootScope.$new();
    scope.checkAccess = function() {
      return true;
    };
    scope.test = {};
    scope.test.rows = [
      {
        id: 1,
        status: 1,
        properties: []
      },
      {
        id: 2,
        status: 1,
        properties: []
      }
    ];
    $controller('VideoController', {
      $scope: scope,
      categories: {
        data: {
          taxonomy: {}
        }
      },
      properties: {
        data: {
          entities: []
        }
      },
      platforms: {
        data: {
          platforms: ['vimeo', 'youtube']
        }
      }

    });
  });

  // Checks if no HTTP request stays without response
  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  // startVideoUpload method
  describe('startVideoUpload', function() {

    it('Should be able to start uploading a video if not saving', function(done) {
      $httpBackend.when('POST', /.*/).respond(200, '');
      $httpBackend.when('DELETE', /.*/).respond(200, '');
      $httpBackend.when('PUT', /.*/).respond(200, '');
      $httpBackend.when('GET', '/be/publish/startUpload/1/vimeo').respond(200);
      $httpBackend.expectGET('/be/publish/startUpload/1/vimeo');

      scope.tableContainer.actions[7].callback(scope.test.rows[0], done);

      $httpBackend.flush();
    });

  });

  // publishVideo method
  describe('publishVideo', function() {

    it('Should be able to publish a video if not saving', function(done) {
      $httpBackend.when('POST', /.*/).respond(200, '');
      $httpBackend.when('DELETE', /.*/).respond(200, '');
      $httpBackend.when('PUT', /.*/).respond(200, '');
      $httpBackend.when('GET', '/be/publish/publishVideo/1').respond(200, {
        state: 12
      });
      $httpBackend.expectGET('/be/publish/publishVideo/1');

      scope.tableContainer.actions[2].callback(scope.test.rows[0], done);

      $httpBackend.flush();
    });
    it('Should be able to remove many applications ', function(done) {
      $httpBackend.when('POST', /.*/).respond(200, '');
      $httpBackend.when('DELETE', /.*/).respond(200, '');
      $httpBackend.when('PUT', /.*/).respond(200, '');
      $httpBackend.when('GET', '/be/publish/publishVideo/1,2').respond(200);
      $httpBackend.expectGET('/be/publish/publishVideo/1,2');

      scope.tableContainer.actions[2].global([scope.test.rows[0].id, scope.test.rows[1].id], done);

      $httpBackend.flush();
    });

  });

  // unpublishVideo method
  describe('unpublishVideo', function() {

    it('Should be able to unpublish a video if not saving', function(done) {
      $httpBackend.when('POST', /.*/).respond(200, '');
      $httpBackend.when('DELETE', /.*/).respond(200, '');
      $httpBackend.when('PUT', /.*/).respond(200, '');
      $httpBackend.when('GET', '/be/publish/unpublishVideo/1').respond(200, {
        state: 12
      });
      $httpBackend.expectGET('/be/publish/unpublishVideo/1');

      scope.tableContainer.actions[3].callback(scope.test.rows[0], done);

      $httpBackend.flush();
    });
    it('Should be able to remove many applications ', function(done) {
      $httpBackend.when('POST', /.*/).respond(200, '');
      $httpBackend.when('DELETE', /.*/).respond(200, '');
      $httpBackend.when('PUT', /.*/).respond(200, '');
      $httpBackend.when('GET', '/be/publish/unpublishVideo/1,2').respond(200);
      $httpBackend.expectGET('/be/publish/unpublishVideo/1,2');

      scope.tableContainer.actions[3].global([scope.test.rows[0].id, scope.test.rows[1].id], done);

      $httpBackend.flush();
    });

  });

  // retryVideo method
  describe('retryVideo', function() {

    it('Should be able to retry a video if not saving', function(done) {
      $httpBackend.when('POST', /.*/).respond(200, '');
      $httpBackend.when('DELETE', /.*/).respond(200, '');
      $httpBackend.when('PUT', /.*/).respond(200, '');
      $httpBackend.when('GET', '/be/publish/retryVideo/1').respond(200);
      $httpBackend.expectGET('/be/publish/retryVideo/1');

      scope.tableContainer.actions[5].callback(scope.test.rows[0], done);

      $httpBackend.flush();
    });

  });

// removeVideo method
  describe('removeVideo', function() {

    it('Should be able to remove a video if not saving', function(done) {
      $httpBackend.when('POST', /.*/).respond(200, '');
      $httpBackend.when('GET', /.*/).respond(200, '');
      $httpBackend.when('PUT', /.*/).respond(200, '');
      $httpBackend.when('DELETE', '/be/crud/video/1').respond(200);
      $httpBackend.expectDELETE('/be/crud/video/1');

      scope.tableContainer.actions[6].callback(scope.test.rows[0], done);

      $httpBackend.flush();
    });

    it('Should be able to remove many videos ', function(done) {
      $httpBackend.when('POST', /.*/).respond(200, '');
      $httpBackend.when('GET', /.*/).respond(200, '');
      $httpBackend.when('PUT', /.*/).respond(200, '');
      $httpBackend.when('DELETE', '/be/crud/video/1,2').respond(200);
      $httpBackend.expectDELETE('/be/crud/video/1,2');

      scope.tableContainer.actions[6].global([scope.test.rows[0].id, scope.test.rows[1].id], done);

      $httpBackend.flush();
    });

  });

// saveVideo method
  describe('saveVideo', function() {

    it('Should be able to save a video if not already saving', function(done) {
      $httpBackend.when('DELETE', /.*/).respond(200, '');
      $httpBackend.when('GET', /.*/).respond(200, '');
      $httpBackend.when('PUT', /.*/).respond(200, '');
      $httpBackend.when('POST', '/be/crud/video/1').respond(200);
      $httpBackend.expectPOST('/be/crud/video/1');

      scope.editFormContainer.onSubmit(scope.test.rows[0]).then(done(), function() {
        assert.notOk(true);
      });

      $httpBackend.flush();
    });

  });

});
