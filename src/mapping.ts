import EventEmitter from "node:events";
import fs from "node:fs";
import { stringify } from "./utils";

/**
 * Mapping a file.
 * @param file The path to the file.
 * @param fallback The fallback value to use if the file is not existing at the beginning.
 * @param write_cb The callback to trigger when the file is written.
 * @returns The mapped value.
 *
 * @example
 * ```ts
 * import { mapping } from "file-mapping";
 *
 * const data = mapping("./data.json", {});
 *
 * data.name = "Jacob";
 * data.age = 19;
 *
 * // Then, the file should be write automatically and only once.
 * ```
 */
export function mapping<T>(
    file: string,
    fallback?: T,
    write_cb?: (data: T, changes: number) => void,
): T {
    const data = fs.existsSync(file)
        ? JSON.parse(fs.readFileSync(file, "utf8"))
        : JSON.parse(stringify(fallback)) || Object.create(null);
    let writing = Promise.resolve(true);
    let changes = 0;

    const proxied = new Set();
    const proxy = {
        get: (target: Record<string, unknown>, key: string) => {
            const prop = target[key];

            if (typeof prop === "object" && prop !== null && !proxied.has(target[key])) {
                target[key] = new Proxy(prop, proxy);
                proxied.add(target[key]);
            }

            return target[key];
        },
        set: (target: Record<string, unknown>, key: string, value: unknown) => {
            target[key] = value;
            changes++;

            (async () => {
                await writing;

                if (changes === 0) {
                    return;
                }

                writing = new Promise((resolve) => {
                    fs.writeFileSync(file, JSON.stringify(data), "utf8");

                    if (write_cb) {
                        write_cb(data, changes);
                    }

                    changes = 0;
                    resolve(true);
                });
            })();

            return true;
        },
    };

    return new Proxy(data, proxy);
}

/**
 * Mapping a file, with event emitter interface.
 */
export class Mapping<T> extends EventEmitter {
    private _data: T;
    private _file: string;
    private _written = 0;

    /**
     * Create a new mapping.
     * @param file The path to the file.
     * @param fallback The fallback value to use if the file is not existing at the beginning.
     */
    constructor(file: string, fallback?: T) {
        super();
        this._file = file;
        this._data = this.map(file, fallback)._data;
    }

    /**
     * Get the mapped value.
     */
    get data(): T {
        return this._data;
    }

    /**
     * Get the path to the file.
     */
    get file(): string {
        return this._file;
    }

    /**
     * Get the number of times the file has been written.
     */
    get written(): number {
        return this._written;
    }

    /**
     * Map or re-map a file.
     * @param file The path to the file.
     * @param fallback The fallback value to use if the file is not existing at the beginning.
     * @returns The Mapping instance itself.
     */
    public map(file: string, fallback?: T): this {
        this._data = mapping(file, fallback, (data, changes) => {
            this._written++;
            this.emit("write", data, changes);
        });
        this._file = file;

        return this;
    }
}

export declare interface Mapping<T> {
    emit(event: "write", data: T, changes: number): boolean;
    on(event: "write", listener: (data: T, changes: number) => void): this;
    once(event: "write", listener: (data: T, changes: number) => void): this;
    addListener(event: "write", listener: (data: T, changes: number) => void): this;
    removeListener(event: "write", listener: (data: T, changes: number) => void): this;
    prependListener(event: "write", listener: (data: T, changes: number) => void): this;
    prependOnceListener(event: "write", listener: (data: T, changes: number) => void): this;
}
