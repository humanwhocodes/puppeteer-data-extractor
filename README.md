# Puppeteer Data Extractor

by [Nicholas C. Zakas](https://humanwhocodes.com)

If you find this useful, please consider supporting my work with a [donation](https://humanwhocodes.com/donate).

## Description

A utility to extract data from a web page using [Puppeteer](https://developers.google.com/web/tools/puppeteer/).

## Prerequisites

* Node.js 12.22+

## Usage

Install using [npm][npm] or [yarn][yarn]:

```
npm install @humanwhocodes/puppeteer-data-extractor --save

# or

yarn add @humanwhocodes/puppeteer-data-extractor
```

Import into your project:

```js
// CommonJS
const { DataExtractor } = require("@humanwhocodes/puppeteer-data-extractor");

// ESM
import { DataExtractor } from "@humanwhocodes/puppeteer-data-extractor";
```

## API

After importing, create a new instance of `DataExtractor`. The constructor expects one object argument that defines the data schema.

For example:

```js
const items = new DataExtractor({
    name: {
        type: "string",
        selector: "[itemprop='name']"
    },
    username: {
        type: "string",
        selector: "[itemprop='additionalName']"
    },
    stars: {
        type: "number",
        selector: "svg.octicon-star + span"
    }
});
```


Data is extracted in the following ways:

* For a regular HTML element, `innerText` is used.
* For a form element, `value` is used.


## Developer Setup

1. Fork the repository
2. Clone your fork
3. Run `npm install` to setup dependencies
4. Run `npm test` to run tests

## License

Apache 2.0

[npm]: https://npmjs.com/
[yarn]: https://yarnpkg.com/
