import debuglog from 'debug-levels';
import lang from 'bot-lang';
import requireDir from 'require-dir';
import async from 'async';
import _ from 'lodash';
import Utils from './util';

const debug = debuglog('SS:Message');

const plugins = {};

// To load user plugins, just run Message.loadPlugins
const loadPlugins = function loadPlugins(path) {
  try {
    const pluginFiles = requireDir(path);
    Object.keys(pluginFiles).forEach((file) => {
      // For transpiled ES6 plugins with default export
      if (pluginFiles[file].default) {
        pluginFiles[file] = pluginFiles[file].default;
      }

      Object.keys(pluginFiles[file]).forEach((func) => {
        debug.verbose('Loading plugin:', path, func);
        plugins[func] = pluginFiles[file][func];
      });
    });
  } catch (e) {
    console.error(`Could not load plugins from ${path}: ${e}`);
  }
};

// Load built-in plugins
loadPlugins(`${__dirname}/plugins`);

class Message {
  /**
   * Creates a new Message object.
   * @param {String} message - The cleaned message.
   * @param {Object} options - The parameters.
   * @param {Object} options.factSystem - The fact system to use.
   * @param {Object} options.scope - Any additional per-message scope to pass in.
   */
  constructor(message, options, callback) {
    debug.verbose(`Creating message from string: ${message}`);

    this.id = Utils.genId();
    // this.plugins = options.plugins || {};

    this.factSystem = options.factSystem;
    this.createdAt = new Date();

    /**
     * We have a series of transforms that are applied to the input
     * `original` is the message `EXACTLY AS WRITTEN` by the user
     *
     * `raw` leans on bot-land and expands contractions, and fixes spelling
     *       - We also remove frivilous words, and convert to us-english.
     *
     * `clean` has been stripped of all punctuation and left with a word token form.
     */
    this.original = message;
    this.raw = lang.replace.all(message).trim();
    this.clean = Utils.cleanMessage(this.raw).trim();

    debug.verbose('Message before cleaning: ', message);
    debug.verbose('Message RAW: ', this.raw);
    debug.verbose('Message CLEAN: ', this.clean);

    const scope = _.merge({}, options.scope);
    scope.message = this;

    const eachPluginItor = (functionName, next) => {
      const functionArgs = [];
      functionArgs.push(err => next(err));
      functionName.apply(scope, functionArgs);
    };

    async.each(plugins, eachPluginItor, () => {
      callback(null, this);
    });
  }
}

const createMessage = function createMessage(message, options, callback) {
  if (!message) {
    debug.verbose('Message received was empty, callback immediately');
    return callback(null, {});
  }

  return new Message(message, options, callback);
};

export default {
  createMessage,
  loadPlugins,
};
