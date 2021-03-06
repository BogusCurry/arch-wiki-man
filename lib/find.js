'use strict';

var inquirer = require('inquirer');
var chalk = require('chalk');
var getContents = require('../lib/fileio').getContents;

exports.narrowDown = narrowDown;
exports.selectArticle = selectArticle;

function narrowDown(articles, terms, deep, apropos, doFallback, englishArticles) {
  var reSearchTerms = terms.map(function mapRE(term) {
    // escape invalid regex characters in the search terms before making a new regex
    return new RegExp(term.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&'), 'i');
  });

  var filtered;

  if (doFallback) {
    filtered = englishArticles.slice();
  } else {
    filtered = articles.slice();
  }

  if (apropos) {
    filtered = filtered.map(function getArticleContents(art) {
      return getContents(art).then(function makeArts(article) {
        return article;
      });
    });
    return Promise.all(filtered).then(function filterIt(items) {
      return items.filter(function filterOnTitleContents(article) {
        return reSearchTerms.every(function checkRE(reTerm) {
          return reTerm.test(article.title) || reTerm.test(article.contents);
        });
      });
    });
  } else if (deep) {
    return filtered.filter(function filterOnTitleDesc(article) {
      return reSearchTerms.every(function checkRE(reTerm) {
        return reTerm.test(article.title) || reTerm.test(article.description);
      });
    });
  } else {
    return filtered.filter(function filterOnTitle(article) {
      return reSearchTerms.every(function checkRE(reTerm) {
        return reTerm.test(article.title);
      });
    });
  }
}

function selectArticle(articles, lang, searchTerms, isDeep, isApro, englishArticles) {
  return new Promise(function makePromise(resolve, reject) {
    var len = articles.length;
    var choices;

    var sorted = articles.sort(function sortSpecialLast(a, b) {
      return b.lastrevid - a.lastrevid;
    });

    var tWidth = (/chinese|korean|japanese/gi.test(lang)) ? 40 : 80;

    if (len === 0) {
      if (lang === 'english') {
        return reject('No articles match your query.');
      } else {
        return resolve(selectArticle(narrowDown(null, searchTerms, isDeep, isApro, true, englishArticles), 'english'));
      }
    } else if (len === 1) {
      return resolve(sorted[0]);
    } else {
      choices = sorted.map(function makeChoices(article, index) {
        var entry = ['[', chalk.yellow(index + 1), '/', chalk.yellow(len), '] ', chalk.green(article.title), ': ',  chalk.gray(article.description.substr(0, tWidth))].join('').replace(/\\?\n/g, '');
        return (article.description.length + article.title.length < tWidth) ? entry : entry + chalk.gray('..');
      });

      inquirer.prompt([{
        type: 'list',
        name: 'selection',
        message: 'Select an article:',
        choices: choices,
      }], function getAnswer(response) {
        var pos = choices.indexOf(response.selection);
        return resolve(sorted[pos]);
      });
    }
  });
}
