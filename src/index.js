import debuglog from 'debug-levels';
import lang from 'bot-lang';
import requireDir from 'require-dir';
import async from 'async';
import _ from 'lodash';
import Utils from './util';

const debug = debuglog('SS:Message');

// The message could be generated by a reply or raw input
// If it is a reply, we want to save the ID so we can filter them out if said again
class Message {
  /**
   * Creates a new Message object.
   * @param {String} message - The cleaned message.
   * @param {Object} options - The parameters.
   * @param {String} options.original - The original message text.
   * @param {Object} options.factSystem - The fact system to use.
   * @param {String} [options.replyId] - If the message is based on a reply.
   * @param {String} [options.clearConversation] - If you want to clear the conversation.
   */
  constructor(message, options, callback) {
    debug.verbose(`Creating message from string: ${message}`);

    this.id = Utils.genId();
    this.plugins = options.plugins || {};

    // If this message is based on a Reply.
    if (options.replyId) {
      this.replyId = options.replyId;
    }

    if (options.clearConversation) {
      this.clearConversation = options.clearConversation;
    }

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
    debug.verbose('Message after cleaning: ', this.clean);

    const scope = _.merge({}, options.scope);
    scope.message = this;

    let self = this;
    const eachPluginItor = function(functionName, next) {
      const functionArgs = [];
      functionArgs.push((err, functionResponse) => {
        return next(err, null);
      });
      functionName.apply(scope, functionArgs);
    }

    async.each(this.plugins, eachPluginItor, function() {
      callback(null, self);
    })
  }

  static createMessage(message, options, callback) {
    if (!message) {
      debug.verbose('Message received was empty, callback immediately');
      return callback(null, {});
    }

    // Built-in plugins
    options.plugins = loadPlugins(`${__dirname}/plugins`);

    // For user plugins
    if (options.pluginsPath) {
      options.plugins = _.merge(loadPlugins(options.pluginsPath, options.plugins));
    }

    return new Message(message, options, callback);
  }
}

const loadPlugins = function(path) {
  const plugins = {};
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

  return plugins;
}

export default Message;
