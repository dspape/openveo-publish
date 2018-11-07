'use strict';

window.assert = chai.assert;

// PropertiesController.js
describe('PropertiesController', function() {
  var $rootScope,
    $controller,
    $httpBackend,
    scope;

  // Load module publish and entity
  beforeEach(function() {
    module('ov.publish');
    module('ov.entity');
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
        name: 'name',
        description: 'description',
        type: 'type'
      },
      {
        id: 2,
        name: 'name',
        description: 'description',
        type: 'type'
      }
    ];
    $controller('PropertiesController', {
      $scope: scope
    });
  });

  // Checks if no HTTP request stays without response
  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });


  // removeProperty method
  describe('removeProperty', function() {

    it('Should be able to remove a property if not saving', function(done) {
      $httpBackend.when('POST', /.*/).respond(200, '');
      $httpBackend.when('GET', /.*/).respond(200, '');
      $httpBackend.when('PUT', /.*/).respond(200, '');
      $httpBackend.when('DELETE', '/be/publish/properties/1').respond(200);
      $httpBackend.expectDELETE('/be/publish/properties/1');

      scope.tableContainer.actions[0].callback(scope.test.rows[0], done);

      $httpBackend.flush();
    });

    it('Should be able to remove many properties ', function(done) {
      $httpBackend.when('POST', /.*/).respond(200, '');
      $httpBackend.when('GET', /.*/).respond(200, '');
      $httpBackend.when('PUT', /.*/).respond(200, '');
      $httpBackend.when('DELETE', '/be/publish/properties/1,2').respond(200);
      $httpBackend.expectDELETE('/be/publish/properties/1,2');

      scope.tableContainer.actions[0].global([scope.test.rows[0].id, scope.test.rows[1].id], done);

      $httpBackend.flush();
    });

  });

  // saveProperty method
  describe('saveProperty', function() {

    it('Should be able to save a property if not already saving', function(done) {
      $httpBackend.when('DELETE', /.*/).respond(200, '');
      $httpBackend.when('GET', /.*/).respond(200, '');
      $httpBackend.when('PUT', /.*/).respond(200, '');
      $httpBackend.when('POST', '/be/publish/properties/1').respond(200);
      $httpBackend.expectPOST('/be/publish/properties/1');

      scope.editFormContainer.onSubmit(scope.test.rows[0]).then(done(), function() {
        assert.notOk(true);
      });

      $httpBackend.flush();
    });

  });

  // addProperty method
  describe('addProperty', function() {

    it('Should be able to add a new property', function(done) {
      $httpBackend.when('DELETE', /.*/).respond(200, '');
      $httpBackend.when('GET', /.*/).respond(200, '');
      $httpBackend.when('POST', /.*/).respond(200, '');
      $httpBackend.when('PUT', '/be/publish/properties').respond(200, {
        entity: {}
      });
      $httpBackend.expectPUT('/be/publish/properties');

      scope.addFormContainer.onSubmit({}).then(
        done(),
        function() {
          assert.notOk(true);
        }
      );
      $httpBackend.flush();
    });

  });

});
