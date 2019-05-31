const axios = require('axios');

module.exports = (baseURL) => {
    return axios.create({
        baseURL: baseURL,
        timeout: 2 * 1000, // Wait 2 seconds before timeout
    });
}