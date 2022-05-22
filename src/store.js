const fs = require('fs')
module.exports = class Store {
    constructor(pathToData) {
        this.path = pathToData
    }
    read() {
        return JSON.parse(fs.readFileSync(this.path, 'utf-8'))
    }
    save(data) {
        fs.writeFileSync(this.path, JSON.stringify(data))
    }
}

