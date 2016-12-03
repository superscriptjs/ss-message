import lang from "bot-lang";
import nlp from "nlp_compromise";

const addTags = function(cb) {
  this.message.tags = lang.tag.all(this.message.original);
  cb();
}

const addEntities = function(cb) {
  this.message.entities = nlp(this.message.original).people().asArray();
  cb();
}

const addDates = function(cb) {
  this.message.dates = nlp(this.message.original).dates().asArray();
  cb();
}

const fixNumericForms = function(cb) {
  this.message.clean = nlp(this.message.clean).values().toNumber().plaintext();
  cb();
}

export default {addTags, addEntities, addDates, fixNumericForms};