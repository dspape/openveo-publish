'use strict';

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var e2e = require('@openveo/test').e2e;
var MediaPage = process.requirePublish('tests/client/e2eTests/pages/MediaPage.js');
var VideoModel = process.requirePublish('app/server/models/VideoModel.js');
var mediaHelper = process.requirePublish('tests/client/e2eTests/helpers/mediaHelper.js');
var browserExt = e2e.browser;

// Load assertion library
var assert = chai.assert;
chai.use(chaiAsPromised);

describe('Media page translations', function() {
  var page;

  /**
   * Checks translations.
   *
   * @param {Number} [index] Index of the language to test in the list of languages
   * @return {Promise} Promise resolving when translations have been tested
   */
  function checkTranslations(index) {
    index = index || 0;
    var languages = page.getLanguages();

    if (index < languages.length) {
      return page.selectLanguage(languages[index]).then(function() {

        // Page translations
        assert.eventually.equal(page.getTitle(), page.translations.MEDIAS.PAGE_TITLE);
        assert.eventually.equal(page.pageTitleElement.getText(), page.translations.MEDIAS.TITLE);
        assert.eventually.equal(page.pageDescriptionElement.getText(), page.translations.MEDIAS.INFO);

        // Search engine translations
        page.searchLinkElement.getText().then(function(text) {
          assert.equal(text.trim(), page.translations.UI.SEARCH_BY);
        });

        page.openSearchEngine();
        var searchFields = page.getSearchFields(page.searchFormElement);
        var searchNameField = searchFields.name;
        var searchDescriptionField = searchFields.description;
        var searchDateField = searchFields.date;
        var searchCategoryField = searchFields.category;
        assert.eventually.equal(searchNameField.getLabel(), page.translations.MEDIAS.TITLE_FILTER);
        assert.eventually.equal(searchDescriptionField.getLabel(), page.translations.MEDIAS.DESCRIPTION_FILTER);
        assert.eventually.equal(searchDateField.getLabel(), page.translations.MEDIAS.DATE_FILTER);
        assert.eventually.equal(searchCategoryField.getLabel(), page.translations.MEDIAS.CATEGORY_FILTER);
        page.closeSearchEngine();

        // All actions translations
        page.setSelectAllMouseOver();
        assert.eventually.equal(page.popoverElement.getAttribute('content'), page.translations.UI.SELECT_ALL);

        page.selectAllLines();
        browserExt.click(page.actionsButtonElement);
        var removeActionElement = page.actionsElement.element(by.cssContainingText('a', page.translations.UI.REMOVE));
        assert.eventually.ok(removeActionElement.isDisplayed(), 'Missing all remove action');

        // Headers translations
        assert.eventually.ok(page.isTableHeader(page.translations.MEDIAS.NAME_COLUMN), 'Missing name column');
        assert.eventually.ok(page.isTableHeader(page.translations.MEDIAS.DATE_COLUMN), 'Missing date column');
        assert.eventually.ok(page.isTableHeader(page.translations.MEDIAS.CATEGORY_COLUMN), 'Missing category column');
        assert.eventually.ok(page.isTableHeader(page.translations.MEDIAS.STATUS_COLUMN), 'Missing status column');
        assert.eventually.ok(page.isTableHeader(page.translations.UI.ACTIONS_COLUMN), 'Missing actions column');

        return browser.waitForAngular();
      }).then(function() {
        return checkTranslations(++index);
      });
    } else {
      return protractor.promise.fulfilled();
    }
  }

  /**
   * Checks a state translation.
   *
   * @param {Number} state The state to test
   * @return {Promise} Promise resolving when checked
   */
  function checkState(state) {
    return browser.waitForAngular().then(function() {
      var lines;
      var statusHeaderIndex;
      var linesToAdd = [
        {
          id: '0',
          state: state,
          title: 'Test state'
        }
      ];

      // Add lines
      page.addLinesByPass(linesToAdd).then(function(addedLines) {
        lines = addedLines;
      });

      // Get status header index
      page.getTableHeaderIndex(page.translations.MEDIAS.STATUS_COLUMN).then(function(index) {
        statusHeaderIndex = index;
        return page.getLineCells(linesToAdd[0].title);
      }).then(function(cells) {

        // Test media state label
        if (state === VideoModel.ERROR_STATE)
          assert.equal(cells[statusHeaderIndex].indexOf(page.translations.MEDIAS['STATE_' + state]), 0);
        else
          assert.equal(cells[statusHeaderIndex], page.translations.MEDIAS['STATE_' + state]);
      });

      // Remove lines
      return browser.waitForAngular().then(function() {
        return page.removeLinesByPass(lines);
      });
    });
  }

  /**
   * Checks states translations.
   *
   * @param {Array} states The list of states to test
   * @param {Number} [index] Index of the state to test in the list of states
   * @return {Promise} Promise resolving when translations have been tested
   */
  function checkStates(states, index) {
    index = index || 0;

    if (index < states.length) {
      return checkState(states[index]).then(function() {
        return checkStates(states, ++index);
      });
    } else
      return protractor.promise.fulfilled();
  }

  /**
   * Checks translations of all media state labels for each language.
   *
   * @param {Number} [index] Index of the language to test in the list of languages
   * @return {Promise} Promise resolving when translations have been tested
   */
  function checkStateTranslations(index) {
    index = index || 0;
    var languages = page.getLanguages();

    if (index < languages.length) {
      return page.selectLanguage(languages[index]).then(function() {
        var states = page.getMediaStates();

        // Check states translations
        return checkStates(states);
      }).then(function() {
        return checkStateTranslations(++index);
      });
    } else {
      return protractor.promise.fulfilled();
    }
  }

  // Load page
  before(function() {
    page = new MediaPage(new VideoModel());
    page.logAsAdmin();
    page.load();
  });

  // Logout
  after(function() {
    page.logout();
  });

  // Remove all videos after each tests then reload the page
  afterEach(function() {
    mediaHelper.removeAllMedias();
    page.refresh();
  });

  it('should be available in different languages', function() {
    page.addLinesByPass([
      {
        id: '0',
        state: VideoModel.PUBLISHED_STATE,
        title: 'Test state'
      }
    ]);

    checkTranslations();
  });

  it('should be available for medias status in different languages', function() {
    checkStateTranslations();
  });

});
