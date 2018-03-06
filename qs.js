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
})("QS", ["../utils/utils"], function (utils) {
    
    
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


    /**
     * Stringifies a QSO.
     * 
     * This routine doesn't check the validity of the QSO target, passing an invalid 
     * target will return an unexpected result.
     * 
     * @param {QSO} target
     * @param {string} [prefix]
     * @param {boolean} _flag
     * @returns {String} A query string
     * 
     * @throws {Error} target must be a QSO
     */
    QS.stringify = function (target, prefix, _flag) {
        if (typeof target === "object") {
            if (Array.isArray(target)) {
                if (_flag) {
                    throw new Error("target must be a QSO");
                }
                return target.map(function (el) {
                    return QS.stringify(el, prefix, true);
                }).join("&");
            } else {
                if (_flag) {
                    throw new Error("target must be a QSO");
                }
                var str = "";
                prefix = prefix ? (prefix + ".") : "";
                for (var prop in target) {
                    var sprop = QS.stringify(target[prop], prefix + prop, _flag);
                    str += "&" + sprop;
                }
                return str.substr(1);
            }
        } else if (typeof target === "string") {
            target = encodeURIComponent(target);
            return prefix ? (encodeURIComponent(prefix) + "=" + target) : ("" + target);
        } else {
            throw new Error("target must be a QSO");
        }
    };


    /**
     * Parses a query string to a QSO.
     * 
     * @requires utils.rget(), utils.rset()
     * 
     * @param {string} qs
     * @returns {QSO}
     * 
     * @throws {Error} invalid querystring
     */
    QS.parse = function (qs) {
        if (qs.startsWith("?")){
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


