import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { Mapping } from "./mapping";

export class Collection<T> {
    private storage: string;
    private proto?: T;
    private collection = new Map<string, Mapping<T>>();

    constructor(storage: string, proto?: T) {
        this.storage = path.resolve(storage);
        this.proto = proto;

        if (!fs.existsSync(this.storage)) {
            fs.mkdirSync(this.storage, { recursive: true });
        }
    }

    public get(id: string): Mapping<T> {
        if (!this.collection.has(id)) {
            this.collection.set(
                id,
                new Mapping(
                    path.resolve(
                        this.storage,
                        createHash("sha256").update(id).digest("hex") + ".json",
                    ),
                    this.proto,
                ),
            );
        }

        return this.collection.get(id) as Mapping<T>;
    }

    public data(id: string): T {
        return this.get(id).data;
    }

    public delete(id: string): boolean {
        if (this.collection.has(id)) {
            const mapping = this.get(id);
            fs.unlinkSync(mapping.file);
            return this.collection.delete(id);
        }

        return false;
    }
}
