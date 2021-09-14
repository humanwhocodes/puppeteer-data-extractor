/**
 * @fileoverview Schema types
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import { ArrayWithDefault } from "@humanwhocodes/array-with-default";
import { stringToBoolean, stringToNumber, identity } from "./converters.js";

//-----------------------------------------------------------------------------
// Types
//-----------------------------------------------------------------------------

/**
 * @typedef {import("puppeteer").Page} Page
 * @typedef {import("puppeteer").ElementHandle} ElementHandle
 *
 * @typedef {Object<string,JSONValue>|Array<JSONValue>|string|number|boolean|null} JSONValue
 * 
 * @typedef {Object} SchemaDef
 * @property {string} selector The CSS selector to locate the element.
 * @property {boolean} [optional=false] Indicates if the selector may not exist.
 * @property {Function?} convert A conversion function that will initially
 *      receive the extracted data before placing it in the data structure
 *
 * @typedef {Object} ArraySchemaDef
 * @property {string} selector The CSS selector to locate the element.
 * @property {boolean} [optional=false] Indicates if the selector may not exist.
 * @property {Function?} convert A conversion function that will initially
 *      receive the extracted data before placing it in the data structure
 * @property {Object<string,SchemaDef>} items The schema for each item
 *      in the array.
 *
 * @typedef {Object} CustomSchemaDef
 * @property {string} selector The CSS selector to locate the element.
 * @property {HTMLElement => JSONValue} extract A function that receives an HTML element as
 *      an argument and must return a serializable value. This function runs
 *      in the context of a Puppeteer page.
 * @property {Function?} convert A conversion function that will initially
 *      receive the extracted data before placing it in the data structure
 *
 * @typedef {Object} ObjectSchemaDef
 * @property {string} selector The CSS selector to locate the element.
 * @property {boolean} [optional=false] Indicates if the selector may not exist.
 * @property {Function?} convert A conversion function that will initially
 *      receive the extracted data before placing it in the data structure
 * @property {Object<string,SchemaDef>} properties The schema for each 
 *      property in the object.
 *
 * @typedef {Object} TableSchemaDef
 * @property {string} selector The CSS selector to locate the element.
 * @property {boolean} [optional=false] Indicates if the selector may not exist.
 * @property {Function?} convert A conversion function that will initially
 *      receive the extracted data before placing it in the data structure
 * @property {Array<SchemaDef>} head An array of schema definitions for the
 *      cells in the `<thead>` element.
 * @property {Array<SchemaDef>} body An array of schema definitions for the
 *      cells in the `<tbody>` element.
 * @property {Array<SchemaDef>} foot An array of schema definitions for the
 *      cells in the `<tfoot>` element.
 *
 * @typedef {Object} TableObject
 * @property {Array<JSONValue>} head An array of values extracted from the
 *      cells in the `<thead>` element.
 * @property {Array<JSONValue>} body An array of values extracted from the
 *      cells in the `<tbody>` element.
 * @property {Array<JSONValue>} foot An array of values extracted from the
 *      cells in the `<tfoot>` element.
 */

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

/**
 * Extracts the most useful text from an element given its tag name.
 * Note: This function is used in the context of a Puppeteer page.
 * @param {HTMLElement} element The element to extract text from. 
 * @returns {string} The text from the element.
 */
function extractText(element) {

    if (!element) {
        return undefined;
    }

    switch (element.tagName) {
        case "IMG":
            return element.alt;

        case "META":
            return element.content;

        case "SELECT":
        case "TEXTAREA":
        case "INPUT":
            return element.value;

        default:
            return element.innerText;
    }
}

/**
 * Throws an error saying the selector wasn't found.
 * @param {string} selector The selector that couldn't be found. 
 * @returns {void}
 * @throws {Error} Always.
 */
function throwNotFound(selector) {
    throw new Error(`Element matching "${selector}" could not be found.`);
}

//-----------------------------------------------------------------------------
// Functions
//-----------------------------------------------------------------------------

export const schemaTypes = {

    /**
     * Creates an array from the given schema definition and root.
     * @param {Page|ElementHandle} root The page or element handle to query from.
     * @param {ArraySchemaDef} def The schema definition for the array.
     * @returns {Array} An array of data matching the definition.
     */
    async array(root, { selector, optional, items, convert = identity }) {
        const itemHandles = await root.$$(selector);

        if (itemHandles.length === 0) {
            if (optional) {
                return undefined;
            }

            throwNotFound(selector);
        }

        const itemEntries = Object.entries(items);
        const result = [];

        for (const itemHandle of itemHandles) {
            const item = {};

            for (const [key, desc] of itemEntries) {
                item[key] = await this[desc.type](itemHandle, desc);
            }

            result.push(item);
        }

        return convert(result);
    },

    /**
     * Creates a value from a custom element handler.
     * @param {Page|ElementHandle} root The page or element handle to query from.
     * @param {ArraySchemaDef} def The schema definition for the custom value.
     * @returns {*} The value returned from Puppeteer.
     */
    async custom(root, { selector, optional, extract, convert = identity }) {

        if (typeof extract !== "function") {
            throw new TypeError("Custom schema type must have extract() method.");
        }

        let handle = root;

        if (selector) {
            handle = await root.$(selector);

            if (!handle) {
                if (optional) {
                    return undefined;
                }

                throwNotFound(selector);
            }
        }

        let value = await handle.evaluate(extract, handle);
        return convert(value);
    },

    /**
     * Creates a Boolean value from the given schema definition and root.
     * @param {Page|ElementHandle} root The page or element handle to query from.
     * @param {SchemaDef} def The schema definition for the array.
     * @returns {boolean} A boolean value representing the data.
     */
    async boolean(root, { selector, optional, convert = identity }) {
        const value = await this.string(root, { selector, optional });
        return convert(stringToBoolean(value));
    },

    /**
     * Creates a number value from the given schema definition and root.
     * @param {Page|ElementHandle} root The page or element handle to query from.
     * @param {SchemaDef} def The schema definition for the array.
     * @returns {number} A number value representing the data.
     */
    async number(root, { selector, optional, convert = identity }) {
        const value = await this.string(root, { selector, optional });
        return convert(stringToNumber(value));
    },

    /**
     * Creates an object from the given schema definition and root.
     * @param {Page|ElementHandle} root The page or element handle to query from.
     * @param {ObjectSchemaDef} def The schema definition for the array.
     * @returns {Object<string,*>} An object of data matching the definition.
     */
    async object(root, { selector, optional, properties, convert = identity }) {
        const handle = selector ? await root.$(selector) : root;

        if (!handle) {
            if (optional) {
                return undefined;
            }

            throwNotFound(selector);
        }

        const propertyEntries = Object.entries(properties);

        const result = {};

        for (const [key, desc] of propertyEntries) {
            result[key] = await this[desc.type](handle, desc);
        }

        return convert(result);
    },

    /**
     * Creates a string value from the given schema definition and root.
     * @param {Page|ElementHandle} root The page or element handle to query from.
     * @param {SchemaDef} def The schema definition for the array.
     * @returns {string} A string value representing the data.
     */
    async string(root, { selector, optional, convert = identity } = {}) {

        return this.custom(root, {
            selector,
            optional,
            extract: extractText,
            convert
        });
    },

    /**
     * Creates an object containing information from an HTML table.
     * @param {Page|ElementHandle} root The page or element handle to query from.
     * @param {TableSchemaDef} def The schema definition for the table.
     * @returns {TableObject} An object containing the data from the table.
     */
    async table(root, { selector, head = [], body = [], foot = [], convert = identity }) {

        const tableHeadRowsHandles = await root.$$(`${selector} > thead > tr`);
        const tableBodyRowsHandles = await root.$$(`${selector} > tbody > tr`);
        const tableFootRowsHandles = await root.$$(`${selector} > tfoot > tr`);
        const result = {
            head: [],
            body: [],
            foot: []
        };

        head = new ArrayWithDefault({
            elements: head,
            default: { type: "string" },
            outOfRange: true
        });

        body = new ArrayWithDefault({
            elements: body,
            default: { type: "string" },
            outOfRange: true
        });

        foot = new ArrayWithDefault({
            elements: foot,
            default: { type: "string" },
            outOfRange: true
        });

        for (const tableRowHandle of tableHeadRowsHandles) {
            const row = [];
            const cellHandles = await tableRowHandle.$$("td,th");
            let i = 0;

            for (const cellHandle of cellHandles) {
                const desc = head[i];
                row.push(await this[desc.type](cellHandle, desc));
                i++;
            }

            result.head.push(row);
        }

        for (const tableRowHandle of tableBodyRowsHandles) {
            const row = [];
            const cellHandles = await tableRowHandle.$$("td,th");
            let i = 0;

            for (const cellHandle of cellHandles) {
                const desc = body[i];
                row.push(await this[desc.type](cellHandle, desc));
                i++;
            }

            result.body.push(row);
        }

        for (const tableRowHandle of tableFootRowsHandles) {
            const row = [];
            const cellHandles = await tableRowHandle.$$("td,th");
            let i = 0;

            for (const cellHandle of cellHandles) {
                const desc = foot[i];
                row.push(await this[desc.type](cellHandle, desc));
                i++;
            }

            result.foot.push(row);
        }

        return convert(result);
    }

};
