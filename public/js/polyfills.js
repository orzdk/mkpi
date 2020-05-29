Object.filter = function( obj, predicate) {
    let result = {}, key;

    for (key in obj) {
        if (obj.hasOwnProperty(key) && !predicate(obj[key])) {
            result[key] = obj[key];
        }
    }

    return result;
};

if (!Object.prototype.forEach) {
    Object.defineProperty(Object.prototype, 'forEach', {
        value: function (callback, thisArg) {
            if (this == null) {
                throw new TypeError('Not an object');
            }
            thisArg = thisArg;
            for (var key in this) {
                if (this.hasOwnProperty(key)) {
                    callback.call(thisArg, this[key], key, this);
                }
            }
        }
    });
}