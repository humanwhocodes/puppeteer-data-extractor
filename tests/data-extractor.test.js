/**
 * @fileoverview Tests for Data Extractor
 * @author Nicholas C. Zakas
 */

/* global describe, it, beforeEach, afterEach */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import { DataExtractor } from "../src/data-extractor.js";
import { expect } from "chai";
import { fileURLToPath, pathToFileURL } from "url";
import fs from "fs/promises";
import path from "path";
import puppeteer from "puppeteer";

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

/**
 * Creates a file URL from a path.
 * @param {string} filePath The file path to translate. 
 * @returns {string} A file URL.
 */
function getFileUrlRelativeToTest(filePath) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    return pathToFileURL(path.join(__dirname, filePath)).toString();
}

/**
 * Creates a Puppeteer browser with correct settings.
 * @returns {import("puppeteer").Browser} The browser instance.
 */
function createBrowser() {
    return puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--no-gpu", "--disable-dev-shm-usage"],
        ignoreHTTPSErrors: true
    });
}

/**
 * Ensure that only the URL in question is loaded. This prevents
 * long-loading ancillary requests (images, scripts, etc.) from
 * causing the tests to hang.
 * @param {import("puppeteer").Page} page The Puppeteer page object to work on.
 * @param {string} url The URL to allow through. 
 */
function blockAllBut(page, url) {
    page.setRequestInterception(true);
    page.on("request", request => {
        if (request.url() === url) {
            request.continue();
            return;
        }

        request.abort();
    });
}

/**
 * Normalizes an object by passing it through JSON methods.
 * @param {Object} data The data to normalize. 
 * @returns {Object} The normalized data.
 */
function normalizeToJson(data) {
    return JSON.parse(JSON.stringify(data));
}

//-----------------------------------------------------------------------------
// Schemas
//-----------------------------------------------------------------------------

const salaryPost = {
    title: {
        type: "string",
        selector: "[itemprop=headline]"
    },
    author: {
        type: "string",
        selector: "[itemprop=author]"
    },
    date: {
        type: "string",
        selector: "[itemprop=datePublished]"
    },
    missing: {
        type: "string",
        selector: "[foo=bar]",
        optional: true
    },
    salaries: {
        type: "table",
        selector: "table",
        head: [
            { type: "string" },
            { type: "string" },
            { type: "string" },
            { type: "string" },
            { type: "string" },
            { type: "string" },
            { type: "string" },
            { type: "string" },
            { type: "string" }
        ],
        body: [
            { type: "number" },
            { type: "number" },
            { type: "string" },
            { type: "string" },
            { type: "string" },
            { type: "string" },
            { type: "string" },
            { type: "string" },
            { type: "string" }
        ]
    },
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
    archive: {
        type: "custom",
        selector: "#sidebar > ul:nth-of-type(4)",
        extract(element) {
            const result = [];

            for (const child of element.children) {
                result.push(Number(child.innerText))
            }

            return result;
        }
    },
    openGraph: {
        type: "object",
        properties: {
            image: {
                type: "string",
                selector: "meta[name='og:image']"
            },
            url: {
                type: "string",
                selector: "meta[name='og:url']"
            },
            title: {
                type: "string",
                selector: "meta[name='og:title']"
            },
            description: {
                type: "string",
                selector: "meta[name='og:description']"
            },
            type: {
                type: "string",
                selector: "meta[name='og:type']"
            }
        }
    }
};

//-----------------------------------------------------------------------------
// Tests
//-----------------------------------------------------------------------------

describe("DataExtractor", () => {

    let browser, page;

    before(async () => {
        browser = await createBrowser();
    });

    after(async () => {
        await browser.close();
    });

    beforeEach(async () => {
        page = await browser.newPage();
    });

    afterEach(async () => {
        await page.close();
    });

    describe("extractFrom()", () => {
        it("should return data", async () => {
            const url = getFileUrlRelativeToTest("fixtures/blog-somewhat-complete-salary-history.html");
            const expected = JSON.parse(await fs.readFile("tests/fixtures/blog-somewhat-complete-salary-history.json", "utf8"));
            const extractor = new DataExtractor(salaryPost);
            blockAllBut(page, url);
            
            await page.goto(url);
            await page.waitForSelector("body");
            const result = normalizeToJson(await extractor.extractFrom(page));
            expect(result).to.deep.equal(expected);
        });
    });
});
