import fs from "node:fs";
import { Mapping, Collection } from "../";

describe("test mapping", () => {
    test("simple object usage", async () => {
        const file1 = "test1.json";
        const mapping = new Mapping(file1, { a: -1, b: -1 });
        const data = mapping.data;

        for (let i = 0; i < 1000; i++) {
            data.a = i;
            data.b = i * 2;
        }

        expect(data.a).toBe(999);
        expect(data.b).toBe(999 * 2);

        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(mapping.written).toBe(1);
        expect(mapping.file).toBe(file1);

        const file = JSON.parse(fs.readFileSync(file1, "utf8"));
        expect(file.a).toBe(data.a);
        expect(file.b).toBe(data.b);

        mapping.map(file1, { a: -1, b: -1 });
        expect(mapping.written).toBe(1);
        expect(mapping.data.a).toBe(999);
        expect(mapping.data.b).toBe(999 * 2);

        fs.rmSync(file1);
    });

    test("simple array usage", async () => {
        const file2 = "test2.json";
        const mapping = new Mapping<[number, number][]>(file2, []);
        const data = mapping.data;

        for (let i = 0; i < 1000; i++) {
            data.push([i, i * 2]);
        }

        expect(data.length).toBe(1000);
        for (let i = 0; i < 1000; i++) {
            expect(data[i][0]).toBe(i);
            expect(data[i][1]).toBe(i * 2);
        }

        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(mapping.written).toBe(1);
        expect(mapping.file).toBe(file2);

        const file = JSON.parse(fs.readFileSync(file2, "utf8"));
        expect(file.length).toBe(data.length);
        for (let i = 0; i < 1000; i++) {
            expect(file[i][0]).toBe(data[i][0]);
            expect(file[i][1]).toBe(data[i][1]);
        }
        fs.rmSync(file2);
    });

    test("nested usage", async () => {
        const file3 = "test3.json";
        const mapping = new Mapping<Record<string, Record<string, number>>>(file3, {});
        const data = mapping.data;

        for (let i = 0; i < 10; i++) {
            data[`item_${i}`] = {};
            for (let j = 0; j < 10; j++) {
                data[`item_${i}`][`attr_${j}`] = i + j;
            }
        }

        expect(data["item_0"]["attr_0"]).toBe(0);
        expect(data["item_0"]["attr_9"]).toBe(9);
        expect(data["item_9"]["attr_0"]).toBe(9);
        expect(data["item_9"]["attr_9"]).toBe(18);

        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(mapping.written).toBe(1);

        expect(JSON.stringify(data)).toBe(fs.readFileSync(file3, "utf8"));

        data["item_0"]["attr_0"] = -1;

        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(mapping.written).toBe(2);

        expect(JSON.stringify(data)).toBe(fs.readFileSync(file3, "utf8"));

        fs.rmSync(file3);
    });
});

describe("test collection", () => {
    test("collection", async () => {
        const dir = "collection";
        fs.rmSync(dir, { recursive: true, force: true });

        const accounts = new Collection(dir, { balance: 0 });
        const jacob = accounts.data("jacob");
        const howard = accounts.data("howard");
        const takala = accounts.data("takala");

        expect(jacob.balance).toBe(0);
        expect(howard.balance).toBe(0);
        expect(takala.balance).toBe(0);

        jacob.balance = 100;
        howard.balance = 200;
        takala.balance = 300;

        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(accounts.get("jacob").written).toBe(1);
        expect(accounts.get("howard").written).toBe(1);
        expect(accounts.get("takala").written).toBe(1);

        expect(JSON.parse(fs.readFileSync(accounts.get("jacob").file, "utf8")).balance).toBe(
            jacob.balance,
        );
        expect(JSON.parse(fs.readFileSync(accounts.get("howard").file, "utf8")).balance).toBe(
            howard.balance,
        );
        expect(JSON.parse(fs.readFileSync(accounts.get("takala").file, "utf8")).balance).toBe(
            takala.balance,
        );

        expect(accounts.delete("jacob")).toBe(true);
        expect(accounts.delete("jacob")).toBe(false);

        fs.rmSync(dir, { recursive: true, force: true });
    });
});
