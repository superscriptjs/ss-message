import lang from 'bot-lang';
import nlp from 'nlp_compromise';
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
  const entities = this.message.nlp.match('(#Person|#Place|#Organization)').asArray();
  this.message.entities = entities;

  // For legacy support
  this.message.names = this.message.nlp.people().asArray();
  cb();
};

const addDates = function addDates(cb) {
  this.message.dates = this.message.nlp.dates().asArray();
  cb();
};

const addWords = function addWords(cb) {
  this.message.words = this.message.clean.split(' ');
  cb();
};

const addPos = function addPos(cb) {
  this.message.nouns = this.message.nlp.match('#Noun').asArray();
  this.message.adverbs = this.message.nlp.match('#Adverb').asArray();
  this.message.verbs = this.message.nlp.match('#Verb').asArray();
  this.message.adjectives = this.message.nlp.match('#Adjective').asArray();
  this.message.pronouns = this.message.nlp.match('#Pronoun').asArray();

  // Fix for pronouns getting mixed in with nouns
  _.pullAll(this.message.nouns, this.message.pronouns);
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
  this.message.clean = nlp(this.message.clean).values().toNumber().plaintext();

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
  if (questionWords.indexOf(this.message.words[0]) !== -1) isQuestion = true;
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
  addQuestionTypes,
};
