/**
 * @fileoverview Functions for converting data
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import { schemaTypes } from "./schema-types.js";

//-----------------------------------------------------------------------------
// Types
//-----------------------------------------------------------------------------

/**
 * @typedef {import("puppeteer").Page} Page
 */

//-----------------------------------------------------------------------------
// Exports
//-----------------------------------------------------------------------------

/**
 * A class to extract data from a Puppeteer page.
 */
export class DataExtractor {

    /**
     * Creates a new instance.
     * @param {*} schema The schema describing the data to extract.
     */
    constructor(schema) {

        if (typeof schema === "undefined") {
            throw new TypeError("DataExtractor requires a schema.");
        }


        this.schema = schema;
    }

    /**
     * Extracts data based on the `schema` from the given page.
     * @param {Page} page A Puppeteer page. 
     * @returns {Object} An object containing the extracted data.
     */
    async extractFrom(page) {
        const result = {};

        for (const [key, def] of Object.entries(this.schema)) {
            if (def.type in schemaTypes) {
                result[key] = await schemaTypes[def.type](page, def);
            }
        }

        return result;
    }
}
