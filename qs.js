(function (name, deps, definition) {
    if (!definition) {
        definition = deps;
        deps = [];
    }
    if (!Array.isArray(deps)) {
        deps = [deps];
    }
    if (typeof define === "function" && typeof define.amd === "object") {
        define(deps, definition);
    } else if (typeof module !== "undefined") {
        module.exports = definition.apply(this, deps.map(function (dep) {
            return require(dep);
        }));
    } else {
        var that = this;
        this[name] = definition.apply(this, deps.map(function (dep) {
            return that[dep.split("/").pop()];
        }));
    }
})("QS", ["../utils/utils", "../parser/parser"], function (utils, parser) {


    /**
     * A QueryString stringifier/parser from/to QSO (QueryString Object).
     * 
     * A QSO is a subset of a JSON object. A QSO is composed of strings, objects and
     * arrays.
     * The strings may represent a string, a number, a boolean, a date or a regex
     * The arrays must only contain strings
     * The objects can contain strings, arrays or objects
     * The root of a QSO may be a string, an array or an object.
     * 
     * 
     * @exports parser
     */
    var QS = {};

    let stringify = function (target, prefix, _flag) {
        if (typeof target === "object") {
            if (Array.isArray(target)) {
                if (_flag) {
                    throw new Error("target must be a querystring-able StringObject");
                }
                return target.map(function (el) {
                    return stringify(el, prefix, true);
                }).join("&");
            } else {
                if (_flag) {
                    throw new Error("target must be a querystring-able StringObject");
                }
                var str = "";
                prefix = prefix ? (prefix + ".") : "";
                for (var prop in target) {
                    var sprop = stringify(target[prop], prefix + prop, _flag);
                    str += "&" + sprop;
                }
                return str.substr(1);
            }
        } else if (typeof target === "string") {
            target = encodeURIComponent(target);
            return prefix ? (encodeURIComponent(prefix) + "=" + target) : ("" + target);
        } else if (typeof target === "undefined") {
            return target;
        } else {
            throw new Error("target must be a querystring-able StringObject");
        }
    };


    /**
     * Stringifies a javascript entity to a querystring.
     *  
     * @param {*} target
     * @param {string} [prefix]
     * @param {boolean} [strict=false]
     * @returns {String} A query string
     * 
     * @throws {Error} target must be a QSO
     */
    QS.stringify = function (target, prefix, strict) {
        if (typeof prefix === "boolean") {
            strict = prefix;
            prefix = undefined;
        }
        target = parser.stringifyToSO(target, strict);
        return stringify(target, prefix);
    };






    /**
     * Parses a query string to a querystring-able StringObject (a StringObject 
     * without objects and arrays embedded into other arrays).
     * 
     * Note: When a querystring containing arrays is parsed, a simple string cill be 
     * parsed if the array contains a single element. For instance the query string
     * `arr=el-1` will be parsed as `{arr: "el-1"}` instead of `{arr: ["el-1"]}`.
     * 
     * @requires utils.rget(), utils.rset()
     * 
     * @param {string} qs
     * @returns {SO}
     * 
     * @throws {Error} invalid querystring
     */
    QS.parse = function (qs) {
        if (qs === undefined){
            return qs;
        }
        if (qs.startsWith("?")) {
            qs = qs.substr(1);
        }
        var parts = qs.split("&");
        if (parts.length === 1) {
            parts = qs.split("=");
            if (parts.length === 1) {
                return (qs === "" && {}) || decodeURIComponent(qs);
            } else if (parts.length > 2) {
                throw new Error("invalid querystring");
            } else {
                var prop = decodeURIComponent(parts.shift());
                var value = decodeURIComponent(parts.shift());
                var parsed = {};
                utils.rset(parsed, prop, value);
                return parsed;
            }
        } else {
            var arrflag = false;
            var noarrflag = false;
            parts = parts.map(function (part, index) {
                var parts = part.split("=");
                var prop = decodeURIComponent(parts.shift());
                var value = parts.shift();
                if (value) {
                    noarrflag = true;
                    if (parts.length > 0) {
                        throw new Error("invalid querystring");
                    }
                    return {
                        prop: prop,
                        value: decodeURIComponent(value)
                    };
                } else {
                    arrflag = true;
                    return prop;
                }
            });
            if (arrflag && noarrflag) {
                throw new Error("invalid querystring");
            }
            if (arrflag) {
                return parts;
            } else {
                return parts.sort().reduce(function (parsed, q) {
                    var value = utils.rget(parsed, q.prop);
                    if (typeof value !== "undefined") {
                        if (!Array.isArray(value)) {
                            value = [value, q.value];
                            utils.rset(parsed, q.prop, value);
                        } else {
                            value.push(q.value);
                        }
                    } else {
                        utils.rset(parsed, q.prop, q.value);
                    }
                    return parsed;
                }, {});
            }
        }
    };

    return QS;
});


