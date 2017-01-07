## Message Object for SuperScript

This module creates message objects for [SuperScript](https://github.com/superscriptjs/superscript) to consume.

You can add your own plugins to extend the message object to add extra properties to the message. For example, you might want to write a plugin that calls an external NLP service like [wit.ai](https://wit.ai), or a plugin that does sentiment analysis on the message. Then, later reply plugin functions can use this extra information to do things like filter replies or add text programmatically to a reply.

### API

* `createMessage(message, options, callback)`

`message` is the original text to create a message with. `options` can have a `factSystem` and a `scope`.

* `loadPlugins(path)`

`path` is a directory path of files of plugins to load.

### Example plugin

An example plugin might look something like this:

```js
const addWords = function addWords(cb) {
  this.message.words = this.message.clean.split(' ');
  cb();
};
```

This simply add a `words` property to the message, so you could, say, filter out messages that weren't long or short enough in SuperScript.
