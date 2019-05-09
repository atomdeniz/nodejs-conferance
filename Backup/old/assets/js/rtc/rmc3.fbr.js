// Last time updated: 2016-02-17 4:59:46 PM UTC
function FileBufferReader() {
    function fbrClone(from, to) {
        if (null == from || "object" != typeof from) return from;
        if (from.constructor != Object && from.constructor != Array) return from;
        if (from.constructor == Date || from.constructor == RegExp || from.constructor == Function || from.constructor == String || from.constructor == Number || from.constructor == Boolean) return new from.constructor(from);
        to = to || new from.constructor;
        for (var name in from) to[name] = "undefined" == typeof to[name] ? fbrClone(from[name], null) : to[name];
        return to
    }
    var fbr = this,
        fbrHelper = new FileBufferReaderHelper;
    fbr.chunks = {}, fbr.users = {}, fbr.readAsArrayBuffer = function(file, earlyCallback, extra) {
        if (!file.slice) return void console.warn("Not a real File object.", file);
        if (extra = extra || {
                userid: 0
            }, file.extra)
            if ("string" == typeof file.extra) extra.extra = file.extra;
            else
                for (var e in file.extra) extra[e] = file.extra[e];
        extra.fileName = file.name, file.uuid && (extra.fileUniqueId = file.uuid);
        var options = {
            uuid: file.uuid || 0,
            file: file,
            earlyCallback: earlyCallback,
            extra: extra,
            chunkSize: extra.chunkSize
        };
        fbrHelper.readAsArrayBuffer(fbr, options)
    }, fbr.getNextChunk = function(fileUUID, callback, userid) {
        var allFileChunks = fbr.chunks[fileUUID];
        if (allFileChunks) {
            var currentPosition;
            "undefined" != typeof userid ? (fbr.users[userid + ""] || (fbr.users[userid + ""] = {
                fileUUID: fileUUID,
                userid: userid,
                currentPosition: -1
            }), fbr.users[userid + ""].currentPosition++, currentPosition = fbr.users[userid + ""].currentPosition) : (fbr.chunks[fileUUID].currentPosition++, currentPosition = fbr.chunks[fileUUID].currentPosition);
            var nextChunk = allFileChunks[currentPosition];
            nextChunk && (nextChunk = fbrClone(nextChunk), "undefined" != typeof userid && (nextChunk.remoteUserId = userid + ""), nextChunk.start && fbr.onBegin(nextChunk), nextChunk.end && fbr.onEnd(nextChunk), fbr.onProgress(nextChunk), fbr.convertToArrayBuffer(nextChunk, function(buffer) {
                return nextChunk.currentPosition == nextChunk.maxChunks ? void callback(buffer, !0) : void callback(buffer, !1)
            }))
        }
    };
    var fbReceiver = new FileBufferReceiver(fbr);
    fbr.addChunk = function(chunk, callback) {
        return chunk ? void fbReceiver.receive(chunk, function(uuid) {
            fbr.convertToArrayBuffer({
                readyForNextChunk: !0,
                uuid: uuid
            }, callback)
        }) : void console.error("Chunk is missing.")
    }, fbr.onBegin = function() {}, fbr.onEnd = function() {}, fbr.onProgress = function() {}, fbr.convertToObject = FileConverter.ConvertToObject, fbr.convertToArrayBuffer = FileConverter.ConvertToArrayBuffer, fbr.setMultipleUsers = function() {}
}

function FileBufferReaderHelper() {
    function processInWebWorker(_function) {
        var blob = URL.createObjectURL(new Blob([_function.toString(), "this.onmessage =  function (e) {" + _function.name + "(e.data);}"], {
            type: "application/javascript"
        }));
        return window.fileBufferWorker || (window.fileBufferWorker = new Worker(blob)), window.fileBufferWorker
    }

    function fileReaderWrapper(options, callback) {
        function addChunks(fileName, binarySlice, addChunkCallback) {
            numOfChunksInSlice = Math.ceil(binarySlice.byteLength / chunkSize);
            for (var i = 0; numOfChunksInSlice > i; i++) {
                var start = i * chunkSize;
                chunks[currentPosition] = binarySlice.slice(start, Math.min(start + chunkSize, binarySlice.byteLength)), callback({
                    uuid: file.uuid,
                    buffer: chunks[currentPosition],
                    currentPosition: currentPosition,
                    maxChunks: maxChunks,
                    size: file.size,
                    name: file.name || options.extra.fileName,
                    lastModifiedDate: file.lastModifiedDate ? file.lastModifiedDate.toString() : "",
                    type: file.type,
                    extra: options.extra || options
                }), currentPosition++
            }
            currentPosition == maxChunks && (hasEntireFile = !0), addChunkCallback()
        }
        callback = callback || function(chunk) {
            postMessage(chunk)
        };
        var file = options.file;
        file.uuid || (file.uuid = options.fileUniqueId || (100 * Math.random()).toString().replace(/\./g, ""));
        var chunkSize = options.chunkSize || 15e3,
            sliceId = 0,
            cacheSize = chunkSize,
            chunksPerSlice = Math.floor(Math.min(1e8, cacheSize) / chunkSize),
            sliceSize = chunksPerSlice * chunkSize,
            maxChunks = Math.ceil(file.size / chunkSize);
        file.maxChunks = maxChunks;
        var numOfChunksInSlice, hasEntireFile, currentPosition = 0,
            chunks = [];
        callback({
            currentPosition: currentPosition,
            uuid: file.uuid,
            maxChunks: maxChunks,
            size: file.size,
            name: file.name || options.extra.fileName,
            type: file.type,
            lastModifiedDate: file.lastModifiedDate ? file.lastModifiedDate.toString() : "",
            start: !0,
            extra: options.extra || options,
            url: URL.createObjectURL(file)
        });
        var blob, reader = new FileReader;
        reader.onloadend = function(evt) {
            evt.target.readyState == FileReader.DONE && addChunks(file.name, evt.target.result, function() {
                sliceId++, (sliceId + 1) * sliceSize < file.size ? (blob = file.slice(sliceId * sliceSize, (sliceId + 1) * sliceSize), reader.readAsArrayBuffer(blob)) : sliceId * sliceSize < file.size ? (blob = file.slice(sliceId * sliceSize, file.size), reader.readAsArrayBuffer(blob)) : callback({
                    currentPosition: currentPosition,
                    uuid: file.uuid,
                    maxChunks: maxChunks,
                    size: file.size,
                    name: file.name || options.extra.fileName,
                    lastModifiedDate: file.lastModifiedDate ? file.lastModifiedDate.toString() : "",
                    url: URL.createObjectURL(file),
                    type: file.type,
                    end: !0,
                    extra: options.extra || options
                })
            })
        }, currentPosition += 1, blob = file.slice(sliceId * sliceSize, (sliceId + 1) * sliceSize), reader.readAsArrayBuffer(blob)
    }
    var fbrHelper = this;
    fbrHelper.readAsArrayBuffer = function(fbr, options) {
        function processChunk(chunk) {
            fbr.chunks[chunk.uuid] || (fbr.chunks[chunk.uuid] = {
                currentPosition: -1
            }), options.extra = options.extra || {
                userid: 0
            }, chunk.userid = options.userid || options.extra.userid || 0, chunk.extra = options.extra, fbr.chunks[chunk.uuid][chunk.currentPosition] = chunk, chunk.end && earlyCallback && (earlyCallback(chunk.uuid), earlyCallback = null), chunk.maxChunks > 5 && 5 == chunk.currentPosition && earlyCallback && (earlyCallback(chunk.uuid), earlyCallback = null)
        }
        var earlyCallback = options.earlyCallback;
        if (delete options.earlyCallback, navigator.mozGetUserMedia && (window.___Worker = window.Worker, delete window.Worker), window.Worker && "function" == typeof Worker) {
            var webWorker = processInWebWorker(fileReaderWrapper);
            webWorker.onmessage = function(event) {
                processChunk(event.data)
            }, webWorker.postMessage(options)
        } else fileReaderWrapper(options, processChunk), navigator.mozGetUserMedia && (window.Worker = window.___Worker)
    }
}

function FileBufferReceiver(fbr) {
    function receive(chunk, callback) {
        if (!chunk.uuid) return void fbr.convertToObject(chunk, function(object) {
            receive(object)
        });
        if (chunk.start && !packets[chunk.uuid] && (packets[chunk.uuid] = [], missedChunks[chunk.uuid] && (packets[chunk.uuid].push(chunk.buffer), missedChunks[chunk.uuid].forEach(function(chunk) {
                receive(chunk, callback)
            }), delete missedChunks[chunk.uuid]), fbr.onBegin && fbr.onBegin(chunk)), !chunk.end && chunk.buffer) {
            if (!packets[chunk.uuid]) return missedChunks[chunk.uuid] || (missedChunks[chunk.uuid] = []), void missedChunks[chunk.uuid].push(chunk); - 1 == packets[chunk.uuid].indexOf(chunk.buffer) && packets[chunk.uuid].push(chunk.buffer)
        }
        if (chunk.end) {
            for (var _packets = packets[chunk.uuid], finalArray = [], length = _packets.length, i = 0; length > i; i++) _packets[i] && finalArray.push(_packets[i]);
            var blob = new Blob(finalArray, {
                type: chunk.type
            });
            blob = merge(blob, chunk), blob.url = URL.createObjectURL(blob), blob.uuid = chunk.uuid || blob.extra.fileUniqueId, blob.name = blob.name || blob.extra.fileName, blob.size || console.error("Something went wrong. Blob Size is 0."), fbr.onEnd && fbr.onEnd(blob)
        }
        chunk.buffer && fbr.onProgress && fbr.onProgress(chunk), chunk.end || callback(chunk.uuid)
    }

    function merge(mergein, mergeto) {
        if (mergein || (mergein = {}), !mergeto) return mergein;
        for (var item in mergeto) mergein[item] = mergeto[item];
        return mergein
    }
    var packets = {},
        missedChunks = [];
    this.receive = receive
}

function merge(mergein, mergeto) {
    if (mergein || (mergein = {}), !mergeto) return mergein;
    for (var item in mergeto) mergein[item] = mergeto[item];
    return mergein
}
window.FileSelector = function() {
    function selectFile(callback, multiple) {
        var file = document.createElement("input");
        file.type = "file", multiple && (file.multiple = !0), file.onchange = function() {
            return multiple ? file.files.length ? void callback(file.files) : void console.error("No file selected.") : file.files[0] ? (callback(file.files[0]), void file.parentNode.removeChild(file)) : void console.error("No file selected.")
        }, file.style.display = "none", (document.body || document.documentElement).appendChild(file), fireClickEvent(file)
    }

    function fireClickEvent(element) {
        var evt = new window.MouseEvent("click", {
            view: window,
            bubbles: !0,
            cancelable: !0,
            button: 0,
            buttons: 0,
            mozInputSource: 1
        });
        element.dispatchEvent(evt)
    }
    var selector = this;
    selector.selectSingleFile = selectFile, selector.selectMultipleFiles = function(callback) {
        selectFile(callback, !0)
    }
};
var FileConverter = {
    ConvertToArrayBuffer: function(object, callback) {
        binarize.pack(object, function(dataView) {
            callback(dataView.buffer)
        })
    },
    ConvertToObject: function(buffer, callback) {
        binarize.unpack(buffer, callback)
    }
};
! function(root) {
    var debug = !1,
        BIG_ENDIAN = !1,
        LITTLE_ENDIAN = !0,
        TYPE_LENGTH = Uint8Array.BYTES_PER_ELEMENT,
        LENGTH_LENGTH = Uint16Array.BYTES_PER_ELEMENT,
        BYTES_LENGTH = Uint32Array.BYTES_PER_ELEMENT,
        Types = {
            NULL: 0,
            UNDEFINED: 1,
            STRING: 2,
            NUMBER: 3,
            BOOLEAN: 4,
            ARRAY: 5,
            OBJECT: 6,
            INT8ARRAY: 7,
            INT16ARRAY: 8,
            INT32ARRAY: 9,
            UINT8ARRAY: 10,
            UINT16ARRAY: 11,
            UINT32ARRAY: 12,
            FLOAT32ARRAY: 13,
            FLOAT64ARRAY: 14,
            ARRAYBUFFER: 15,
            BLOB: 16,
            FILE: 16,
            BUFFER: 17
        };
    if (debug) var TypeNames = ["NULL", "UNDEFINED", "STRING", "NUMBER", "BOOLEAN", "ARRAY", "OBJECT", "INT8ARRAY", "INT16ARRAY", "INT32ARRAY", "UINT8ARRAY", "UINT16ARRAY", "UINT32ARRAY", "FLOAT32ARRAY", "FLOAT64ARRAY", "ARRAYBUFFER", "BLOB", "BUFFER"];
    var Length = [null, null, "Uint16", "Float64", "Uint8", null, null, "Int8", "Int16", "Int32", "Uint8", "Uint16", "Uint32", "Float32", "Float64", "Uint8", "Uint8", "Uint8"],
        binary_dump = function(view, start, length) {
            var table = [],
                endianness = BIG_ENDIAN,
                ROW_LENGTH = 40;
            table[0] = [];
            for (var i = 0; ROW_LENGTH > i; i++) table[0][i] = 10 > i ? "0" + i.toString(10) : i.toString(10);
            for (i = 0; length > i; i++) {
                var code = view.getUint8(start + i, endianness),
                    index = ~~(i / ROW_LENGTH) + 1;
                "undefined" == typeof table[index] && (table[index] = []), table[index][i % ROW_LENGTH] = 16 > code ? "0" + code.toString(16) : code.toString(16)
            }
            for (console.log("%c" + table[0].join(" "), "font-weight: bold;"), i = 1; i < table.length; i++) console.log(table[i].join(" "))
        },
        find_type = function(obj) {
            var type = void 0;
            if (void 0 === obj) type = Types.UNDEFINED;
            else if (null === obj) type = Types.NULL;
            else {
                var const_name = obj.constructor.name;
                if (void 0 !== const_name) type = Types[const_name.toUpperCase()];
                else switch (typeof obj) {
                    case "string":
                        type = Types.STRING;
                        break;
                    case "number":
                        type = Types.NUMBER;
                        break;
                    case "boolean":
                        type = Types.BOOLEAN;
                        break;
                    case "object":
                        obj instanceof Array ? type = Types.ARRAY : obj instanceof Int8Array ? type = Types.INT8ARRAY : obj instanceof Int16Array ? type = Types.INT16ARRAY : obj instanceof Int32Array ? type = Types.INT32ARRAY : obj instanceof Uint8Array ? type = Types.UINT8ARRAY : obj instanceof Uint16Array ? type = Types.UINT16ARRAY : obj instanceof Uint32Array ? type = Types.UINT32ARRAY : obj instanceof Float32Array ? type = Types.FLOAT32ARRAY : obj instanceof Float64Array ? type = Types.FLOAT64ARRAY : obj instanceof ArrayBuffer ? type = Types.ARRAYBUFFER : obj instanceof Blob ? type = Types.BLOB : obj instanceof Buffer ? type = Types.BUFFER : obj instanceof Object && (type = Types.OBJECT)
                }
            }
            return type
        },
        pack = function(serialized) {
            var cursor = 0,
                i = 0,
                j = 0,
                endianness = BIG_ENDIAN,
                ab = new ArrayBuffer(serialized[0].byte_length + serialized[0].header_size),
                view = new DataView(ab);
            for (i = 0; i < serialized.length; i++) {
                var start = cursor,
                    header_size = serialized[i].header_size,
                    type = serialized[i].type,
                    length = serialized[i].length,
                    value = serialized[i].value,
                    byte_length = serialized[i].byte_length,
                    type_name = Length[type],
                    unit = null === type_name ? 0 : root[type_name + "Array"].BYTES_PER_ELEMENT;
                switch (type === Types.BUFFER ? view.setUint8(cursor, Types.BLOB, endianness) : view.setUint8(cursor, type, endianness), cursor += TYPE_LENGTH, debug && console.info("Packing", type, TypeNames[type]), (type === Types.ARRAY || type === Types.OBJECT) && (view.setUint16(cursor, length, endianness), cursor += LENGTH_LENGTH, debug && console.info("Content Length", length)), view.setUint32(cursor, byte_length, endianness), cursor += BYTES_LENGTH, debug && (console.info("Header Size", header_size, "bytes"), console.info("Byte Length", byte_length, "bytes")), type) {
                    case Types.NULL:
                    case Types.UNDEFINED:
                        break;
                    case Types.STRING:
                        for (debug && console.info('Actual Content %c"' + value + '"', "font-weight:bold;"), j = 0; length > j; j++, cursor += unit) view.setUint16(cursor, value.charCodeAt(j), endianness);
                        break;
                    case Types.NUMBER:
                    case Types.BOOLEAN:
                        debug && console.info("%c" + value.toString(), "font-weight:bold;"), view["set" + type_name](cursor, value, endianness), cursor += unit;
                        break;
                    case Types.INT8ARRAY:
                    case Types.INT16ARRAY:
                    case Types.INT32ARRAY:
                    case Types.UINT8ARRAY:
                    case Types.UINT16ARRAY:
                    case Types.UINT32ARRAY:
                    case Types.FLOAT32ARRAY:
                    case Types.FLOAT64ARRAY:
                        var _view = new Uint8Array(view.buffer, cursor, byte_length);
                        _view.set(new Uint8Array(value.buffer)), cursor += byte_length;
                        break;
                    case Types.ARRAYBUFFER:
                    case Types.BUFFER:
                        var _view = new Uint8Array(view.buffer, cursor, byte_length);
                        _view.set(new Uint8Array(value)), cursor += byte_length;
                        break;
                    case Types.BLOB:
                    case Types.ARRAY:
                    case Types.OBJECT:
                        break;
                    default:
                        throw "TypeError: Unexpected type found."
                }
                debug && binary_dump(view, start, cursor - start)
            }
            return view
        },
        unpack = function(view, cursor) {
            var type, length, byte_length, value, elem, i = 0,
                endianness = BIG_ENDIAN,
                start = cursor;
            type = view.getUint8(cursor, endianness), cursor += TYPE_LENGTH, debug && console.info("Unpacking", type, TypeNames[type]), (type === Types.ARRAY || type === Types.OBJECT) && (length = view.getUint16(cursor, endianness), cursor += LENGTH_LENGTH, debug && console.info("Content Length", length)), byte_length = view.getUint32(cursor, endianness), cursor += BYTES_LENGTH, debug && console.info("Byte Length", byte_length, "bytes");
            var type_name = Length[type],
                unit = null === type_name ? 0 : root[type_name + "Array"].BYTES_PER_ELEMENT;
            switch (type) {
                case Types.NULL:
                case Types.UNDEFINED:
                    debug && binary_dump(view, start, cursor - start), value = null;
                    break;
                case Types.STRING:
                    length = byte_length / unit;
                    var string = [];
                    for (i = 0; length > i; i++) {
                        var code = view.getUint16(cursor, endianness);
                        cursor += unit, string.push(String.fromCharCode(code))
                    }
                    value = string.join(""), debug && (console.info('Actual Content %c"' + value + '"', "font-weight:bold;"), binary_dump(view, start, cursor - start));
                    break;
                case Types.NUMBER:
                    value = view.getFloat64(cursor, endianness), cursor += unit, debug && (console.info('Actual Content %c"' + value.toString() + '"', "font-weight:bold;"), binary_dump(view, start, cursor - start));
                    break;
                case Types.BOOLEAN:
                    value = 1 === view.getUint8(cursor, endianness) ? !0 : !1, cursor += unit, debug && (console.info('Actual Content %c"' + value.toString() + '"', "font-weight:bold;"), binary_dump(view, start, cursor - start));
                    break;
                case Types.INT8ARRAY:
                case Types.INT16ARRAY:
                case Types.INT32ARRAY:
                case Types.UINT8ARRAY:
                case Types.UINT16ARRAY:
                case Types.UINT32ARRAY:
                case Types.FLOAT32ARRAY:
                case Types.FLOAT64ARRAY:
                case Types.ARRAYBUFFER:
                    elem = view.buffer.slice(cursor, cursor + byte_length), cursor += byte_length, value = type === Types.ARRAYBUFFER ? elem : new root[type_name + "Array"](elem), debug && binary_dump(view, start, cursor - start);
                    break;
                case Types.BLOB:
                    if (debug && binary_dump(view, start, cursor - start), root.Blob) {
                        var mime = unpack(view, cursor),
                            buffer = unpack(view, mime.cursor);
                        cursor = buffer.cursor, value = new Blob([buffer.value], {
                            type: mime.value
                        })
                    } else elem = view.buffer.slice(cursor, cursor + byte_length), cursor += byte_length, value = new Buffer(elem);
                    break;
                case Types.ARRAY:
                    for (debug && binary_dump(view, start, cursor - start), value = [], i = 0; length > i; i++) elem = unpack(view, cursor), cursor = elem.cursor, value.push(elem.value);
                    break;
                case Types.OBJECT:
                    for (debug && binary_dump(view, start, cursor - start), value = {}, i = 0; length > i; i++) {
                        var key = unpack(view, cursor),
                            val = unpack(view, key.cursor);
                        cursor = val.cursor, value[key.value] = val.value
                    }
                    break;
                default:
                    throw "TypeError: Type not supported."
            }
            return {
                value: value,
                cursor: cursor
            }
        },
        deferredSerialize = function(array, callback) {
            for (var length = array.length, results = [], count = 0, byte_length = 0, i = 0; i < array.length; i++) ! function(index) {
                serialize(array[index], function(result) {
                    if (results[index] = result, byte_length += result[0].header_size + result[0].byte_length, ++count === length) {
                        for (var array = [], j = 0; j < results.length; j++) array = array.concat(results[j]);
                        callback(array, byte_length)
                    }
                })
            }(i)
        },
        serialize = function(obj, callback) {
            var type, subarray = [],
                unit = 1,
                header_size = TYPE_LENGTH + BYTES_LENGTH,
                byte_length = 0,
                length = 0,
                value = obj;
            switch (type = find_type(obj), unit = void 0 === Length[type] || null === Length[type] ? 0 : root[Length[type] + "Array"].BYTES_PER_ELEMENT, type) {
                case Types.UNDEFINED:
                case Types.NULL:
                    break;
                case Types.NUMBER:
                case Types.BOOLEAN:
                    byte_length = unit;
                    break;
                case Types.STRING:
                    length = obj.length, byte_length += length * unit;
                    break;
                case Types.INT8ARRAY:
                case Types.INT16ARRAY:
                case Types.INT32ARRAY:
                case Types.UINT8ARRAY:
                case Types.UINT16ARRAY:
                case Types.UINT32ARRAY:
                case Types.FLOAT32ARRAY:
                case Types.FLOAT64ARRAY:
                    length = obj.length, byte_length += length * unit;
                    break;
                case Types.ARRAY:
                    return void deferredSerialize(obj, function(subarray, byte_length) {
                        callback([{
                            type: type,
                            length: obj.length,
                            header_size: header_size + LENGTH_LENGTH,
                            byte_length: byte_length,
                            value: null
                        }].concat(subarray))
                    });
                case Types.OBJECT:
                    var deferred = [];
                    for (var key in obj) obj.hasOwnProperty(key) && (deferred.push(key), deferred.push(obj[key]), length++);
                    return void deferredSerialize(deferred, function(subarray, byte_length) {
                        callback([{
                            type: type,
                            length: length,
                            header_size: header_size + LENGTH_LENGTH,
                            byte_length: byte_length,
                            value: null
                        }].concat(subarray))
                    });
                case Types.ARRAYBUFFER:
                    byte_length += obj.byteLength;
                    break;
                case Types.BLOB:
                    var mime_type = obj.type,
                        reader = new FileReader;
                    return reader.onload = function(e) {
                        deferredSerialize([mime_type, e.target.result], function(subarray, byte_length) {
                            callback([{
                                type: type,
                                length: length,
                                header_size: header_size,
                                byte_length: byte_length,
                                value: null
                            }].concat(subarray))
                        })
                    }, reader.onerror = function(e) {
                        throw "FileReader Error: " + e
                    }, void reader.readAsArrayBuffer(obj);
                case Types.BUFFER:
                    byte_length += obj.length;
                    break;
                default:
                    throw 'TypeError: Type "' + obj.constructor.name + '" not supported.'
            }
            callback([{
                type: type,
                length: length,
                header_size: header_size,
                byte_length: byte_length,
                value: value
            }].concat(subarray))
        },
        deserialize = function(buffer, callback) {
            var view = buffer instanceof DataView ? buffer : new DataView(buffer),
                result = unpack(view, 0);
            return result.value
        };
    debug && (root.Test = {
        BIG_ENDIAN: BIG_ENDIAN,
        LITTLE_ENDIAN: LITTLE_ENDIAN,
        Types: Types,
        pack: pack,
        unpack: unpack,
        serialize: serialize,
        deserialize: deserialize
    });
    var binarize = {
        pack: function(obj, callback) {
            try {
                debug && console.info("%cPacking Start", "font-weight: bold; color: red;", obj), serialize(obj, function(array) {
                    debug && console.info("Serialized Object", array), callback(pack(array))
                })
            } catch (e) {
                throw e
            }
        },
        unpack: function(buffer, callback) {
            try {
                debug && console.info("%cUnpacking Start", "font-weight: bold; color: red;", buffer);
                var result = deserialize(buffer);
                debug && console.info("Deserialized Object", result), callback(result)
            } catch (e) {
                throw e
            }
        }
    };
    "undefined" != typeof module && module.exports ? module.exports = binarize : root.binarize = binarize
}("undefined" != typeof global ? global : this);