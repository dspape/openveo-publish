'use strict';

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var e2e = require('@openveo/test').e2e;
var PropertyPage = process.requirePublish('tests/client/e2eTests/pages/PropertyPage.js');
var PropertyModel = process.requirePublish('app/server/models/PropertyModel.js');
var PropertyHelper = process.requirePublish('tests/client/e2eTests/helpers/PropertyHelper.js');
var TableAssert = e2e.asserts.TableAssert;

// Load assertion library
var assert = chai.assert;
chai.use(chaiAsPromised);

describe('Property page', function() {
  var page, tableAssert, propertyHelper;

  // Prepare page
  before(function() {
    var propertyModel = new PropertyModel();
    propertyHelper = new PropertyHelper(propertyModel);
    page = new PropertyPage(propertyModel);
    tableAssert = new TableAssert(page, propertyHelper);
    page.logAsAdmin();
    page.load();
  });

  // Logout after tests
  after(function() {
    page.logout();
  });

  // Remove all properties after each tests then reload the page
  afterEach(function() {
    propertyHelper.removeAllEntities();
    page.refresh();
  });

  it('should display page title', function() {
    assert.eventually.ok(page.pageTitleElement.isPresent());
  });

  it('should display page description', function() {
    assert.eventually.ok(page.pageDescriptionElement.isPresent());
  });

  it('should be able to add / remove a text property', function() {
    var name = 'test add / remove text property';
    var description = 'test add / remove text property description';
    var type = page.translations.PROPERTIES.FORM_ADD_TEXT_TYPE;
    page.addLine(name, {type: type, description: description});
    assert.isFulfilled(page.getLine(name));
    assert.eventually.equal(page.getLineFieldText(name, 'description'), description);
    assert.eventually.equal(page.getLineFieldText(name, 'type'), type);
    page.removeLine(name);
  });

  it('should be able to add / remove a list property', function() {
    var name = 'test add / remove list property';
    var description = 'test add / remove list property description';
    var type = page.translations.PROPERTIES.FORM_ADD_LIST_TYPE;
    var values = ['value1', 'value2', 'value3'];
    page.addLine(name, {type: type, description: description, values: values});
    assert.isFulfilled(page.getLine(name));
    assert.eventually.equal(page.getLineFieldText(name, 'description'), description);
    assert.eventually.equal(page.getLineFieldText(name, 'type'), type);
    assert.eventually.equal(page.getLineFieldText(name, 'listValues'), values.join(', '));
    page.removeLine(name);
  });

  it('should be able to add / remove a boolean property', function() {
    var name = 'test add / remove boolean property';
    var description = 'test add / remove boolean property description';
    var type = page.translations.PROPERTIES.FORM_ADD_BOOLEAN_TYPE;
    page.addLine(name, {type: type, description: description});
    assert.isFulfilled(page.getLine(name));
    assert.eventually.equal(page.getLineFieldText(name, 'description'), description);
    assert.eventually.equal(page.getLineFieldText(name, 'type'), type);
    page.removeLine(name);
  });

  it('should not be able to add a text property without name, description or type', function() {
    var name = 'test add without all info';
    var description = 'test add without all info description';

    assert.isRejected(page.addLine(null, {}));
    assert.isRejected(page.addLine(name, {}));
    assert.isRejected(page.addLine(name, {description: description}));
    assert.isRejected(page.addLine(name, {type: page.translations.PROPERTIES.FORM_ADD_TEXT_TYPE}));
  });

  it('should not be able to add a boolean property without name, description or type', function() {
    var name = 'test add without all info';
    var description = 'test add without all info description';

    assert.isRejected(page.addLine(null, {}));
    assert.isRejected(page.addLine(name, {}));
    assert.isRejected(page.addLine(name, {description: description}));
    assert.isRejected(page.addLine(name, {type: page.translations.PROPERTIES.FORM_ADD_BOOLEAN_TYPE}));
  });

  it('should not be able to add a list property without values', function() {
    assert.isRejected(page.addLine('test add without all info', {
      description: 'test add without all info description',
      type: page.translations.PROPERTIES.FORM_ADD_LIST_TYPE
    }));
  });

  it('should not display buttons to change the number of items per page if lines lower than 6', function() {
    page.getTotalLines().then(function(totalLines) {
      if (totalLines < 6)
        assert.eventually.equal(page.itemsPerPageLinkElements.count(), 0);
    });
  });

  it('should be able to edit a text property', function() {
    var name = 'test edition';
    var description = 'test edition description';
    var newName = 'test edition renamed';
    var newDescription = 'test edition renamed description';

    // Create line
    page.addLine(name, {
      description: description,
      type: page.translations.PROPERTIES.FORM_ADD_TEXT_TYPE
    });

    // Edit property with a new name and new description
    page.editProperty(name, {name: newName, description: newDescription});
    assert.isFulfilled(page.getLine(newName));
    assert.eventually.equal(page.getLineFieldText(newName, 'description'), newDescription);
  });

  it('should be able to edit a boolean property', function() {
    var name = 'test edition';
    var description = 'test edition description';
    var newName = 'test edition renamed';
    var newDescription = 'test edition renamed description';

    // Create line
    page.addLine(name, {
      description: description,
      type: page.translations.PROPERTIES.FORM_ADD_BOOLEAN_TYPE
    });

    // Edit property with a new name and new description
    page.editProperty(name, {name: newName, description: newDescription});
    assert.isFulfilled(page.getLine(newName));
    assert.eventually.equal(page.getLineFieldText(newName, 'description'), newDescription);
  });

  it('should be able to edit a list property', function() {
    var name = 'test edition';
    var description = 'test edition description';
    var newName = 'test edition renamed';
    var newDescription = 'test edition renamed description';
    var newValues = ['value2', 'value2'];

    // Create line
    page.addLine(name, {
      description: description,
      type: page.translations.PROPERTIES.FORM_ADD_LIST_TYPE,
      values: ['value1']
    });

    // Edit property with a new name and new description
    page.editProperty(name, {
      name: newName,
      description: newDescription,
      values: newValues,
      type: page.translations.PROPERTIES.FORM_ADD_LIST_TYPE
    });
    assert.isFulfilled(page.getLine(newName));
    assert.eventually.equal(page.getLineFieldText(newName, 'description'), newDescription);
    assert.eventually.equal(page.getLineFieldText(newName, 'listValues'), newValues.join(', '));
  });

  it('should be able to cancel when removing a property', function() {
    return tableAssert.checkCancelRemove();
  });

  it('should be able to sort properties by name', function() {
    return tableAssert.checkSort(page.translations.PROPERTIES.NAME_COLUMN);
  });

  it('should have buttons to change the number of items per page', function() {
    return tableAssert.checkItemsPerPage();
  });

  it('should be able to remove several lines simultaneously', function() {
    return tableAssert.checkMassiveRemove();
  });

  it('should be paginated', function() {
    return tableAssert.checkPagination();
  });

  it('should be able to select lines', function() {
    return tableAssert.checkLinesSelection(page.translations.PROPERTIES.NAME_COLUMN);
  });

  describe('Search', function() {
    var linesToAdd;

    // Add lines
    beforeEach(function() {
      linesToAdd = [
        {name: 'test search 0', description: 'test search', type: PropertyModel.TYPE_TEXT},
        {name: 'test search 1', description: 'test search', type: PropertyModel.TYPE_TEXT},
        {name: 'test search 2', description: 'test search', type: PropertyModel.TYPE_LIST, values: ['value1']},
        {name: 'test search 3', description: 'test search', type: PropertyModel.TYPE_BOOLEAN}
      ];

      propertyHelper.addEntities(linesToAdd);
      return page.refresh();
    });

    it('should be able to search by full name', function() {
      var expectedValues;
      var search = {name: linesToAdd[0].name};

      // Get all line values before search
      return page.getLineValues(page.translations.PROPERTIES.NAME_COLUMN).then(function(values) {

        // Predict values
        expectedValues = values.filter(function(element) {
          return element === search.name;
        });

      }).then(function() {
        return tableAssert.checkSearch(search, expectedValues, page.translations.PROPERTIES.NAME_COLUMN);
      });
    });

    it('should be able to search by full description', function() {
      var expectedValues = [];
      var search = {description: linesToAdd[0].description};

      // Get all line values before search
      return page.getAllLineDetails().then(function(datas) {

        // Predict values
        var filteredDatas = datas.filter(function(data) {
          return data.fields.description === search.description;
        });

        for (var i = 0; i < filteredDatas.length; i++)
          expectedValues.push(filteredDatas[i].cells[1]);

      }).then(function() {
        return tableAssert.checkSearch(search, expectedValues, page.translations.PROPERTIES.NAME_COLUMN);
      });
    });

    it('should be able to search by both description and name', function() {
      var expectedValues = [];
      var search = {name: linesToAdd[0].name, description: linesToAdd[0].description};

      // Get all line values before search
      return page.getAllLineDetails().then(function(datas) {

        // Predict values
        var filteredDatas = datas.filter(function(data) {
          return data.fields.name === search.name && data.fields.description === search.description;
        });

        for (var i = 0; i < filteredDatas.length; i++)
          expectedValues.push(filteredDatas[i].cells[1]);

      }).then(function() {
        return tableAssert.checkSearch(search, expectedValues, page.translations.PROPERTIES.NAME_COLUMN);
      });
    });

    it('should be able to search by partial name', function() {
      var expectedValues;
      var search = {name: linesToAdd[1].name.slice(0, 2)};

      // Get all line values before search
      return page.getLineValues(page.translations.PROPERTIES.NAME_COLUMN).then(function(values) {

        // Predict values
        expectedValues = values.filter(function(element) {
          return new RegExp(search.name).test(element);
        });

      }).then(function() {
        return tableAssert.checkSearch(search, expectedValues, page.translations.PROPERTIES.NAME_COLUMN);
      });
    });

    it('should be able to search by type', function() {
      var expectedValues;
      var search = {type: page.translations.PROPERTIES.FORM_ADD_LIST_TYPE};

      // Get all line values before search
      return page.getLineValues(page.translations.PROPERTIES.NAME_COLUMN).then(function(values) {

        // Predict values
        expectedValues = values.filter(function(element) {
          for (var i = 0; i < linesToAdd.length; i++) {
            if (element === linesToAdd[i].name && linesToAdd[i].type === PropertyModel.TYPE_LIST)
              return true;
          }
          return false;
        });

      }).then(function() {
        return tableAssert.checkSearch(search, expectedValues, page.translations.PROPERTIES.NAME_COLUMN);
      });
    });

    it('should be case sensitive', function() {
      var search = {name: linesToAdd[1].name.toUpperCase()};

      page.search(search);
      assert.isRejected(page.getLineValues(page.translations.PROPERTIES.NAME_COLUMN));
    });

    it('should be able to clear search', function() {
      var search = {name: linesToAdd[0].name};
      page.search(search);
      page.clearSearch();
      assert.isFulfilled(page.getLineValues(page.translations.PROPERTIES.NAME_COLUMN));
    });

  });

});
