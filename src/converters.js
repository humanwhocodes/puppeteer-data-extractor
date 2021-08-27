/**
 * @fileoverview Functions for converting data
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

const booleanTruePatterns = /^(?:yes|true|1|y|t)$/iu;

//-----------------------------------------------------------------------------
// Functions
//-----------------------------------------------------------------------------

export function identity(value) {
    return value;
}

export function stringToNumber(value) {
    return Number(value.replace(/[^\d\.\-]/g, ""));
}

export function stringToBoolean(value) {
    return booleanTruePatterns.test(value);
}
