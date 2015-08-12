(function (app) {

  "use strict"

  app.controller("VideoController", VideoController);
  VideoController.$inject = ["$scope", "$filter", "$window", "$interval", "entityService", "publishService", "properties", "categories","jsonPath", "tableReloadEventService"];
  /**
   * Defines the video controller for the videos page.
   */
  function VideoController($scope, $filter, $window, $interval, entityService, publishService, properties, categories, jsonPath, tableReloadEventService) {
    
    $scope.properties = properties.data.entities;
    //Replace Id in Video by the name of the category
    //Category Id can be overwritten, it is only for display purpose
    $scope.categories = categories.data.taxonomy;
    /**
     * 
     * DATATABLE
     */
    var scopeDataTable = $scope.tableContainer = {};
    scopeDataTable.entityType = "video";
    scopeDataTable.conditionTogleDetail = function (row) {
      return (row.status == 1);
    }
    scopeDataTable.filterBy = [
      {
       'key':'title',
       'value':'',
       'label': $filter('translate')('VIDEOS.TITLE_FILTER')
     },{
       'key':'description',
       'value':'',
       'label': $filter('translate')('VIDEOS.DESCRIPTION_FILTER')
     },{
       'key':'metadata.date',
       'type': 'date',
       'value':'',
       'label': $filter('translate')('VIDEOS.DATE_FILTER')
     },{
       'key':'category',
       'type': 'select',
       'value':'',
       'label': $filter('translate')('VIDEOS.CATEGORY_FILTER'),
       'options': getSelectableCategories()
     }
    ];
    scopeDataTable.header = [
      {
        'key': "title",
        'name': $filter('translate')('VIDEOS.NAME_COLUMN'),
        "class": ['col-xs-12 col-sm-5']
      },
      {
        'key': "metadata.date",
        'type': "date",
        'name': $filter('translate')('VIDEOS.DATE_COLUMN'),
        "class": ['hidden-xs col-sm-1']
      },
      {
        'key': "category",
        'type': "category",
        'name': $filter('translate')('VIDEOS.CATEGORY_COLUMN'),
        "class": ['hidden-xs col-sm-3']
      },
      {
        'key': "state",
        'type': "status",
        'name': $filter('translate')('VIDEOS.STATUS_COLUMN'),
        "class": ['hidden-xs col-sm-2']
      },
      {
        'key': "action",
        'name': $filter('translate')('UI.ACTIONS_COLUMN'),
        "class": [' hidden-xs col-sm-1']
      }];
    scopeDataTable.actions = [
      {
        "label": $filter('translate')('UI.VIEW'),
        "condition": function (row) {
          return row.state == 7;
        },
        "callback": function (row, reload) {
          goToPath(row);
        }
      },
      {
        "label": $filter('translate')('VIDEOS.PUBLISH'),
        "condition": function (row) {
          return row.state == 6;
        },
        "callback": function (row, reload) {
          publishVideo([row.id], reload);
        },
        "global": function(selected, reload){
          publishVideo(selected, reload);
        }
        
      },
      {
        "label": $filter('translate')('VIDEOS.UNPUBLISH'),
        "condition": function (row) {
          return row.state == 7;
        },
        "callback": function (row, reload) {
          unpublishVideo([row.id], reload);
        },
        "global": function(selected, reload){
          unpublishVideo(selected, reload);
        }
      },
      {
        "label": $filter('translate')('UI.REMOVE'),
        "condition": function (row) {
          return row.state >= 6;
        },
        "warningPopup": true,
        "callback": function (row, reload) {
          removeRows([row.id], reload);
        },
        "global": function(selected, reload){
          removeRows(selected, reload);
        }
      }
    ];
    /**
     * FORM
     */
    var scopeEditForm = $scope.editFormContainer = {};
    scopeEditForm.model = {};
    scopeEditForm.pendingEdition = false;
    scopeEditForm.fieldsBase = [
      {
        key: 'title',
        type: 'horizontalExtendInput',
        templateOptions: {
          label: $filter('translate')('VIDEOS.ATTR_TITLE'),
          required: true,
        }
      },
      {
        key: 'description',
        type: 'horizontalExtendInput',
        templateOptions: {
          label: $filter('translate')('VIDEOS.ATTR_DESCRIPTION'),
          required: true,
        }
      },
      {
        key: 'category',
        type: 'horizontalExtendSelect',
        templateOptions: {
          label: $filter('translate')('VIDEOS.ATTR_CATEGORY'),
          required: true,
          options: categoryOptions()
        }
      }
    ];
    scopeEditForm.init = function (row) {
      scopeEditForm.fields = angular.copy(scopeEditForm.fieldsBase);
      angular.forEach(row.properties, function (value, key) {
        var newField = {
          key: key,
          type: 'horizontalExtendInput',
          model: row.properties,
          templateOptions: {
            label: replacePropIdByName(key)
          }
        };
        scopeEditForm.fields.push(newField);
      });
    };

    function getSelectableCategories(){
      var catArray = categoryOptions();
      return [{'value':'', 'name':$filter('translate')('UI.ALL')}].concat(catArray);
    }

    function categoryOptions() {
      var categories = jsonPath($scope.categories, '$..*[?(@.id)]');
      var options = [];
      angular.forEach(categories, function (value, key) {
        options.push({
          "value": value.id,
          "name": value.title
        });
      });
      return options;
    }

    var replacePropIdByName = function (id) {
      var found = -1;
      for (var i = 0; i < $scope.properties.length && found < 0; i++) {
        var value = $scope.properties[i];
        if (value.id == id + "") {
          found = i;
          break;
        }
      };
      if(found!=-1)
        return $scope.properties[found].name
      else return id;
    };
    
    
    scopeEditForm.onSubmit = function (model, successCb, errorCb) {
      saveVideo(model, successCb, errorCb);
    };
    
    // Iterate through the list of videos, if at least one video
    // is pending, poll each 30 seconds to be informed of
    // its status
    var pollVideosPromise = $interval(function () {
        if (!scopeEditForm.pendingEdition){
          entityService.deleteCache(scopeDataTable.entityType);
          tableReloadEventService.broadcast();
        }
    }, 30000);
    /**
     * 
     * Redirect to row path
     * 
     */
    var goToPath = function (row) {
      $window.open(row.link, '_blank');
    };
    /**
     * Publishes a video.
     * Can't publish the video if its saving.
     * @param Object video The video to publish
     */
    var publishVideo = function (video, reload) {
        publishService.publishVideo(video.join(','))
              .success(function (data, status, headers, config) {
                $scope.$emit("setAlert", 'success', $filter('translate')('VIDEOS.PUBLISHED_SUCCESS'), 4000);
                reload();
              })
              .error(function (data, status, headers, config) {
                 $scope.$emit("setAlert", 'danger', $filter('translate')('VIDEOS.PUBLISHED_FAIL'), 4000);
                if (status === 401)
                  $scope.$parent.logout();
              });
    };
    /**
     * Unpublishes the given video.
     * Can't unpublish the video if its saving.
     * @param Object video The video to publish
     */
    var unpublishVideo = function (video, reload) {
      publishService.unpublishVideo(video.join(','))
              .success(function (data, status, headers, config) {
                $scope.$emit("setAlert", 'success', $filter('translate')('VIDEOS.UNPUBLISHED_SUCCESS'), 4000);
                reload();
              })
              .error(function (data, status, headers, config) {
                 $scope.$emit("setAlert", 'danger', $filter('translate')('VIDEOS.UNPUBLISHED_FAIL'), 4000);
                if (status === 401)
                  $scope.$parent.logout();
              });
    };
    /**
     * Removes the row.
     * Can't remove a row if its saving.
     * @param Object row The row to remove
     */
    var removeRows = function (selected, reload) {
        entityService.removeEntity('video', selected.join(','))
                .success(function (data) {
                  $scope.$emit("setAlert", 'success', $filter('translate')('VIDEOS.REMOVE_SUCCESS'), 4000);
                  reload();
                })
                .error(function (data, status, headers, config) {
                  $scope.$emit("setAlert", 'danger', $filter('translate')('VIDEOS.REMOVE_FAIL'), 4000);
                  if (status === 401)
                    $scope.$parent.logout();
                });
    };
    
    /**
     * Saves video information.
     * @param Object form The angular edition form controller
     * @param Object video The video associated to the form
     */
    var saveVideo = function (video, successCb, errorCb) {
      if (!video.saving) {
        video.saving = true;
        entityService.updateEntity('video', video.id, {
          title: video.title,
          description: video.description,
          properties: video.properties,
          category:video.category,
        }).success(function (data, status, headers, config) {
          video.saving = false;
          scopeEditForm.pendingEdition =false;
          successCb();
        }).error(function (data, status, headers, config) {
          video.saving = false;
          errorCb();
          if (status === 401)
            $scope.$parent.logout();
        });
      }
    };
    // Listen to destroy event on the view to update
    $scope.$on("$destroy", function (event) {
      $interval.cancel(pollVideosPromise);
    });
  }
})(angular.module("ov.publish"));