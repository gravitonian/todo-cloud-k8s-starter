// Environment specific configuration injected into the container
module.exports = {
    postgresHost: process.env.POSTGRES_HOST,
    postgresPort: process.env.POSTGRES_PORT,
    postgresDatabase: process.env.POSTGRES_DATABASE,
    postgresUser: process.env.POSTGRES_USER,
    postgresPassword: process.env.POSTGRES_PASSWORD,
    rabbitmqUrl: process.env.RABBITMQ_URL
};