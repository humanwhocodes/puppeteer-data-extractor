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
const extractor = new DataExtractor({
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

// page is a Puppeteer page
const data = await extractor.extractFrom(page);
```

In the schema, the property names are the names you'd like to appear in your extract data while the property values instruct the data extractor on how to find and convert the data. In the previous example, you may end up with a data structure looking like this:

```json
{
    "name": "Nicholas Zakas",
    "username": "nzakas",
    "stars": 60
}
```

## Schema Types

There are several different schema types you can use.

### Primitive Types

There are three primitive schema types: `string`, `number`, and `boolean`. Each type has two possible properties:

1. `selector` (**required**) - the CSS selector to find the element.
1. `convert` - a function used to convert the value into some other form. This function is run after the text is extracted and from the element and converted (for `number` and `boolean`), and before that text is inserted into the final data structure.

The primitive schema types all act the same except for how they convert the extracted value:

* `number` will strip out any non-numeric characters and convert into a number. For instance, `$5,000` would have the `$` and `,` stripped and be converted into `5000`.
* `boolean` converts the values of `true`, `t`, `yes`, `y` and `1` into `true` (all of these are case insensitive); everything else is converted to `false`. 

If you want a more specific conversion, you should use `"string"` and specify a `convert` function. Here's an example:

```js
{
    name: {
        type: "string",
        selector: ".fullName",
        convert(value) {
            return value.split(" ");
        }
    }
}
```

### `"array"`

The `"array"` type lets you specify a collection of elements whose text should be extracted and the results put into an array. Here, the `selector` property is expected to return more than one element, and there is an additional `items` property that contains another schema that will be used for each item in the array. For example:

```js
{
    books: {
        type: "array",
        selector: "#sidebar > ul:nth-of-type(2) > li",
        items: {
            title: {
                type: "string",
                selector: "img"
            }
        }
    },
}
```

Here, an array is created based on the `alt` text of images in a list. Note that the `selector` for `title` is resolved relative to the parent selector, so `img` becomes `#sidebar > ul:nth-of-type(2) > li img`. The resulting data structure looks like this:

```json
{
    "books": [
        { "title": "Understanding ECMAScript 6" },
        { "title": "Professional Ajax" },
        { "title": "Professional JavaScript" },
    ]
}
```

The elements of the array are always an object, but if you'd like them to be a primitive value, you can always provide a `convert` function, such as:

```js
{
    books: {
        type: "array",
        selector: "#sidebar > ul:nth-of-type(2) > li",
        items: {
            title: {
                type: "string",
                selector: "img"
            }
        },
        convert(books) {
            return books.map(book => book.title);
        }
    },
}
```

### `"object"`

The `"object"` type lets you specify a collection of properties whose text should be extracted and the results put into an object. There is an additional `properties` property that contains another schema. For example:

```js
{
    book: {
        type: "object",
        selector: "#book",
        properties: {
            title: {
                type: "string",
                selector: ".title"
            },
            pubYear: {
                type: "number",
                selector: ".published-date"
            },
            author: {
                type: "string",
                selector: ".author"
            }
        }
    },
}
```

Here, an object is created with three properties. As with `"array"`, the selectors inside of the property schemas are relative to the parent selector. The resulting data structure looks like this:

```json
{
    "book": {
        "title": "Understanding ECMAScript 6",
        "pubYear": 2016,
        "author": "Nicholas C. Zakas"
    }
}
```

You can also use a `convert` function.

## Developer Setup

1. Fork the repository
2. Clone your fork
3. Run `npm install` to setup dependencies
4. Run `npm test` to run tests

## License

Apache 2.0

[npm]: https://npmjs.com/
[yarn]: https://yarnpkg.com/
