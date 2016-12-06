import lang from "bot-lang";
import nlp from "nlp_compromise";
import Lemmer from "lemmer";
import async from "async";
import _ from "lodash";
import pos from "pos";

let tagger = new pos.Tagger();

const addTags = function(cb) {
  this.message.tags = lang.tag.all(this.message.original);
  cb();
}

const addEntities = function(cb) {
  const entities = nlp(this.message.original).match('(#Person|#Place|#Organization)').asArray();
  this.message.entities = entities;

  // For legacy support 
  this.message.names = nlp(this.message.original).people().asArray();
  cb();
}

const addDates = function(cb) {
  this.message.dates = nlp(this.message.original).dates().asArray();
  cb();
}

const addWords = function(cb) {
  this.message.words = this.message.clean.split(" ");
  cb();
}

const addPos = function(cb) {
  this.message.nouns = nlp(this.message.original).match('#Noun').asArray();
  this.message.adverbs = nlp(this.message.original).match('#Adverb').asArray();
  this.message.verbs = nlp(this.message.original).match('#Verb').asArray();
  this.message.adjectives = nlp(this.message.original).match('#Adjective').asArray();
  this.message.pronouns = nlp(this.message.original).match('#Pronoun').asArray();
  cb();
}

const pennToWordnet = function (pennTag) {
  if (pennTag[0] === "J") {
    return "a";
  } else if (pennTag[0] === "V") {
    return "v";
  } else if (pennTag[0] === "N") {
    return "n";
  } else if (pennTag[0] === "R") {
    return "r";
  } else {
    return null;
  }
}

const fixup = function(cb) {
  let that = this;
  // fix numeric forms
  // twenty-one => 21
  that.message.clean = nlp(that.message.clean).values().toNumber().plaintext();

  // singalize / lemmatize
  // This does a slightly better job than `.split(" ")`
  that.message.words = new pos.Lexer().lex(that.message.clean);
  let taggedWords = tagger.tag(that.message.words);

  let itor = function (hash, next) {
    let word = hash[0].toLowerCase();
    let tag = pennToWordnet(hash[1]);

    if (tag) {
      try {
        Lemmer.lemmatize(word + "#" + tag, next);
      } catch (e) {
        // This is probably because it isn't an english word.
        next(null, [word]);
      }
    } else {
      // Some words don't have a tag ie: like, to.
      next(null, [word]);
    }
  };

  async.map(taggedWords, itor, function (err, transformed) {
    that.message.lemString = _.map(_.flatten(transformed), function (a) {
      return a.split("#")[0];
    }).join(" ");
    cb();
  });
}

const addQuestionTypes = function(cb) {
  // Classify Question
  let questionWords = ["who", "whose", "whom", "what", "where", "when", "why", "which", "name", "did", "do", "does", "have", "had", "has"];
  let isQuestion = false;
  
  if(this.message.raw.slice(-1) === "?") isQuestion = true;
  if(questionWords.indexOf(this.message.words[0]) !== -1) isQuestion = true;
  this.message.isQuestion = isQuestion;

  // Sorry this isn't going to make the 1.0 cut
  // this.qtype = options.qtypes.classify(lemString);
  // this.qSubType = options.qtypes.questionType(this.raw);

  cb();
}

// Order here matters
export default {addTags, addEntities, addDates, addPos, addWords, fixup, addQuestionTypes};
