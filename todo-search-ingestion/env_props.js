// Environment specific configuration injected into the container
module.exports = {
    elasticHost: process.env.ELASTICSEARCH_HOST,
    elasticPort: process.env.ELASTICSEARCH_PORT,
    rabbitmqUrl: process.env.RABBITMQ_URL
};