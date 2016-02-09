'use strict';

var path = require('path');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var ChapterPage = process.requirePublish('tests/client/e2eTests/pages/ChapterPage.js');
var mediaHelper = process.requirePublish('tests/client/e2eTests/helpers/mediaHelper.js');
var datas = process.requirePublish('tests/client/e2eTests/database/data.json');

// Load assertion library
var assert = chai.assert;
chai.use(chaiAsPromised);

describe('Chapter page', function() {
  var page;
  var medias;
  var mediaId = 'test-chapters-page-translations';
  var mediaFilePath = path.join(process.rootPublish, 'tests/client/e2eTests/packages');
  var mediaFileName = 'blank.mp4';

  // Create a media content
  before(function() {
    page = new ChapterPage(mediaId);
    mediaHelper.createMedia(mediaId, mediaFilePath, mediaFileName).then(function(mediasAdded) {
      medias = mediasAdded;
    });
  });

  // Remove media content
  after(function() {
    mediaHelper.removeMedias(medias);
    page.logout();
  });

  describe('without manage permission', function() {

    // Log with a user without manage permission
    before(function() {
      page.logAs(datas.users.publishGuest);
    });

    it('Should not access the page', function() {
      return page.load().then(function() {
        assert.ok(false, 'User has access to chapters page and should not');
      }, function() {
        assert.ok(true);
      });
    });

  });

  describe('with only edit chapters permission', function() {

    // Log with a user with only edit chapters permission
    before(function() {
      page.logAs(datas.users.publishChaptersEdit);
      page.load();
    });

    // Reload page after each test
    afterEach(function() {
      page.refresh();
    });

    it('should not be able to add / remove a begin cut', function() {
      page.addCut(0.1, true);
      page.getAlertMessages().then(function(messages) {
        assert.equal(messages.length, 2);
        assert.equal(messages[0], page.translations.ERROR.FORBIDDEN);
        assert.equal(messages[1], page.translations.ERROR.FORBIDDEN);
      });
      page.closeAlerts();
    });

    it('should not be able to add / remove a end cut', function() {
      page.addCut(0.8, false);
      page.getAlertMessages().then(function(messages) {
        assert.equal(messages.length, 2);
        assert.equal(messages[0], page.translations.ERROR.FORBIDDEN);
        assert.equal(messages[1], page.translations.ERROR.FORBIDDEN);
      });
      page.closeAlerts();
    });

    it('should not be able to add a chapter', function() {
      var chapterToAdd = {
        time: '00:10:00',
        title: 'Test add',
        description: 'Test add description'
      };

      // Add and cancel chapter
      page.addChapter(chapterToAdd);

      page.getAlertMessages().then(function(messages) {
        assert.equal(messages.length, 1);
        assert.equal(messages[0], page.translations.ERROR.FORBIDDEN);
      });
      page.closeAlerts();
    });

  });
});