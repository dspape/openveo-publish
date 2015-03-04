"use strict"

window.assert = chai.assert;

describe("PublishController", function(){

  beforeEach(module("ov.publish"));

  var $rootScope, $controller, $httpBackend, $location;

  beforeEach(inject(function(_$rootScope_, _$controller_, _$httpBackend_, _$location_){
    $rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;
    $controller = _$controller_;
    $location = _$location_;
  }));

  describe("startWatcher", function(){
    var $scope;

    beforeEach(function(){
      $scope = $rootScope.$new();

      $controller("PublishController", {
        $scope: $scope,
        watcherStatus : { data : { status : 0 }},
        videos : { data : { videos : [] }}
      });
    });
    
    afterEach(function(){
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });    

    it("Should be able to ask the server to start the watcher", function(){
      $httpBackend.when("GET", "/admin/publish/startWatcher").respond(200, { status : 1 });
      $httpBackend.expectGET("/admin/publish/startWatcher");
      $scope.watcherStatus = 0;
      $scope.startWatcher();
      $httpBackend.flush();
      assert.equal($scope.watcherStatus, 1);
    });
    
    it("Should logout user if not authenticated anymore on watcher start", function(done){
      
      $rootScope.logout = function(){
        done();
      };
      
      $httpBackend.when("GET", "/admin/publish/startWatcher").respond(401);
      $httpBackend.expectGET("/admin/publish/startWatcher");
      $scope.startWatcher();
      $httpBackend.flush();
    });
    
    it("Should be able to ask the server to stop the watcher", function(){
      $httpBackend.when("GET", "/admin/publish/stopWatcher").respond(200, { status : 3 });
      $httpBackend.expectGET("/admin/publish/stopWatcher");
      $scope.watcherStatus = 1;
      $scope.stopWatcher();
      $httpBackend.flush();
      assert.equal($scope.watcherStatus, 3);
    });
    
    it("Should logout user if not authenticated anymore on watcher stop", function(done){
      
      $rootScope.logout = function(){
        done();
      };
      
      $httpBackend.when("GET", "/admin/publish/stopWatcher").respond(401);
      $httpBackend.expectGET("/admin/publish/stopWatcher");
      $scope.stopWatcher();
      $httpBackend.flush();
    });

  }); 

});