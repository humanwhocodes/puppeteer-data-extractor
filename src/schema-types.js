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
 * @typedef {Object} SchemaDefinition
 * @property {string} selector The CSS selector to locate the element.
 * @property {Function?} convert A conversion function that will initially
 *      receive the extracted data before placing it in the data structure
 *
 * @typedef {Object} ArraySchemaDefinition
 * @property {string} selector The CSS selector to locate the element.
 * @property {Function?} convert A conversion function that will initially
 *      receive the extracted data before placing it in the data structure
 * @property {Object<string,SchemaDefinition} items The schema for each item
 *      in the array.
 *
 * @typedef {Object} ObjectSchemaDefinition
 * @property {string} selector The CSS selector to locate the element.
 * @property {Function?} convert A conversion function that will initially
 *      receive the extracted data before placing it in the data structure
 * @property {Object<string,SchemaDefinition} properties The schema for each 
 *      property in the object.
 */

//-----------------------------------------------------------------------------
// Functions
//-----------------------------------------------------------------------------

export const schemaTypes = {

    /**
     * Creates an array from the given schema definition and root.
     * @param {Page|ElementHandle} root The page or element handle to query from.
     * @param {ArraySchemaDefinition} def The schema definition for the array.
     * @returns {Array} An array of data matching the definition.
     */
    async array(root, { selector, items, convert = identity }) {
        const itemHandles = await root.$$(selector);
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
     * Creates a Boolean value from the given schema definition and root.
     * @param {Page|ElementHandle} root The page or element handle to query from.
     * @param {SchemaDefinition} def The schema definition for the array.
     * @returns {boolean} A boolean value representing the data.
     */
    async boolean(root, { selector, convert = identity }) {
        const value = await this.string(root, { selector });
        return convert(stringToBoolean(value));
    },

    /**
     * Creates a number value from the given schema definition and root.
     * @param {Page|ElementHandle} root The page or element handle to query from.
     * @param {SchemaDefinition} def The schema definition for the array.
     * @returns {number} A number value representing the data.
     */
    async number(root, { selector, convert = identity }) {
        const value = await this.string(root, { selector });
        return convert(stringToNumber(value));
    },

    async object(root, { selector, properties, convert = identity }) {
        const handle = selector ? await root.$$(selector) : root;
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
     * @param {SchemaDefinition} def The schema definition for the array.
     * @returns {string} A string value representing the data.
     */
    async string(root, { selector, convert = identity } = {}) {

        let value;

        if (selector) {
            value = await root.$eval(selector, element => {
                return element.form ? element.value : element.innerText;
            });
        } else {
            value = await root.evaluate(element => {
                return element.form ? element.value : element.innerText;
            }, root);
        }

        return convert(value);
    },

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
