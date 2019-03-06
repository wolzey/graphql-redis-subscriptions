import { RedisOptions, Redis as RedisClient } from 'ioredis';
import { PubSubEngine } from 'graphql-subscriptions';
export interface PubSubRedisOptions {
    connection?: RedisOptions;
    triggerTransform?: TriggerTransform;
    connectionListener?: (err: Error) => void;
    publisher?: RedisClient;
    subscriber?: RedisClient;
    reviver?: Reviver;
}
export declare class RedisPubSub implements PubSubEngine {
    constructor(options?: PubSubRedisOptions);
    publish(trigger: string, payload: any): Promise<void>;
    subscribe(trigger: string, onMessage: Function, options?: Object): Promise<number>;
    unsubscribe(subId: number): void;
    asyncIterator<T>(triggers: string | string[]): AsyncIterator<T>;
    getSubscriber(): RedisClient;
    getPublisher(): RedisClient;
    close(): void;
    private onMessage;
    private triggerTransform;
    private redisSubscriber;
    private redisPublisher;
    private reviver;
    private subscriptionMap;
    private subsRefsMap;
    private currentSubscriptionId;
}
export declare type Path = Array<string | number>;
export declare type Trigger = string | Path;
export declare type TriggerTransform = (trigger: Trigger, channelOptions?: Object) => string;
export declare type Reviver = (key: any, value: any) => any;
