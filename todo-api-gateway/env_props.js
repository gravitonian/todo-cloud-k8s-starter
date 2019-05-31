// Environment specific configuration injected into the container
module.exports = {
    rabbitmqUrl: process.env.RABBITMQ_URL,
    cacheServiceURL: process.env.CACHE_SERVICE_URL,
    searchServiceURL:  process.env.SEARCH_SERVICE_URL,
    storageServiceURL:  process.env.STORAGE_SERVICE_URL
};