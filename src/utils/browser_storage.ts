import { createId } from '@paralleldrive/cuid2';

export type StorageSubscriptionHandler<Value = string> = (
    value: Value,
    type: 'set' | 'remove',
) => void | Promise<void>;

interface LocalStorageWrapper {
    all<T>(): T;
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}

function createLocalStorageWrapper(): LocalStorageWrapper {
    if (typeof localStorage !== 'undefined') {
        return {
            all() {
                return JSON.parse(JSON.stringify(localStorage));
            },
            getItem(key) {
                return localStorage.getItem(key);
            },
            setItem(key, value) {
                localStorage.setItem(key, value);
            },
            removeItem(key) {
                localStorage.removeItem(key);
            },
        };
    }
    const _storage: {
        [key: string]: string;
    } = {};
    return {
        all() {
            return JSON.parse(JSON.stringify(_storage));
        },
        getItem(key) {
            if (_storage[key]) {
                return '' + _storage[key];
            } else {
                return null;
            }
        },
        setItem(key, value) {
            _storage[key] = '' + value;
        },
        removeItem(key) {
            delete _storage[key];
        },
    };
}

export class Storage {
    scope: string;
    chunkSize: number;

    private ls: LocalStorageWrapper;
    private subs: {
        [id: string]: {
            key: string;
            handler: StorageSubscriptionHandler<unknown>;
        };
    } = {};

    constructor(config: { scope: string; chunkSize?: number }) {
        this.scope = config.scope;
        this.chunkSize = config.chunkSize || 5120000;
        this.ls = createLocalStorageWrapper();
    }

    /**
     * Remove all data from the storage in the specified scope.
     */
    async clear(): Promise<void> {
        const items: { [key: string]: unknown } = this.ls.all();
        const keys = Object.keys(items);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (key.startsWith(this.scope)) {
                await this.remove(key.substring(this.scope.length + 1));
            }
        }
    }

    /**
     * Set the value of a key. Value can be Object or a string.
     * Objects will be stringified and stored as a string in
     * Local Storage. When you get the Object it will automatically
     * be parsed back to an Object.
     */
    async set(key: string, value: unknown): Promise<boolean> {
        const keyBase = `${this.scope}_${key}`;
        try {
            let data = '';
            if (typeof value === 'object') {
                data = JSON.stringify(value);
            } else if (typeof value === 'string') {
                data = value as string;
            } else {
                console.error(
                    `Value can be only "string" or "object" but "${typeof value}" was provided.`,
                );
                return false;
            }
            let chunked = false;
            let chunkCount = 0;
            if (data.length > this.chunkSize) {
                chunked = true;
                chunkCount =
                    parseInt(`${data.length / this.chunkSize}`, 10) + 1;
                for (let i = 0; i < chunkCount; i++) {
                    this.ls.setItem(
                        `${keyBase}_chunk_${i}`,
                        data.substring(
                            i * this.chunkSize,
                            i * this.chunkSize + this.chunkSize,
                        ),
                    );
                }
            }
            this.ls.setItem(
                keyBase,
                chunked ? JSON.stringify({ ____chunks: chunkCount }) : data,
            );
        } catch (e) {
            console.error(e);
            return false;
        }
        const ids = Object.keys(this.subs);
        for (let i = 0; i < ids.length; i++) {
            const sub = this.subs[ids[i]];
            if (sub.key === key) {
                await sub.handler(JSON.parse(JSON.stringify(value)), 'set');
            }
        }
        return true;
    }

    /**
     * Remove specified key from the Storage.
     */
    async remove(key: string): Promise<void> {
        const keyBase = `${this.scope}_${key}`;
        const item = this.ls.getItem(keyBase);
        if (item) {
            try {
                const data = JSON.parse(item);
                if (data.____chunks) {
                    for (let i = 0; i < data.____chunks; i++) {
                        this.ls.removeItem(`${keyBase}_chunk_${i}`);
                    }
                }
            } catch (error) {
                // Do nothing
            }
        }
        this.ls.removeItem(keyBase);
        const ids = Object.keys(this.subs);
        for (let i = 0; i < ids.length; i++) {
            const sub = this.subs[ids[i]];
            if (sub.key === key) {
                await sub.handler(null, 'remove');
            }
        }
    }

    /**
     * Get a value of a specific key. If key does not exist
     * method will return null.
     */
    get<Value = string>(key: string): Value | undefined {
        const keyBase = `${this.scope}_${key}`;
        const rawValue = this.ls.getItem(keyBase);
        if (rawValue) {
            try {
                const data = JSON.parse(rawValue);
                if (data.____chunks) {
                    let buffer = '';
                    for (let i = 0; i < data.____chunks; i++) {
                        const chunk = this.ls.getItem(`${keyBase}_chunk_${i}`);
                        buffer += chunk;
                    }
                    try {
                        return JSON.parse(buffer);
                    } catch (error) {
                        console.error(error);
                        return buffer as Value;
                    }
                } else {
                    return data;
                }
            } catch (e) {
                return rawValue as Value;
            }
        }
        return undefined;
    }

    /**
     * Subscribe for changes to specified key. If the key's value
     * is changed, added or removed, handler function will be called.
     */
    subscribe<Value = string>(
        key: string,
        handler: StorageSubscriptionHandler<Value>,
    ) {
        const id = createId();
        this.subs[id] = { key, handler: handler as never };
        return () => {
            delete this.subs[id];
        };
    }
}
