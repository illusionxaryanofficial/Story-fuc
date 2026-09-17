const express = require('express');
const fetch = require('node-fetch');   // <-- using node-fetch

const app = express();
app.use(express.json());

const API_BASE = "https://api.appsdone.online";
const API_HEADERS = {
    'appversion': "300",
    'platform': "0",
    'deviceid': "83a25beee1317224",
    'os': "Android 13 (API 33)",
    'network_type': "WIFI",
    'x-ayush-key': "LEGEND_2026_SECRET",
    'authorization': "Bearer eyJhbGciOiJIUzI1NiJ9.eyJjcmVhdGVkRGF0ZSI6IjIwMjYtMDEtMTEgMDM6NDA6MDEuNjYyIiwic2Vzc2lvbklkIjoiMTYxMzU2Mjk5IiwiZGV2aWNlSWQiOiJhN2Q5MjgzODQxYjRmMWIzIiwic3ViIjoiNTMzMTQ2MzMiLCJleHAiOjE3ODI4ODEwMTZ9.O62idCQnjAIyP_r-JRH6mt0i38dkYXpskpbJOET-E34",
    'accept': "application/json",
    'user-agent': "ktor-client",
    'content-type': "application/json",
    'accept-encoding': "gzip"
};

app.use((req, res, next) => {
    if (req.path === '/') return next();
    if (req.path.includes('/heartbeat') || req.path.includes('/impression') || req.path.includes('/analytics')) return next();
    const key = req.headers['x-rlx-tag'];
    if (key !== 'RLX_SK') {
        req.socket.destroy();
        return;
    }
    next();
});

const removeUnwantedTags = (obj) => {
    if (typeof obj === 'string') {
        return obj.replace(/@Az_Mods_Adda/g, '').replace(/AZmods/g, '').replace(/Mods/g, '').replace(/\s{2,}/g, ' ').trim();
    }
    if (typeof obj === 'object' && obj !== null) {
        for (let key in obj) {
            obj[key] = removeUnwantedTags(obj[key]);
        }
    }
    return obj;
};

const RealApkTag = (obj) => {
    const brandTag = " [ Join>> @ARYANxOFFICIAL ]";
    const targetKeys = ['title', 'name', 'text', '', 'epsTitle'];
    if (typeof obj === 'object' && obj !== null) {
        for (let key in obj) {
            if (typeof obj[key] === 'string' && targetKeys.includes(key)) {
                if (!obj[key].includes('[ Join>> @ARYANxOFFICIAL ]')) {
                    obj[key] = obj[key].replace(/\[ MODS \]/g, '').replace(/\[ [ Join>> @ARYANxOFFICIAL ] \]/g, '').replace(/\[ \]/g, '').trim() + brandTag;
                }
            } else if (typeof obj[key] === 'object') {
                RealApkTag(obj[key]);
            }
        }
    }
};

const buildSafeHeaders = (host) => {
    const headers = {
        'host': host,
        ...API_HEADERS,
        'ts': Math.floor(Date.now() / 1000).toString()
    };
    delete headers['x-request-id'];
    delete headers['x-b3-traceid'];
    delete headers['x-cloud-trace-context'];
    return headers;
};

const fetchAPI = async (path, method, body) => {
    const url = API_BASE + path;
    const options = {
        method,
        headers: buildSafeHeaders('api.appsdone.online')
    };
    if (method !== 'GET' && method !== 'HEAD' && body) {
        options.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
    return fetch(url, options);   // node-fetch
};

app.get('/', (req, res) => {
    res.type('text/plain').send('DOG DOG DOG DOG 🐶');
});

app.all('*', async (req, res) => {
    const urlPath = req.headers['x-invoke-path'] || req.originalUrl;
    const method = req.method;

    try {
        const response = await fetchAPI(urlPath, method, req.body);
        let data = await response.json();

        data = removeUnwantedTags(data);

        if (urlPath.includes('/profile/subscription')) {
            if (urlPath.includes('/profile/subscription/state')) {
                if (data?.data) {
                    data.data.subStat = "1";
                    data.data.mc = "0";
                }
            } else {
                data.data = {
                    subStat: "1",
                    plan: "[ MOD BY  Join>> @ARYANxOFFICIAL  ]",
                    cta: "RLX",
                    valdTxt: "injoy",
                    pvend: "JUSPAY",
                    sectionTile: { id: "18", lyt: "TS1", acttxt: "", text: "Top 10" },
                    valEp: 4102444800000,
                    mdActv: true
                };
            }
        }

        RealApkTag(data);
        return res.status(response.status).json(data);
    } catch (error) {
        return res.status(500).json({ code: 500, message: "Proxy error: " + error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});