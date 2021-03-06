/* eslint-env mocha */
/* eslint func-names:0 no-unused-expressions:0 */

'use strict';

var expect = require('chai').expect;
var fileio = require('../lib/fileio');
var Promise = require('bluebird');
var fsReadFile = Promise.promisify(require('fs').readFile);
var fsUnlink = Promise.promisify(require('fs').unlink);
var path = require('path');

describe('methods', function() {
  it('should have a convert function', function() {
    expect(fileio.convert).to.be.a('function');
  });

  it('should have a getContents function', function() {
    expect(fileio.getContents).to.be.a('function');
  });

  it('should have a tmpSave function', function() {
    expect(fileio.tmpSave).to.be.a('function');
  });

  it('should have a removeTmp function', function() {
    expect(fileio.removeTmp).to.be.a('function');
  });

  it('should have a getTmp function', function() {
    expect(fileio.getTmp).to.be.a('function');
  });
});

describe('getContents', function() {
  var mockArticle = {
    title: 'foo bar',
    mdPath: path.join(process.cwd(), 'test', 'mock', 'mockArticle.md'),
    description: 'my description',
  };
  var finishedMockArticle = Object.create(mockArticle);

  before(function(done) {
    fsReadFile(mockArticle.mdPath, 'utf8').then(function(data) {
      finishedMockArticle.contents = data;
      done();
    }).catch(function(err) { console.log(err);});
  });

  it('should take in an article object and adds contents to it', function(done) {
    fileio.getContents(mockArticle).then(function(newArticle) {
      expect(newArticle.title).to.equal(finishedMockArticle.title);
      expect(newArticle.mdPath).to.equal(finishedMockArticle.path);
      expect(newArticle.description).to.equal(finishedMockArticle.description);
      expect(newArticle.contents).to.equal(finishedMockArticle.contents);
      done();
    });
  });
});

describe('convert', function() {
  var testPath = path.join(process.cwd(), 'test', 'mock', 'mockArticle.md');
  var contents = null;
  var goodRoff = null;

  before(function(done) {
    fsReadFile(testPath, 'utf8').then(function(data) {
      contents = data;
    }).then(function() {
      return fsReadFile(path.join(process.cwd(), 'test', 'mock', 'mockArticle.roff'), 'utf8');
    }).then(function(result) {
      goodRoff = result;
      done();
    }).catch(function(err) { console.log(err); });
  });

  it('should convert articles from md to roff', function() {
    expect(fileio.convert(contents, {})).to.contain(goodRoff.substr(1, -1).trim());
  });
});

describe('tmpSave', function() {
  var tmp = null;

  it('should save a temporary file', function(done) {
    fileio.tmpSave('hello world').then(function(tmpFile) {
      tmp = tmpFile;
      expect(tmpFile).to.equal(path.resolve(fileio.getTmp()));
      fsReadFile(tmpFile, 'utf8').then(function(contents) {
        expect(contents).to.equal('hello world');
        done();
      });
    });
  });

  after(function(done) {
    fsUnlink(tmp).then(function() {
      done();
    });
  });
});

describe('removeTmp', function() {
  before(function(done) {
    fileio.tmpSave('hello world').then(function() {
      done();
    });
  });

  it('should delete the temporary file', function(done) {
    fileio.removeTmp().then(function(result) {
      expect(result).to.equal('done');
      done();
    });
  });
});

describe('getTmp', function() {
  it('should get the tmpfile location', function() {
    expect(fileio.getTmp()).to.be.a('string');
  });
});
