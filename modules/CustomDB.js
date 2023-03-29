import { readFileSync, writeFileSync, writeFile, existsSync } from "fs";

export class CustomDB {

    constructor(path) {
        this.#mainPath = path;
    }

    #mainPath = './logs/';

    getData = (battleID) => {
        if (!battleID) return null;

        const path = this.#mainPath + battleID + '.json';

        if (existsSync(path)) { return JSON.parse(readFileSync(path)) }
            else { return null }
    }

    saveData = (battleID, data, cb) => {
        if (!battleID && !data) return;

        const path = this.#mainPath + battleID + '.json';

        writeFile(path, JSON.stringify(data), 'utf8', () => typeof cb === 'function' && cb());
    }
}