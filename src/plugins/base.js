import lang from 'bot-lang';
import nlp from 'compromise';
import Lemmer from 'lemmer';
import async from 'async';
import _ from 'lodash';
import pos from 'pos';

const tagger = new pos.Tagger();
const lexer = new pos.Lexer();

const addTags = function addTags(cb) {
  this.message.tags = lang.tag.all(this.message.original);
  cb();
};

const addNlp = function addNlp(cb) {
  this.message.nlp = nlp(this.message.original);
  cb();
};

const addEntities = function addEntities(cb) {
  const entities = this.message.nlp.match('(#Person|#Place|#Organization)').out('array');
  this.message.entities = entities;

  // For legacy support
  this.message.names = this.message.nlp.people().out('array');
  cb();
};

const addDates = function addDates(cb) {
  this.message.dates = this.message.nlp.dates().out('array');
  cb();
};

const addWords = function addWords(cb) {
  this.message.words = this.message.clean.split(' ');
  cb();
};

const addPos = function addPos(cb) {
  this.message.nouns = this.message.nlp.match('#Noun').out('array');
  this.message.adverbs = this.message.nlp.match('#Adverb').out('array');
  this.message.verbs = this.message.nlp.match('#Verb').out('array');
  this.message.adjectives = this.message.nlp.match('#Adjective').out('array');
  this.message.pronouns = this.message.nlp.match('#Pronoun').out('array');

  // Fix for pronouns getting mixed in with nouns
  _.pullAll(this.message.nouns, this.message.pronouns);
  cb();
};

// We look at math type questions
// What is 1+1?
// What is 4+2-1?
// What is 50 percent of 40?
// What is half of six?
// What is seven multiplied by six?
// What is 7 divided by 0?
// What is the square root of 9?
// What is a third of 6?
const hasExpression = function hasExpression(cb) {
  const expressionTerms = ['add', 'plus', 'and', '+', '-', 'minus', 'subtract', 'x', 'times', 'multiply', 'multiplied', 'of', 'divide', 'divided', '/', 'half', 'percent', '%'];

  const containsArithmeticTerm = _.some(this.message.words, word => expressionTerms.indexOf(word) !== -1);

  const burstSentence = this.message.words.join(" ");
  const nlp2 = nlp(burstSentence);
  this.message.numbers = nlp2.match('#Value').out('array');
  this.message.numbers = this.message.numbers.map(function(x){ return +x; });

  // Special case "half" is really .5 and a number
  if (_.indexOf(this.message.words, "half") !== -1) {
    this.message.numbers.push(.5);
  }
  const hasTwoNumbers = this.message.numbers.length >= 2;

  this.message.expression = (containsArithmeticTerm && hasTwoNumbers);
  cb();
};

const pennToWordnet = function pennToWordnet(pennTag) {
  if (pennTag[0] === 'J') {
    return 'a';
  } else if (pennTag[0] === 'V') {
    return 'v';
  } else if (pennTag[0] === 'N') {
    return 'n';
  } else if (pennTag[0] === 'R') {
    return 'r';
  }
  return null;
};

const fixup = function fixup(cb) {
  // fix numeric forms
  // twenty-one => 21
  this.message.clean = nlp(this.message.clean).values().toNumber().all().out('text');

  // singalize / lemmatize
  // This does a slightly better job than `.split(" ")`
  this.message.words = lexer.lex(this.message.clean);
  const taggedWords = tagger.tag(this.message.words);

  const itor = (hash, next) => {
    const word = hash[0].toLowerCase();
    const tag = pennToWordnet(hash[1]);

    if (tag) {
      return Lemmer.lemmatize(`${word}#${tag}`, next);
    }
    // Some words don't have a tag ie: like, to.
    return next(null, [word]);
  };

  async.map(taggedWords, itor, (err, transformed) => {
    this.message.lemString = _.map(_.flatten(transformed), a => a.split('#')[0]).join(' ');
    cb();
  });
};

const addQuestionTypes = function addQuestionTypes(cb) {
  // Classify Question
  const questionWords = ['who', 'whose', 'whom', 'what', 'where', 'when', 'why', 'which', 'name', 'did', 'do', 'does', 'have', 'had', 'has'];
  let isQuestion = false;

  if (this.message.raw.slice(-1) === '?') isQuestion = true;
  
  if (questionWords.indexOf(this.message.words[0].toLowerCase()) !== -1) {
    isQuestion = true;
  }
  this.message.isQuestion = isQuestion;

  cb();
};

// Order here matters
export default {
  addTags,
  addNlp,
  addEntities,
  addDates,
  addPos,
  addWords,
  fixup,
  hasExpression,
  addQuestionTypes,
};
