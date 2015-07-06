(function(app){
  
  "use strict"

  app.controller("VideoController", VideoController);
  VideoController.$inject = ["$scope", "$interval", "entityService", "publishService", "videos", "categories", "jsonPath"];

  /**
   * Defines the video controller for the videos page.
   */
  function VideoController($scope, $interval, entityService, publishService, videos, categories, jsonPath){
    var pendingEdition = false;
    var pendingVideos;
    $scope.videos = videos.data.entities;
    
    //Replace Id in Video by the name of the category
    //Category Id can be overwritten, it is only for display purpose
    $scope.categories = categories.data.taxonomy;
    replaceVideoIdByCategory();
 
    

    // Iterate through the list of videos, if at least one video
    // is pending, poll each 30 seconds to be informed of
    // its status
    var pollVideosPromise = $interval(function(){
      publishService.loadVideos(true).success(function(data, status, headers, config){
        pendingVideos = publishService.getVideos();

        // Do not update videos if edition of a video is in progress by
        // the user
        if(!pendingEdition)
          updateVideos();
      }).error(function(data, status, headers, config){
        if(status === 401)
          $scope.$parent.logout();
      });
    }, 30000);

    /**
     * Toggles a video detail.
     * @param Object video The video associated to the form
     */
    $scope.toggleVideoDetails = function(video){
      if(!video.saving && video.status === 1){
        for(var i = 0 ; i < $scope.videos.length ; i++){
          $scope.videos[i].opened = ($scope.videos[i].id === video.id) ? !$scope.videos[i].opened : false;
        }
      }
    };

    /**
     * Publishes a video.
     * Can't publish the video if its saving.
     * @param Object video The video to publish
     */
    $scope.publishVideo = function(video){
      if(!video.saving){
        video.saving = true;
        publishService.publishVideo(video.id).success(function(data, status, headers, config){
          video.state = data.state;
          video.saving = false;
        }).error(function(data, status, headers, config){
          video.saving = false;
          if(status === 401)
            $scope.$parent.logout();
        });
      }
    };

    /**
     * Unpublishes the given video.
     * Can't unpublish the video if its saving.
     * @param Object video The video to publish
     */
    $scope.unpublishVideo = function(video){
      if(!video.saving){
        video.saving = true;
        publishService.unpublishVideo(video.id).success(function(data, status, headers, config){
          video.state = data.state;
          video.saving = false;
        }).error(function(data, status, headers, config){
          video.saving = false;
          if(status === 401)
            $scope.$parent.logout();
        });
      }
    };

    /**
     * Removes a video.
     * Can't remove the video if its saving.
     * @param Object video The video to remove
     */
    $scope.removeVideo = function(video){
      if(!video.saving){
        video.saving = true;
        entityService.removeEntity('video', video.id).success(function(data, status, headers, config){

          var index = 0;

          // Look for video index
          for(index = 0 ; index < $scope.videos.length ; index++){
            if($scope.videos[index].id === video.id)
              break;
          }

          // Remove video from the list of videos
          $scope.videos.splice(index, 1);

        }).error(function(data, status, headers, config){
          video.saving = false;
          if(status === 401)
            $scope.$parent.logout();
        });
      }
    };

    /**
     * Cancels video edition.
     * @param Object form The angular edition form controller
     */
    $scope.cancelEdition = function(form){
      pendingEdition = false;
      form.edition = false;
      form.cancelEdition();
    };

    /**
     * Opens video edition.
     * @param Object form The angular edition form controller
     */
    $scope.openEdition = function(form){
      pendingEdition = true;
      form.edition = true;
      form.openEdition();
    };

    /**
     * Saves video information.
     * @param Object form The angular edition form controller
     * @param Object video The video associated to the form
     */
    $scope.saveVideo = function(form, video){
      if(!video.saving){
        video.saving = true;
        form.saving = true;
        
        // Only save property's value and id
        var filteredProperties = [];
        for(var i = 0 ; i < video.properties.length ; i++){
          filteredProperties.push({
            id : video.properties[i].id,
            value : video.properties[i].value
          });
        }

        entityService.updateEntity('video',video.id,{
          title : video.title,
          description : video.description,
          properties : filteredProperties
        }).success(function(data, status, headers, config){
          video.saving = form.saving = false;
          form.edition = false;
          pendingEdition = false;
          form.closeEdition();
          $scope.toggleVideoDetails(video);
        }).error(function(data, status, headers, config){
          video.saving = form.saving = false;
          if(status === 401)
            $scope.$parent.logout();
        });
      }
    };

    // Listen to destroy event on the view to update
    $scope.$on("$destroy", function(event){
      $interval.cancel(pollVideosPromise);
    });

    /**
     * Injects pending videos.
     * Updating the whole list of videos reload the list of videos and
     * thus close all video edition. If user was editing a video while
     * receiving a new list of videos from server, the list of videos
     * couldn't be applied.
     * If no video is being edited, update the list of videos with
     * pending videos.
     */
    function updateVideos(){
      if(pendingVideos){
        $scope.videos = pendingVideos;
        pendingVideos = null;
        replaceVideoIdByCategory();
      }
    }
    
    /**
     * 
     * Replace Id in Video by the name of the category
     * Category Id can be overwritten, it is only for display purpose
     */
    function replaceVideoIdByCategory(){
      angular.forEach($scope.videos, function(value, key) {
      //Search the item title with the right id
      var name = jsonPath($scope.categories, '$..*[?(@.id=="'+value.category+'")].title');
      if (name && name.length>0) value.category = name[0];
      else value.category = "";
      });
    }
  
  }

})(angular.module("ov.publish"));