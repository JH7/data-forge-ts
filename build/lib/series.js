"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
var empty_iterable_1 = require("./iterables/empty-iterable");
var count_iterable_1 = require("./iterables/count-iterable");
var multi_iterable_1 = require("./iterables/multi-iterable");
var select_iterable_1 = require("./iterables/select-iterable");
var select_many_iterable_1 = require("./iterables/select-many-iterable");
var take_iterable_1 = require("./iterables/take-iterable");
var take_while_iterable_1 = require("./iterables/take-while-iterable");
var where_iterable_1 = require("./iterables/where-iterable");
var window_iterable_1 = require("./iterables/window-iterable");
var rolling_window_iterable_1 = require("./iterables/rolling-window-iterable");
var ordered_iterable_1 = require("./iterables/ordered-iterable");
var Sugar = require("sugar");
var index_1 = require("./index");
var extract_element_iterable_1 = require("./iterables/extract-element-iterable");
var skip_iterable_1 = require("./iterables/skip-iterable");
var skip_while_iterable_1 = require("./iterables/skip-while-iterable");
var Table = require('easy-table');
var chai_1 = require("chai");
var dataframe_1 = require("./dataframe");
var moment = require("moment");
;
/**
 * Class that represents a series of indexed values.
 */
var Series = /** @class */ (function () {
    /**
     * Create a series.
     *
     * @param config This can be either an array or a config object the sets the values that the series contains.
     * If it is an array it specifies the values that the series contains.
     * If it is a config object that can contain:
     *      values: Optional array or iterable of values that the series contains.
     *      index: Optional array or iterable of values that index the series, defaults to a series of integers from 1 and counting upward.
     *      pairs: Optional iterable of pairs (index and value) that the series contains.
     */
    function Series(config) {
        //
        // Records if a series is baked into memory.
        //
        this.isBaked = false;
        if (config) {
            if (Sugar.Object.isArray(config)) {
                this.initFromArray(config);
            }
            else {
                this.initFromConfig(config);
            }
        }
        else {
            this.initEmpty();
        }
    }
    //
    // Initialise this Series from an array.
    //
    Series.prototype.initFromArray = function (arr) {
        this.index = new count_iterable_1.CountIterable();
        this.values = arr;
        this.pairs = new multi_iterable_1.MultiIterable([this.index, this.values]);
    };
    //
    // Initialise an empty DataFrame.
    //
    Series.prototype.initEmpty = function () {
        this.index = new empty_iterable_1.EmptyIterable();
        this.values = new empty_iterable_1.EmptyIterable();
        this.pairs = new empty_iterable_1.EmptyIterable();
    };
    Series.prototype.initIterable = function (input, fieldName) {
        if (Sugar.Object.isArray(input)) {
            return input;
        }
        else if (Sugar.Object.isFunction(input[Symbol.iterator])) {
            // Assume it's an iterable.
            return input;
        }
        else {
            throw new Error("Expected '" + fieldName + "' field of Series config object to be an array of values or an iterable of values.");
        }
    };
    ;
    //
    // Initialise the Series from a config object.
    //
    Series.prototype.initFromConfig = function (config) {
        if (config.index) {
            this.index = this.initIterable(config.index, 'index');
        }
        else if (config.pairs) {
            this.index = new extract_element_iterable_1.ExtractElementIterable(config.pairs, 0);
        }
        else {
            this.index = new count_iterable_1.CountIterable();
        }
        if (config.values) {
            this.values = this.initIterable(config.values, 'values');
        }
        else if (config.pairs) {
            this.values = new extract_element_iterable_1.ExtractElementIterable(config.pairs, 1);
        }
        else {
            this.values = new empty_iterable_1.EmptyIterable();
        }
        if (config.pairs) {
            this.pairs = config.pairs;
        }
        else {
            this.pairs = new multi_iterable_1.MultiIterable([this.index, this.values]);
        }
        if (config.baked !== undefined) {
            this.isBaked = config.baked;
        }
    };
    /**
     * Get an iterator to enumerate the values of the series.
     * Enumerating the iterator forces lazy evaluation to complete.
     */
    Series.prototype[Symbol.iterator] = function () {
        return this.values[Symbol.iterator]();
    };
    /**
     * Get the index for the series.
     */
    Series.prototype.getIndex = function () {
        return new index_1.Index({ values: this.index });
    };
    /**
     * Apply a new index to the Series.
     *
     * @param newIndex The new index to apply to the Series.
     *
     * @returns Returns a new series with the specified index attached.
     */
    Series.prototype.withIndex = function (newIndex) {
        if (!Sugar.Object.isArray(newIndex)) {
            chai_1.assert.isObject(newIndex, "'Expected 'newIndex' parameter to 'Series.withIndex' to be an array, Series or Index.");
        }
        return new Series({
            values: this.values,
            index: newIndex,
        });
    };
    ;
    /**
     * Resets the index of the series back to the default zero-based sequential integer index.
     *
     * @returns Returns a new series with the index reset to the default zero-based index.
     */
    Series.prototype.resetIndex = function () {
        return new Series({
            values: this.values // Just strip the index.
        });
    };
    /**
    * Extract values from the series as an array.
    * This forces lazy evaluation to complete.
    *
    * @returns Returns an array of values contained within the series.
    */
    Series.prototype.toArray = function () {
        var values = [];
        try {
            for (var _a = __values(this.values), _b = _a.next(); !_b.done; _b = _a.next()) {
                var value = _b.value;
                if (value !== undefined) {
                    values.push(value);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return values;
        var e_1, _c;
    };
    /**
     * Retreive the index and values from the Series as an array of pairs.
     * Each pair is [index, value].
     * This forces lazy evaluation to complete.
     *
     * @returns Returns an array of pairs that contains the series content. Each pair is a two element array that contains an index and a value.
     */
    Series.prototype.toPairs = function () {
        var pairs = [];
        try {
            for (var _a = __values(this.pairs), _b = _a.next(); !_b.done; _b = _a.next()) {
                var pair = _b.value;
                if (pair[1] != undefined) {
                    pairs.push(pair);
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return pairs;
        var e_2, _c;
    };
    //TODO: These functions are deprecated.
    /**
     * Convert a series or a dataframe to a series of pairs in the form [pair1, pair2, pair3, ...] where each pair is [index, value].
     *
     * @returns {Pairs} Returns a series of pairs for each index and value pair in the input sequence.
     */
    Series.prototype.asPairs = function () {
        return new Series({ values: this.pairs });
    };
    /**
     * Convert a series of pairs to back to a regular series.
     *
     * @returns Returns a series of values where each pair has been extracted from the value of the input series.
     */
    Series.prototype.asValues = function () {
        //TODO: This function didn't port well to TypeScript. It's deprecated though.
        return new Series({
            index: new select_iterable_1.SelectIterable(this.values, function (pair, index) { return pair[0]; }),
            values: new select_iterable_1.SelectIterable(this.values, function (pair, index) { return pair[1]; }),
            pairs: this.values,
        });
    };
    ;
    /**
     * Generate a new series based by calling the selector function on each value.
     *
     * @param selector Selector function that transforms each value to create a new series.
     *
     * @returns Returns a new series that has been transformed by the selector function.
     */
    Series.prototype.select = function (selector) {
        chai_1.assert.isFunction(selector, "Expected 'selector' parameter to 'Series.select' function to be a function.");
        return new Series({
            values: new select_iterable_1.SelectIterable(this.values, selector),
            index: this.index,
        });
    };
    /**
     * Generate a new series based on the results of the selector function.
     *
     * @param selector Selector function that transforms each value into a list of values.
     *
     * @returns  Returns a new series with values that have been produced by the selector function.
     */
    Series.prototype.selectMany = function (selector) {
        chai_1.assert.isFunction(selector, "Expected 'selector' parameter to 'Series.selectMany' to be a function.");
        var pairsIterable = new select_many_iterable_1.SelectManyIterable(this.pairs, function (pair, index) {
            var outputPairs = [];
            try {
                for (var _a = __values(selector(pair[1], index)), _b = _a.next(); !_b.done; _b = _a.next()) {
                    var transformed = _b.value;
                    outputPairs.push([
                        pair[0],
                        transformed
                    ]);
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                }
                finally { if (e_3) throw e_3.error; }
            }
            return outputPairs;
            var e_3, _c;
        });
        return new Series({
            pairs: pairsIterable,
        });
    };
    /**
     * Segment a Series into 'windows'. Returns a new Series. Each value in the new Series contains a 'window' (or segment) of the original series.
     * Use select or selectPairs to aggregate.
     *
     * @param period - The number of values in the window.
     *
     * @returns Returns a new series, each value of which is a 'window' (or segment) of the original series.
     */
    Series.prototype.window = function (period) {
        chai_1.assert.isNumber(period, "Expected 'period' parameter to 'Series.window' to be a number.");
        return new Series({
            values: new window_iterable_1.WindowIterable(this.pairs, period)
        });
    };
    /**
     * Segment a Series into 'rolling windows'. Returns a new Series. Each value in the new Series contains a 'window' (or segment) of the original series.
    *
     * @param period - The number of values in the window.
     *
     * @returns Returns a new series, each value of which is a 'window' (or segment) of the original series.
     */
    Series.prototype.rollingWindow = function (period) {
        chai_1.assert.isNumber(period, "Expected 'period' parameter to 'Series.rollingWindow' to be a number.");
        return new Series({
            values: new rolling_window_iterable_1.RollingWindowIterable(this.pairs, period)
        });
    };
    /**
     * Compute the percent change between each pair of values.
     * Percentages are expressed as 0-1 values.
     *
     * @returns Returns a new series where each value indicates the percent change from the previous number value in the original series.
     */
    Series.prototype.percentChange = function () {
        return this // Have to assume this is a number series.
            .rollingWindow(2)
            .asPairs()
            .select(function (pair) {
            var window = pair[1];
            var values = window.toArray();
            var amountChange = values[1] - values[0]; // Compute amount of change.
            var pctChange = amountChange / values[0]; // Compute % change.
            return [window.getIndex().last(), pctChange]; // Return new index and value.
        })
            .asValues() // Result is always a series.
        ;
    };
    /**
     * Skip a number of values in the series.
     *
     * @param numValues - Number of values to skip.     *
     * @returns Returns a new series or dataframe with the specified number of values skipped.
     */
    Series.prototype.skip = function (numValues) {
        return new Series({
            values: new skip_iterable_1.SkipIterable(this.values, numValues),
            index: new skip_iterable_1.SkipIterable(this.index, numValues),
            pairs: new skip_iterable_1.SkipIterable(this.pairs, numValues),
        });
    };
    /**
     * Skips values in the series while a condition is met.
     *
     * @param predicate - Return true to indicate the condition met.
     *
     * @returns Returns a new series with all initial sequential values removed that match the predicate.
     */
    Series.prototype.skipWhile = function (predicate) {
        chai_1.assert.isFunction(predicate, "Expected 'predicate' parameter to 'skipWhile' function to be a predicate function that returns true/false.");
        return new Series({
            values: new skip_while_iterable_1.SkipWhileIterable(this.values, predicate),
            pairs: new skip_while_iterable_1.SkipWhileIterable(this.pairs, function (pair) { return predicate(pair[1]); }),
        });
    };
    /**
     * Skips values in the series until a condition is met.
     *
     * @param predicate - Return true to indicate the condition met.
     *
     * @returns Returns a new series with all initial sequential values removed that don't match the predicate.
     */
    Series.prototype.skipUntil = function (predicate) {
        chai_1.assert.isFunction(predicate, "Expected 'predicate' parameter to 'skipUntil' function to be a predicate function that returns true/false.");
        return this.skipWhile(function (value) { return !predicate(value); });
    };
    /**
     * Take a number of rows in the series.
     *
     * @param numRows - Number of rows to take.
     *
     * @returns Returns a new series with up to the specified number of values included.
     */
    Series.prototype.take = function (numRows) {
        chai_1.assert.isNumber(numRows, "Expected 'numRows' parameter to 'take' function to be a number.");
        return new Series({
            index: new take_iterable_1.TakeIterable(this.index, numRows),
            values: new take_iterable_1.TakeIterable(this.values, numRows),
            pairs: new take_iterable_1.TakeIterable(this.pairs, numRows)
        });
    };
    ;
    /**
     * Take values from the series while a condition is met.
     *
     * @param predicate - Return true to indicate the condition met.
     *
     * @returns Returns a new series that only includes the initial sequential values that have matched the predicate.
     */
    Series.prototype.takeWhile = function (predicate) {
        chai_1.assert.isFunction(predicate, "Expected 'predicate' parameter to 'takeWhile' function to be a predicate function that returns true/false.");
        return new Series({
            values: new take_while_iterable_1.TakeWhileIterable(this.values, predicate),
            pairs: new take_while_iterable_1.TakeWhileIterable(this.pairs, function (pair) { return predicate(pair[1]); })
        });
    };
    /**
     * Take values from the series until a condition is met.
     *
     * @param predicate - Return true to indicate the condition met.
     *
     * @returns Returns a new series or dataframe that only includes the initial sequential values that have not matched the predicate.
     */
    Series.prototype.takeUntil = function (predicate) {
        chai_1.assert.isFunction(predicate, "Expected 'predicate' parameter to 'takeUntil' function to be a predicate function that returns true/false.");
        return this.takeWhile(function (value) { return !predicate(value); });
    };
    /**
     * Count the number of values in the series.
     *
     * @returns Returns the count of all values in the series.
     */
    Series.prototype.count = function () {
        var total = 0;
        try {
            for (var _a = __values(this.values), _b = _a.next(); !_b.done; _b = _a.next()) {
                var value = _b.value;
                ++total;
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
            }
            finally { if (e_4) throw e_4.error; }
        }
        return total;
        var e_4, _c;
    };
    /**
     * Get the first value of the series.
     *
     * @returns Returns the first value of the series.
     */
    Series.prototype.first = function () {
        try {
            for (var _a = __values(this), _b = _a.next(); !_b.done; _b = _a.next()) {
                var value = _b.value;
                return value; // Only need the first value.
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
            }
            finally { if (e_5) throw e_5.error; }
        }
        throw new Error("No values in Series.");
        var e_5, _c;
    };
    /**
     * Get the last value of the series.
     *
     * @returns Returns the last value of the series.
     */
    Series.prototype.last = function () {
        var lastValue = null;
        try {
            for (var _a = __values(this), _b = _a.next(); !_b.done; _b = _a.next()) {
                var value = _b.value;
                lastValue = value; // Throw away all values until we get to the last one.
            }
        }
        catch (e_6_1) { e_6 = { error: e_6_1 }; }
        finally {
            try {
                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
            }
            finally { if (e_6) throw e_6.error; }
        }
        if (lastValue === null) {
            throw new Error("No values in Series.");
        }
        return lastValue;
        var e_6, _c;
    };
    /**
     * Get X values from the start of the series.
     *
     * @param numValues - Number of values to take.
     *
     * @returns Returns a new series that has only the specified number of values taken from the start of the input sequence.
     */
    Series.prototype.head = function (numValues) {
        chai_1.assert.isNumber(numValues, "Expected 'values' parameter to 'head' function to be a number.");
        return this.take(numValues);
    };
    /**
     * Get X values from the end of the series.
     *
     * @param numValues - Number of values to take.
     *
     * @returns Returns a new series that has only the specified number of values taken from the end of the input sequence.
     */
    Series.prototype.tail = function (numValues) {
        chai_1.assert.isNumber(numValues, "Expected 'values' parameter to 'tail' function to be a number.");
        return this.skip(this.count() - numValues);
    };
    /**
     * Filter a series by a predicate selector.
     *
     * @param predicate - Predicte function to filter rows of the series.
     *
     * @returns Returns a new series containing only the values that match the predicate.
     */
    Series.prototype.where = function (predicate) {
        chai_1.assert.isFunction(predicate, "Expected 'predicate' parameter to 'where' function to be a function.");
        return new Series({
            values: new where_iterable_1.WhereIterable(this.values, predicate),
            pairs: new where_iterable_1.WhereIterable(this.pairs, function (pair) { return predicate(pair[1]); })
        });
    };
    /**
     * Invoke a callback function for each value in the series.
     *
     * @param callback - The calback to invoke for each value.
     *
     * @returns Returns the input series with no modifications.
     */
    Series.prototype.forEach = function (callback) {
        chai_1.assert.isFunction(callback, "Expected 'callback' parameter to 'Series.forEach' to be a function.");
        var index = 0;
        try {
            for (var _a = __values(this), _b = _a.next(); !_b.done; _b = _a.next()) {
                var value = _b.value;
                callback(value, index++);
            }
        }
        catch (e_7_1) { e_7 = { error: e_7_1 }; }
        finally {
            try {
                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
            }
            finally { if (e_7) throw e_7.error; }
        }
        return this;
        var e_7, _c;
    };
    ;
    /**
     * Determine if the predicate returns truthy for all values in the series.
     * Returns false as soon as the predicate evaluates to falsy.
     * Returns true if the predicate returns truthy for all values in the series.
     * Returns false if the series is empty.
     *
     * @param predicate - Predicate function that receives each value in turn and returns truthy for a match, otherwise falsy.
     *
     * @returns {boolean} Returns true if the predicate has returned truthy for every value in the sequence, otherwise returns false.
     */
    Series.prototype.all = function (predicate) {
        chai_1.assert.isFunction(predicate, "Expected 'predicate' parameter to 'Series.all' to be a function.");
        var count = 0;
        try {
            for (var _a = __values(this), _b = _a.next(); !_b.done; _b = _a.next()) {
                var value = _b.value;
                if (!predicate(value)) {
                    return false;
                }
                ++count;
            }
        }
        catch (e_8_1) { e_8 = { error: e_8_1 }; }
        finally {
            try {
                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
            }
            finally { if (e_8) throw e_8.error; }
        }
        return count > 0;
        var e_8, _c;
    };
    /**
     * Determine if the predicate returns truthy for any of the values in the series.
     * Returns true as soon as the predicate returns truthy.
     * Returns false if the predicate never returns truthy.
     * If no predicate is specified the value itself is checked.
     *
     * @param [predicate] - Optional predicate function that receives each value in turn and returns truthy for a match, otherwise falsy.
     *
     * @returns Returns true if the predicate has returned truthy for any value in the sequence, otherwise returns false.
     */
    Series.prototype.any = function (predicate) {
        if (predicate) {
            chai_1.assert.isFunction(predicate, "Expected 'predicate' parameter to 'Series.any' to be a function.");
        }
        if (predicate) {
            try {
                // Use the predicate to check each value.
                for (var _a = __values(this), _b = _a.next(); !_b.done; _b = _a.next()) {
                    var value = _b.value;
                    if (predicate(value)) {
                        return true;
                    }
                }
            }
            catch (e_9_1) { e_9 = { error: e_9_1 }; }
            finally {
                try {
                    if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                }
                finally { if (e_9) throw e_9.error; }
            }
        }
        else {
            try {
                // Check each value directly.
                for (var _d = __values(this), _e = _d.next(); !_e.done; _e = _d.next()) {
                    var value = _e.value;
                    if (value) {
                        return true;
                    }
                }
            }
            catch (e_10_1) { e_10 = { error: e_10_1 }; }
            finally {
                try {
                    if (_e && !_e.done && (_f = _d.return)) _f.call(_d);
                }
                finally { if (e_10) throw e_10.error; }
            }
        }
        return false; // Nothing passed.
        var e_9, _c, e_10, _f;
    };
    /**
     * Determine if the predicate returns truthy for none of the values in the series.
     * Returns true for an empty series.
     * Returns true if the predicate always returns falsy.
     * Otherwise returns false.
     * If no predicate is specified the value itself is checked.
     *
     * @param [predicate] - Optional predicate function that receives each value in turn and returns truthy for a match, otherwise falsy.
     *
     * @returns Returns true if the predicate has returned truthy for no values in the series, otherwise returns false.
     */
    Series.prototype.none = function (predicate) {
        if (predicate) {
            chai_1.assert.isFunction(predicate, "Expected 'predicate' parameter to 'Series.none' to be a function.");
        }
        if (predicate) {
            try {
                // Use the predicate to check each value.
                for (var _a = __values(this), _b = _a.next(); !_b.done; _b = _a.next()) {
                    var value = _b.value;
                    if (predicate(value)) {
                        return false;
                    }
                }
            }
            catch (e_11_1) { e_11 = { error: e_11_1 }; }
            finally {
                try {
                    if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                }
                finally { if (e_11) throw e_11.error; }
            }
        }
        else {
            try {
                // Check each value directly.
                for (var _d = __values(this), _e = _d.next(); !_e.done; _e = _d.next()) {
                    var value = _e.value;
                    if (value) {
                        return false;
                    }
                }
            }
            catch (e_12_1) { e_12 = { error: e_12_1 }; }
            finally {
                try {
                    if (_e && !_e.done && (_f = _d.return)) _f.call(_d);
                }
                finally { if (e_12) throw e_12.error; }
            }
        }
        return true; // Nothing failed the predicate.
        var e_11, _c, e_12, _f;
    };
    /**
     * Get a new series containing all values starting at and after the specified index value.
     *
     * @param indexValue - The index value to search for before starting the new series.
     *
     * @returns Returns a new series containing all values starting at and after the specified index value.
     */
    Series.prototype.startAt = function (indexValue) {
        var lessThan = this.getIndex().getLessThan();
        return new Series({
            index: new skip_while_iterable_1.SkipWhileIterable(this.index, function (index) { return lessThan(index, indexValue); }),
            pairs: new skip_while_iterable_1.SkipWhileIterable(this.pairs, function (pair) { return lessThan(pair[0], indexValue); }),
        });
    };
    /**
     * Get a new series containing all values up until and including the specified index value (inclusive).
     *
     * @param indexValue - The index value to search for before ending the new series.
     *
     * @returns Returns a new series containing all values up until and including the specified index value.
     */
    Series.prototype.endAt = function (indexValue) {
        var lessThanOrEqualTo = this.getIndex().getLessThanOrEqualTo();
        return new Series({
            index: new take_while_iterable_1.TakeWhileIterable(this.index, function (index) { return lessThanOrEqualTo(index, indexValue); }),
            pairs: new take_while_iterable_1.TakeWhileIterable(this.pairs, function (pair) { return lessThanOrEqualTo(pair[0], indexValue); }),
        });
    };
    /**
     * Get a new series containing all values up to the specified index value (exclusive).
     *
     * @param indexValue - The index value to search for before ending the new series.
     *
     * @returns Returns a new series containing all values up to the specified inde value.
     */
    Series.prototype.before = function (indexValue) {
        var lessThan = this.getIndex().getLessThan();
        return new Series({
            index: new take_while_iterable_1.TakeWhileIterable(this.index, function (index) { return lessThan(index, indexValue); }),
            pairs: new take_while_iterable_1.TakeWhileIterable(this.pairs, function (pair) { return lessThan(pair[0], indexValue); }),
        });
    };
    /**
     * Get a new series containing all values after the specified index value (exclusive).
     *
     * @param indexValue - The index value to search for.
     *
     * @returns Returns a new series containing all values after the specified index value.
     */
    Series.prototype.after = function (indexValue) {
        var lessThanOrEqualTo = this.getIndex().getLessThanOrEqualTo();
        return new Series({
            index: new skip_while_iterable_1.SkipWhileIterable(this.index, function (index) { return lessThanOrEqualTo(index, indexValue); }),
            pairs: new skip_while_iterable_1.SkipWhileIterable(this.pairs, function (pair) { return lessThanOrEqualTo(pair[0], indexValue); }),
        });
    };
    /**
     * Get a new series containing all values between the specified index values (inclusive).
     *
     * @param startIndexValue - The index where the new sequence starts.
     * @param endIndexValue - The index where the new sequence ends.
     *
     * @returns Returns a new series containing all values between the specified index values (inclusive).
     */
    Series.prototype.between = function (startIndexValue, endIndexValue) {
        return this.startAt(startIndexValue).endAt(endIndexValue);
    };
    /**
     * Format the series for display as a string.
     * This forces lazy evaluation to complete.
     *
     * @returns Generates and returns a string representation of the series or dataframe.
     */
    Series.prototype.toString = function () {
        var header = ["__index__", "__value__"];
        var rows = this.toPairs();
        var table = new Table();
        rows.forEach(function (row, rowIndex) {
            row.forEach(function (cell, cellIndex) {
                table.cell(header[cellIndex], cell);
            });
            table.newRow();
        });
        return table.toString();
    };
    ;
    //
    // Helper function to parse a string to an int.
    //
    Series.parseInt = function (value, valueIndex) {
        if (value === undefined) {
            return undefined;
        }
        else {
            chai_1.assert.isString(value, "Called Series.parseInts, expected all values in the series to be strings, instead found a '" + typeof (value) + "' at index " + valueIndex);
            if (value.length === 0) {
                return undefined;
            }
            return parseInt(value);
        }
    };
    /**
     * Parse a series with string values to a series with int values.
     *
     * @returns Returns a new series where string values from the original series have been parsed to integer values.
     */
    Series.prototype.parseInts = function () {
        return this.select(Series.parseInt);
    };
    ;
    //
    // Helper function to parse a string to a float.
    //
    Series.parseFloat = function (value, valueIndex) {
        if (value === undefined) {
            return undefined;
        }
        else {
            chai_1.assert.isString(value, "Called Series.parseFloats, expected all values in the series to be strings, instead found a '" + typeof (value) + "' at index " + valueIndex);
            if (value.length === 0) {
                return undefined;
            }
            return parseFloat(value);
        }
    };
    /**
     * Parse a series with string values to a series with float values.
     *
     * @returns Returns a new series where string values from the original series have been parsed to floating-point values.
     */
    Series.prototype.parseFloats = function () {
        return this.select(Series.parseFloat);
    };
    ;
    //
    // Helper function to parse a string to a date.
    //
    Series.parseDate = function (value, valueIndex, formatString) {
        if (value === undefined) {
            return undefined;
        }
        else {
            chai_1.assert.isString(value, "Called Series.parseDates, expected all values in the series to be strings, instead found a '" + typeof (value) + "' at index " + valueIndex);
            if (value.length === 0) {
                return undefined;
            }
            return moment(value, formatString).toDate();
        }
    };
    /**
     * Parse a series with string values to a series with date values.
     *
     * @param [formatString] Optional formatting string for dates.
     *
     * @returns Returns a new series where string values from the original series have been parsed to Date values.
     */
    Series.prototype.parseDates = function (formatString) {
        if (formatString) {
            chai_1.assert.isString(formatString, "Expected optional 'formatString' parameter to Series.parseDates to be a string (if specified).");
        }
        return this.select(function (value, valueIndex) { return Series.parseDate(value, valueIndex, formatString); });
    };
    ;
    //
    // Helper function to convert a value to a string.
    //
    Series.toString = function (value, formatString) {
        if (value === undefined) {
            return undefined;
        }
        else if (value === null) {
            return null;
        }
        else if (formatString && Sugar.Object.isDate(value)) {
            return moment(value).format(formatString);
        }
        else if (formatString && moment.isMoment(value)) {
            return value.format(formatString);
        }
        else {
            return value.toString();
        }
    };
    /**
     * Convert a series of values of different types to a series of string values.
     *
     * @param [formatString] Optional formatting string for dates.
     *
     * @returns Returns a new series where the values from the original series have been stringified.
     */
    Series.prototype.toStrings = function (formatString) {
        if (formatString) {
            chai_1.assert.isString(formatString, "Expected optional 'formatString' parameter to Series.toStrings to be a string (if specified).");
        }
        return this.select(function (value) { return Series.toString(value, formatString); });
    };
    ;
    /**
     * Forces lazy evaluation to complete and 'bakes' the series into memory.
     *
     * @returns Returns a series that has been 'baked', all lazy evaluation has completed.
     */
    Series.prototype.bake = function () {
        if (this.isBaked) {
            // Already baked.
            return this;
        }
        return new Series({
            pairs: this.toPairs(),
            baked: true,
        });
    };
    ;
    /**
     * Inflate the series to a dataframe.
     *
     * @param [selector] Optional selector function that transforms each value in the series to a row in the new dataframe.
     *
     * @returns Returns a new dataframe that has been created from the input series via the 'selector' function.
     */
    Series.prototype.inflate = function (selector) {
        if (selector) {
            chai_1.assert.isFunction(selector, "Expected 'selector' parameter to Series.inflate to be a selector function.");
            return new dataframe_1.DataFrame({
                values: new select_iterable_1.SelectIterable(this.values, selector),
                index: this.index,
                pairs: new select_iterable_1.SelectIterable(this.pairs, function (pair, index) { return [pair[0], selector(pair[1], index)]; }),
            });
        }
        else {
            return new dataframe_1.DataFrame({
                values: this.values,
                index: this.index,
                pairs: this.pairs
            });
        }
    };
    /**
     * Sorts the series by a value defined by the selector (ascending).
     *
     * @param selector Selects the value to sort by.
     *
     * @returns Returns a new ordered series that has been sorted by the value returned by the selector.
     */
    Series.prototype.orderBy = function (selector) {
        return new OrderedSeries(this.values, this.pairs, selector, ordered_iterable_1.Direction.Ascending, null);
    };
    /**
     * Sorts the series by a value defined by the selector (descending).
     *
     * @param selector Selects the value to sort by.
     *
     * @returns Returns a new ordered series that has been sorted by the value returned by the selector.
     */
    Series.prototype.orderByDescending = function (selector) {
        return new OrderedSeries(this.values, this.pairs, selector, ordered_iterable_1.Direction.Descending, null);
    };
    return Series;
}());
exports.Series = Series;
//
// A series that has been ordered.
//
var OrderedSeries = /** @class */ (function (_super) {
    __extends(OrderedSeries, _super);
    function OrderedSeries(values, pairs, selector, direction, parent) {
        var _this = this;
        var valueSortSpecs = [];
        var pairSortSpecs = [];
        var sortLevel = 0;
        while (parent !== null) {
            valueSortSpecs.push(OrderedSeries.makeSortSpec(sortLevel, parent.selector, parent.direction));
            pairSortSpecs.push(OrderedSeries.makeSortSpec(sortLevel, OrderedSeries.makePairsSelector(parent.selector), parent.direction));
            ++sortLevel;
            parent = parent.parent;
        }
        valueSortSpecs.push(OrderedSeries.makeSortSpec(sortLevel, selector, direction));
        pairSortSpecs.push(OrderedSeries.makeSortSpec(sortLevel, function (pair, index) { return selector(pair[1], index); }, direction));
        _this = _super.call(this, {
            values: new ordered_iterable_1.OrderedIterable(values, valueSortSpecs),
            pairs: new ordered_iterable_1.OrderedIterable(pairs, pairSortSpecs)
        }) || this;
        _this.parent = parent;
        _this.selector = selector;
        _this.direction = direction;
        _this.origValues = values;
        _this.origPairs = pairs;
        return _this;
    }
    //
    // Helper function to create a sort spec.
    //
    OrderedSeries.makeSortSpec = function (sortLevel, selector, direction) {
        return { sortLevel: sortLevel, selector: selector, direction: direction };
    };
    //
    // Helper function to make a sort selector for pairs, this captures the parent correct when generating the closure.
    //
    OrderedSeries.makePairsSelector = function (selector) {
        return function (pair, index) { return selector(pair[1], index); };
    };
    /**
     * Performs additional sorting (ascending).
     *
     * @param selector Selects the value to sort by.
     *
     * @returns Returns a new series has been additionally sorted by the value returned by the selector.
     */
    OrderedSeries.prototype.thenBy = function (selector) {
        return new OrderedSeries(this.origValues, this.origPairs, selector, ordered_iterable_1.Direction.Ascending, this);
    };
    /**
     * Performs additional sorting (descending).
     *
     * @param selector Selects the value to sort by.
     *
     * @returns Returns a new series has been additionally sorted by the value returned by the selector.
     */
    OrderedSeries.prototype.thenByDescending = function (selector) {
        return new OrderedSeries(this.origValues, this.origPairs, selector, ordered_iterable_1.Direction.Descending, this);
    };
    return OrderedSeries;
}(Series));
//# sourceMappingURL=series.js.map