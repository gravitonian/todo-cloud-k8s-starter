// Environment specific configuration injected into the container
module.exports = {
    redisHost: process.env.REDIS_HOST,
    redisPort: process.env.REDIS_PORT,
    rabbitmqUrl: process.env.RABBITMQ_URL,
    storageServiceURL:  process.env.STORAGE_SERVICE_URL
};