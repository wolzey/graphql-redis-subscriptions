"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var pubsub_async_iterator_1 = require("./pubsub-async-iterator");
var RedisPubSub = (function () {
    function RedisPubSub(options) {
        if (options === void 0) { options = {}; }
        var triggerTransform = options.triggerTransform, connection = options.connection, connectionListener = options.connectionListener, subscriber = options.subscriber, publisher = options.publisher, reviver = options.reviver;
        this.triggerTransform = triggerTransform || (function (trigger) { return trigger; });
        this.reviver = reviver;
        if (subscriber && publisher) {
            this.redisPublisher = publisher;
            this.redisSubscriber = subscriber;
        }
        else {
            try {
                var IORedis = require('ioredis');
                this.redisPublisher = new IORedis(connection);
                this.redisSubscriber = new IORedis(connection);
                if (connectionListener) {
                    this.redisPublisher.on('connect', connectionListener);
                    this.redisPublisher.on('error', connectionListener);
                    this.redisSubscriber.on('connect', connectionListener);
                    this.redisSubscriber.on('error', connectionListener);
                }
                else {
                    this.redisPublisher.on('error', console.error);
                    this.redisSubscriber.on('error', console.error);
                }
            }
            catch (error) {
                console.error("No publisher or subscriber instances were provided and the package 'ioredis' wasn't found. Couldn't create Redis clients.");
            }
        }
        this.redisSubscriber.on('message', this.onMessage.bind(this));
        this.subscriptionMap = {};
        this.subsRefsMap = {};
        this.currentSubscriptionId = 0;
    }
    RedisPubSub.prototype.publish = function (trigger, payload) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.redisPublisher.publish(trigger, JSON.stringify(payload))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        });
    };
    RedisPubSub.prototype.subscribe = function (trigger, onMessage, options) {
        var _this = this;
        var triggerName = this.triggerTransform(trigger, options);
        var id = this.currentSubscriptionId++;
        this.subscriptionMap[id] = [triggerName, onMessage];
        var refs = this.subsRefsMap[triggerName];
        if (refs && refs.length > 0) {
            var newRefs = refs.concat([id]);
            this.subsRefsMap[triggerName] = newRefs;
            return Promise.resolve(id);
        }
        else {
            return new Promise(function (resolve, reject) {
                _this.redisSubscriber.subscribe(triggerName, function (err) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        _this.subsRefsMap[triggerName] = (_this.subsRefsMap[triggerName] || []).concat([
                            id,
                        ]);
                        resolve(id);
                    }
                });
            });
        }
    };
    RedisPubSub.prototype.unsubscribe = function (subId) {
        var _a = (this.subscriptionMap[subId] || [])[0], triggerName = _a === void 0 ? null : _a;
        var refs = this.subsRefsMap[triggerName];
        if (!refs)
            throw new Error("There is no subscription of id \"" + subId + "\"");
        if (refs.length === 1) {
            this.redisSubscriber.unsubscribe(triggerName);
            delete this.subsRefsMap[triggerName];
        }
        else {
            var index = refs.indexOf(subId);
            var newRefs = index === -1
                ? refs
                : refs.slice(0, index).concat(refs.slice(index + 1));
            this.subsRefsMap[triggerName] = newRefs;
        }
        delete this.subscriptionMap[subId];
    };
    RedisPubSub.prototype.asyncIterator = function (triggers) {
        return new pubsub_async_iterator_1.PubSubAsyncIterator(this, triggers);
    };
    RedisPubSub.prototype.getSubscriber = function () {
        return this.redisSubscriber;
    };
    RedisPubSub.prototype.getPublisher = function () {
        return this.redisPublisher;
    };
    RedisPubSub.prototype.close = function () {
        this.redisPublisher.quit();
        this.redisSubscriber.quit();
    };
    RedisPubSub.prototype.onMessage = function (channel, message) {
        var subscribers = this.subsRefsMap[channel];
        if (!subscribers || !subscribers.length)
            return;
        var parsedMessage;
        try {
            parsedMessage = JSON.parse(message, this.reviver);
        }
        catch (e) {
            parsedMessage = message;
        }
        for (var _i = 0, subscribers_1 = subscribers; _i < subscribers_1.length; _i++) {
            var subId = subscribers_1[_i];
            var _a = this.subscriptionMap[subId], listener = _a[1];
            listener(parsedMessage);
        }
    };
    return RedisPubSub;
}());
exports.RedisPubSub = RedisPubSub;
//# sourceMappingURL=redis-pubsub.js.map