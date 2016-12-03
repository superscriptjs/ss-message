import lang from "bot-lang";
import nlp from "nlp_compromise";

const addTags = function(cb) {
  this.message.tags = lang.tag.all(this.message.original);
  cb();
}

const addEntities = function(cb) {
  this.message.entities = nlp(this.message.original).people().asArray();

  // For legacy support 
  this.message.names = this.message.entities;
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
  this.message.nouns = nlp(this.message.original).nouns().asArray();
  this.message.adverbs = nlp(this.message.original).adverbs().asArray();
  this.message.verbs = nlp(this.message.original).verbs().asArray();
  this.message.adjectives = nlp(this.message.original).adjectives().asArray();
  this.message.pronouns = [];
  const pronouns = ["it","I","you","he","they","we","she","who","them","me","him","one","her","us","something","nothing","anything","himself","everything","someone","themselves","everyone","itself","anyone","myself"];
  const words = this.message.clean.split(" ");
  words.forEach((word) => {
    if (pronouns.indexOf(word) !== -1) {
      this.message.pronouns.push(word);
    }
  });
  cb();
}

const fixNumericForms = function(cb) {
  this.message.clean = nlp(this.message.clean).values().toNumber().plaintext();
  cb();
}

export default {addTags, addEntities, addDates, addPos, addWords, fixNumericForms};
