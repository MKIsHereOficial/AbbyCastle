const axios = require('axios').default;

const baseURL = `https://abbydb.mkishereoficial.repl.co`;

async function Database(databaseName = "default") {
    var database = await fetchData(`${baseURL}/database/${databaseName.toLowerCase()}`, {headers: {accept: 'application/json'}}) || {database: {}};
    database = database.database;
    database.path = `${baseURL}/database/${databaseName.toLowerCase()}`;

    async function set(key = "", value) {
        const keyPath = `${database.path}/${key}`;

        //console.log(value);
        const a = await axios({method:'POST', url:`${keyPath}/set`, headers: {accept: 'application/json'}, data: JSON.stringify(value)}).catch(console.error);
 
        return a.data;

        return {key, value};
    }

    async function get(key = "", fallback = false) {
        const keyPath = `${database.path}/${key}`;

        var obj = {key, value: fallback || false, path: keyPath};

        obj = await fetchData(`${keyPath}`);

        if (!obj) obj = {key, value: fallback || false, path: keyPath};

        //console.dir(obj);

        return obj;
    }


    async function exists(key = "") {
        const keyPath = `${database.path}/${key}`;

        var obj = {key, path: keyPath};

        obj = await fetchData(`${keyPath}/exists`);

        //console.dir(obj);

        return obj;
    }

    async function del(key = "") {
        const keyPath = `${database.path}/${key}`;

        var obj = {key, path: keyPath};

        obj = await fetchData(`${keyPath}/dl`);

        //console.dir(obj);

        return obj;
    }

    return {database, get, fetch: get, exists, set, del, delete: del};
}

async function fetchData(url = "https://google.com", options = {}) {
    var data = {err: 'Cannot get ' + url};
    await axios.get(url, options).then(results => {
        data = results.data;
        //console.dir(data);
    }).catch(err => {
        data = {err};
    });

    //console.dir(data);

    return data;
}

module.exports = Database;