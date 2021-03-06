"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
var simple_mock_1 = require("simple-mock");
var iterall_1 = require("iterall");
var redis_pubsub_1 = require("../redis-pubsub");
var IORedis = require("ioredis");
chai.use(chaiAsPromised);
var expect = chai.expect;
var listener;
var publishSpy = simple_mock_1.spy(function (channel, message) { return listener && listener(channel, message); });
var subscribeSpy = simple_mock_1.spy(function (channel, cb) { return cb && cb(null, channel); });
var unsubscribeSpy = simple_mock_1.spy(function (channel, cb) { return cb && cb(channel); });
var quitSpy = simple_mock_1.spy(function (cb) { return cb; });
var mockRedisClient = {
    publish: publishSpy,
    subscribe: subscribeSpy,
    unsubscribe: unsubscribeSpy,
    on: function (event, cb) {
        if (event === 'message') {
            listener = cb;
        }
    },
    quit: quitSpy,
};
var mockOptions = {
    publisher: mockRedisClient,
    subscriber: mockRedisClient,
};
describe('RedisPubSub', function () {
    it('should create default ioredis clients if none were provided', function (done) {
        var pubSub = new redis_pubsub_1.RedisPubSub();
        expect(pubSub.getSubscriber()).to.be.an.instanceOf(IORedis);
        expect(pubSub.getPublisher()).to.be.an.instanceOf(IORedis);
        pubSub.close();
        done();
    });
    it('should verify close calls pub and sub quit methods', function (done) {
        var pubSub = new redis_pubsub_1.RedisPubSub(mockOptions);
        pubSub.close();
        expect(quitSpy.callCount).to.equal(2);
        done();
    });
    it('can subscribe to specific redis channel and called when a message is published on it', function (done) {
        var pubSub = new redis_pubsub_1.RedisPubSub(mockOptions);
        pubSub.subscribe('Posts', function (message) {
            try {
                expect(message).to.equals('test');
                done();
            }
            catch (e) {
                done(e);
            }
        }).then(function (subId) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        expect(subId).to.be.a('number');
                        return [4, pubSub.publish('Posts', 'test')];
                    case 1:
                        _a.sent();
                        pubSub.unsubscribe(subId);
                        return [2];
                }
            });
        }); });
    });
    it('can unsubscribe from specific redis channel', function (done) {
        var pubSub = new redis_pubsub_1.RedisPubSub(mockOptions);
        pubSub.subscribe('Posts', function () { return null; }).then(function (subId) {
            pubSub.unsubscribe(subId);
            try {
                expect(unsubscribeSpy.callCount).to.equals(1);
                var call = unsubscribeSpy.lastCall;
                expect(call.args).to.have.members(['Posts']);
                done();
            }
            catch (e) {
                done(e);
            }
        });
    });
    it('cleans up correctly the memory when unsubscribing', function (done) {
        var pubSub = new redis_pubsub_1.RedisPubSub(mockOptions);
        Promise.all([
            pubSub.subscribe('Posts', function () { return null; }),
            pubSub.subscribe('Posts', function () { return null; }),
        ])
            .then(function (_a) {
            var subId = _a[0], secondSubId = _a[1];
            try {
                expect(pubSub.subscriptionMap[subId]).not.to.be.an('undefined');
                pubSub.unsubscribe(subId);
                expect(pubSub.subscriptionMap[subId]).to.be.an('undefined');
                expect(function () { return pubSub.unsubscribe(subId); }).to.throw("There is no subscription of id \"" + subId + "\"");
                pubSub.unsubscribe(secondSubId);
                done();
            }
            catch (e) {
                done(e);
            }
        });
    });
    it('will not unsubscribe from the redis channel if there is another subscriber on it\'s subscriber list', function (done) {
        var pubSub = new redis_pubsub_1.RedisPubSub(mockOptions);
        var subscriptionPromises = [
            pubSub.subscribe('Posts', function () {
                done('Not supposed to be triggered');
            }),
            pubSub.subscribe('Posts', function (msg) {
                try {
                    expect(msg).to.equals('test');
                    done();
                }
                catch (e) {
                    done(e);
                }
            }),
        ];
        Promise.all(subscriptionPromises).then(function (subIds) { return __awaiter(_this, void 0, void 0, function () {
            var e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        expect(subIds.length).to.equals(2);
                        pubSub.unsubscribe(subIds[0]);
                        expect(unsubscribeSpy.callCount).to.equals(0);
                        return [4, pubSub.publish('Posts', 'test')];
                    case 1:
                        _a.sent();
                        pubSub.unsubscribe(subIds[1]);
                        expect(unsubscribeSpy.callCount).to.equals(1);
                        return [3, 3];
                    case 2:
                        e_1 = _a.sent();
                        done(e_1);
                        return [3, 3];
                    case 3: return [2];
                }
            });
        }); });
    });
    it('will subscribe to redis channel only once', function (done) {
        var pubSub = new redis_pubsub_1.RedisPubSub(mockOptions);
        var onMessage = function () { return null; };
        var subscriptionPromises = [
            pubSub.subscribe('Posts', onMessage),
            pubSub.subscribe('Posts', onMessage),
        ];
        Promise.all(subscriptionPromises).then(function (subIds) {
            try {
                expect(subIds.length).to.equals(2);
                expect(subscribeSpy.callCount).to.equals(1);
                pubSub.unsubscribe(subIds[0]);
                pubSub.unsubscribe(subIds[1]);
                done();
            }
            catch (e) {
                done(e);
            }
        });
    });
    it('can have multiple subscribers and all will be called when a message is published to this channel', function (done) {
        var pubSub = new redis_pubsub_1.RedisPubSub(mockOptions);
        var onMessageSpy = simple_mock_1.spy(function () { return null; });
        var subscriptionPromises = [
            pubSub.subscribe('Posts', onMessageSpy),
            pubSub.subscribe('Posts', onMessageSpy),
        ];
        Promise.all(subscriptionPromises).then(function (subIds) { return __awaiter(_this, void 0, void 0, function () {
            var e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        expect(subIds.length).to.equals(2);
                        return [4, pubSub.publish('Posts', 'test')];
                    case 1:
                        _a.sent();
                        expect(onMessageSpy.callCount).to.equals(2);
                        onMessageSpy.calls.forEach(function (call) {
                            expect(call.args).to.have.members(['test']);
                        });
                        pubSub.unsubscribe(subIds[0]);
                        pubSub.unsubscribe(subIds[1]);
                        done();
                        return [3, 3];
                    case 2:
                        e_2 = _a.sent();
                        done(e_2);
                        return [3, 3];
                    case 3: return [2];
                }
            });
        }); });
    });
    it('can publish objects as well', function (done) {
        var pubSub = new redis_pubsub_1.RedisPubSub(mockOptions);
        pubSub.subscribe('Posts', function (message) {
            try {
                expect(message).to.have.property('comment', 'This is amazing');
                done();
            }
            catch (e) {
                done(e);
            }
        }).then(function (subId) { return __awaiter(_this, void 0, void 0, function () {
            var e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4, pubSub.publish('Posts', { comment: 'This is amazing' })];
                    case 1:
                        _a.sent();
                        pubSub.unsubscribe(subId);
                        return [3, 3];
                    case 2:
                        e_3 = _a.sent();
                        done(e_3);
                        return [3, 3];
                    case 3: return [2];
                }
            });
        }); });
    });
    it('can accept custom reviver option (eg. for Javascript Dates)', function (done) {
        var dateReviver = function (key, value) {
            var isISO8601Z = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/;
            if (typeof value === 'string' && isISO8601Z.test(value)) {
                var tempDateNumber = Date.parse(value);
                if (!isNaN(tempDateNumber)) {
                    return new Date(tempDateNumber);
                }
            }
            return value;
        };
        var pubSub = new redis_pubsub_1.RedisPubSub(__assign({}, mockOptions, { reviver: dateReviver }));
        var validTime = new Date();
        var invalidTime = '2018-13-01T12:00:00Z';
        pubSub.subscribe('Times', function (message) {
            try {
                expect(message).to.have.property('invalidTime', invalidTime);
                expect(message).to.have.property('validTime');
                expect(message.validTime.getTime()).to.equals(validTime.getTime());
                done();
            }
            catch (e) {
                done(e);
            }
        }).then(function (subId) { return __awaiter(_this, void 0, void 0, function () {
            var e_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4, pubSub.publish('Times', { validTime: validTime, invalidTime: invalidTime })];
                    case 1:
                        _a.sent();
                        pubSub.unsubscribe(subId);
                        return [3, 3];
                    case 2:
                        e_4 = _a.sent();
                        done(e_4);
                        return [3, 3];
                    case 3: return [2];
                }
            });
        }); });
    });
    it('throws if you try to unsubscribe with an unknown id', function () {
        var pubSub = new redis_pubsub_1.RedisPubSub(mockOptions);
        return expect(function () { return pubSub.unsubscribe(123); })
            .to.throw('There is no subscription of id "123"');
    });
    it('can use transform function to convert the trigger name given into more explicit channel name', function (done) {
        var triggerTransform = function (trigger, _a) {
            var repoName = _a.repoName;
            return trigger + "." + repoName;
        };
        var pubSub = new redis_pubsub_1.RedisPubSub({
            triggerTransform: triggerTransform,
            publisher: mockRedisClient,
            subscriber: mockRedisClient,
        });
        var validateMessage = function (message) {
            try {
                expect(message).to.equals('test');
                done();
            }
            catch (e) {
                done(e);
            }
        };
        pubSub.subscribe('comments', validateMessage, { repoName: 'graphql-redis-subscriptions' }).then(function (subId) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, pubSub.publish('comments.graphql-redis-subscriptions', 'test')];
                    case 1:
                        _a.sent();
                        pubSub.unsubscribe(subId);
                        return [2];
                }
            });
        }); });
    });
    afterEach('Reset spy count', function () {
        publishSpy.reset();
        subscribeSpy.reset();
        unsubscribeSpy.reset();
    });
    after('Restore redis client', function () {
        simple_mock_1.restore();
    });
});
describe('PubSubAsyncIterator', function () {
    it('should expose valid asyncItrator for a specific event', function () {
        var pubSub = new redis_pubsub_1.RedisPubSub(mockOptions);
        var eventName = 'test';
        var iterator = pubSub.asyncIterator(eventName);
        expect(iterator).to.exist;
        expect(iterall_1.isAsyncIterable(iterator)).to.be.true;
    });
    it('should trigger event on asyncIterator when published', function (done) {
        var pubSub = new redis_pubsub_1.RedisPubSub(mockOptions);
        var eventName = 'test';
        var iterator = pubSub.asyncIterator(eventName);
        iterator.next().then(function (result) {
            expect(result).to.exist;
            expect(result.value).to.exist;
            expect(result.done).to.exist;
            done();
        });
        pubSub.publish(eventName, { test: true });
    });
    it('should not trigger event on asyncIterator when publishing other event', function () { return __awaiter(_this, void 0, void 0, function () {
        var pubSub, eventName, iterator, triggerSpy;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    pubSub = new redis_pubsub_1.RedisPubSub(mockOptions);
                    eventName = 'test2';
                    iterator = pubSub.asyncIterator('test');
                    triggerSpy = simple_mock_1.spy(function () { return undefined; });
                    iterator.next().then(triggerSpy);
                    return [4, pubSub.publish(eventName, { test: true })];
                case 1:
                    _a.sent();
                    expect(triggerSpy.callCount).to.equal(0);
                    return [2];
            }
        });
    }); });
    it('register to multiple events', function (done) {
        var pubSub = new redis_pubsub_1.RedisPubSub(mockOptions);
        var eventName = 'test2';
        var iterator = pubSub.asyncIterator(['test', 'test2']);
        var triggerSpy = simple_mock_1.spy(function () { return undefined; });
        iterator.next().then(function () {
            triggerSpy();
            expect(triggerSpy.callCount).to.be.gte(1);
            done();
        });
        pubSub.publish(eventName, { test: true });
    });
    it('should not trigger event on asyncIterator already returned', function (done) {
        var pubSub = new redis_pubsub_1.RedisPubSub(mockOptions);
        var eventName = 'test';
        var iterator = pubSub.asyncIterator(eventName);
        iterator.next().then(function (result) {
            expect(result).to.exist;
            expect(result.value).to.exist;
            expect(result.value.test).to.equal('word');
            expect(result.done).to.be.false;
        });
        pubSub.publish(eventName, { test: 'word' }).then(function () {
            iterator.next().then(function (result) {
                expect(result).to.exist;
                expect(result.value).not.to.exist;
                expect(result.done).to.be.true;
                done();
            });
            iterator.return();
            pubSub.publish(eventName, { test: true });
        });
    });
});
//# sourceMappingURL=tests.js.map