### eslint-plugin-remove-eventlistener
An EsLint plugin to require that every addEventListener in a JavaScript file has a corresponding removeEventListener. This will reduce memory leaks in your code.

### Install

Using npm:

```npm install --save-dev eslint-plugin-remove-eventlistener ```

### Usage

Create an eslintrc.js configuration file similar to the following:

```json
module.exports =
{
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    plugins: ['remove-eventlistener'],
    "env": {
        "es6": true,
        "browser": true,
        "node": true
    },
    rules: {
        "remove-eventlistener/require-removeEventlistener": 2,
    }
};

```

This plugin will notifiy the developer when any of the following is discovered:

1) An addEventListener without a corresponding removeEventListener
2) A removeEventListener without a corresponding AddEventListener
3) An addEventListener with an inline function. The use of inline functions means  even if an removeEventListener is present it wont work as intended as the each handlers are different references. 