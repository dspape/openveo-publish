# 3.0.0 /

## BREAKING CHANGES

- The watcher which used to be a sub process is now integrated inside the OpenVeo process
- Back end page to start / stop the watcher has been removed
- Chapters are no more initiated relatively to slides. User have to define them himself.
- Drop support for Node.js &lt;7.4.0
- Drop support for NPM &lt;4.0.5
- Usage of Web Service end points */videos* and */properties* has change. *page* parameter now starts at 0 instead of 1.
- Usage of Web Service end point */publish/videos/{video_id}* has change. OpenVeo publish now uses OpenVeo CDN url for local videos urls and videos thumbnails instead of relative urls.

## NEW FEATURES

- **Search engines** for medias and custom properties have been improved. Multiple search fields have been replaced by a unique field. Search is now case insensitive and search is made on the whole string, not just strings starting with the query. The query string is taken as the whole when searching meaning that special characters aren't interpreted and thus will be searched as is.
- **Rich media tags**. Tags and chapters now embed a WYSIWYG editor. Tags can also be associated with a file that user can upload up to 20MB. These associated information can be previewed before saving modification and are rendered in player views associated with tags and chapters.

## BUG FIXES

- Fix the freeze of packages during a publication process. Sometimes packages could stay stuck in a state (copy, retrieve metadata etc.).

## DEPENDENCIES

### SERVER

- **multer 1.3.0** has been added
- **javascript-state-machine** has been updated from 2.3.5 to **2.4.0**
- **googleapis** has been updated from 5.2.1 to **16.0.0**
- **xml2js** has been updated from 0.4.16 to **0.4.17**
- **request** has been updated from 2.72.0 to **2.79.0**
- **ftps** has been updated from 0.4.7 to **1.0.0**
- **grunt** has been updated from 0.4.5 to **1.0.1**
- **grunt-contrib-uglify** has been updated from 1.0.1 to **2.0.0**
- **grunt-eslint** has been updated from 18.1.0 to **19.0.0**
- **grunt-gh-pages** has been updated from 1.1.0 to **2.0.0**
- **grunt-karma** has been updated from 1.0.0 to **2.0.0**
- **grunt-mkdocs** has been updated from 0.1.3 to **0.2.0**
- **grunt-mocha-test** has been updated from 0.12.7 to **0.13.2**
- **karma** has been updated from 0.13.22 to **1.3.0**
- **karma-chrome-launcher** has been updated from 1.0.1 to **2.0.0**
- **karma-mocha** has been updated from 1.0.1 to **1.3.0**
- **karma-phantomjs-launcher** has been updated from 1.0.0 to **1.0.2**
- **mocha** has been updated from 2.4.5 to **3.2.0**
- **pre-commit** has been updated from 1.1.2 to **1.2.2**
- **glob** has been removed
- **grunt-remove** has been removed
- **grunt-rename** has been removed
- **grunt-extend-config** has been removed
- **grunt-init** has been removed

### CLIENT

- **angular-ui-tinymce 0.0.18**  has been added

# 2.1.2 / 2017-01-11

- Patch old richmedia format compatibility
- Add migration script to save existing content in the new format

# 2.1.1 / 2017-01-09

- Patch old mediaId format issue

# 2.1.0 / 2017-01-03

- Add multi-sources video feature
- Add local video upload
- Add delete video from provider when user delete it in Openveo
- Correct and improve watcher behavior

# 2.0.6 / 2016-09-09

- Set media name according to package name on upload

# 2.0.5 / 2016-07-19

- Debug dash video by updating videojs dependencies
- Use package name to create video entity on upload

# 2.0.4 / 2016-07-07

- Avoid conflict for transition view effects
- Debug rights token for chapter edition
- Add Wowza settings in install process

# 2.0.3 / 2016-06-21

- enhanced deployment forcing bower using https protocol instead of git

# 2.0.2 / 2016-06-15

- Fix critical issue while publishing and unpublishing video
- Add migration process for default video metadata
- Allow chapters to be selected and removed by group

# 2.0.1 / 2016-06-10

- Add install process for wowza conf
- Add default upload user and default upload group, anonymousId if none.

# 2.0.0 / 2016-05-30

- Upload to Wowza plateform
- Change sources format to play adaptive streaming sources
- Update Webservices for publish entities
- Add Properties type (boolean, list)
- Refactoring taxonomy category by using core taxonomy entities
- Update plugin interface due to API dependencies
- Add Statistics views count
- Update entities by using new Models from API (Entity and ContentEntity)
- Add Groups and Owner to content entities
- Update Controllers from API Controller interface
- Add migration script
- Avoid collision between core and other plugin
- Update dependencies

# 1.2.0 / 2016-02-19

- Update AngularJS from version 1.4.1 to 1.4.7
- Update html5shiv from version 3.7.2 to 3.7.3
- Add support for Youtube platform
- Add a backup script to save data between upgrades
- Correct availability bug on a video hosted by Vimeo
- Correct cut title translations on chapters editor
- Correct JavaScript when using time bar on chapters editor
- Change the name of the retry permission from "Retry to launch video saving process" to "Retry video processing"
- Immediately update the videos catalog when choosing the action "send to ..."
- Add translation to the player in chapters editor
- Activate auto-play on videos
- Block chapters editor page if an error occured in the player
- Improve display of long titles in chapters editor page

# 1.1.3 / 2015-11-27

Correct bug on video resolution cache for Vimeo platform

# 1.1.2 / 2015-11-25

Update openveo-player dependency to authorize all minor versions from 1.1.0

# 1.1.1 / 2015-11-25

Update dependency versions to authorize all minor versions of @openveo/test, @openveo/core and @openveo/api

# 1.1.0 / 2015-11-24

- Enhanced mobile back-end display
- Update video webservice
- Generate video thumb once video is well uploaded
- Verify that video is available before viewing th video

# 1.0.1 / 2015-10-26

Correct bug on video player view, the player wasn't displayed at all.

# 1.0.0 / 2015-10-26

Firt stable version of [OpenVeo](https://github.com/veo-labs/openveo-core) Publish plugin.

Adds the following features :

- The possibility to upload videos, on [Vimeo](https://vimeo.com), with synchronized images. ([Watcher](/watcher))
- Back end pages :
    - A page to manage the list of videos
    - A page to create and organize video categories
    - A page to create new video properties
    - A page to start / stop the watcher
    - A page to add chapters on a video or cut a video (begin / end)
- A public page to play a video with images synchronization and chapters