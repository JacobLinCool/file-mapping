# File Mapping

[![NPM](https://img.shields.io/npm/v/file-mapping.svg?style=flat)](https://www.npmjs.com/package/file-mapping)

A library that maps JSON file and in-memory data, and using lazy-writing strategy to reduce disk I/O.

## Usage

### Simple Usage

```ts
import { mapping } from "file-mapping";

const data = mapping("./data.json", {});

data.name = "Jacob";
data.age = 19;

// Then, the file should be write automatically and only once.
```

### Nested Data

```ts
import { mapping } from "file-mapping";

const data = mapping("./data.json", {});

data.collection = {};
data.collection.document = {};
data.collection.document.something = "something";
// Nested data are also supported.
```

### Listen to file write

```ts
import { mapping } from "file-mapping";

const data = mapping("./data.json", {}, (data, changes) => {
    console.log(`write ${changes.length} changes into disk`, data);
});

for (let i = 0; i < 1000; i++) {
    data[`key-${i}`] = `value-${i}`;
}
```

### Event Emitter style

`Mapping` also count the number of write operations internally, and you can use `.data`, `.file`, `.written` to get the informations.

```ts
import { Mapping } from "file-mapping";

const mapping = new Mapping("./data.json", {});
const data = mapping.data;

mapping.on("write", (data, changes) => {
    console.log(`write ${changes.length} changes into disk`, data);
});

for (let i = 0; i < 1000; i++) {
    data[`key-${i}`] = `value-${i}`;
}
```

## Links

- NPM Package: <https://www.npmjs.com/package/file-mapping>
- Documentation: <https://jacoblincool.github.io/file-mapping/>
- GitHub Repository: <https://github.com/JacobLinCool/file-mapping/>
