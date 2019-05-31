const { Pool } = require('pg');
const rabbitmq = require('amqplib/callback_api');
const envProps = require('./env_props');

// Postgres Client Setup ///////////////////////////////////////////////////////////////////////////////////////////////
const postgresClient = new Pool({
    host: envProps.postgresHost,
    port: envProps.postgresPort,
    database: envProps.postgresDatabase,
    user: envProps.postgresUser,
    password: envProps.postgresPassword,
    max: 10,                        // Max number of connections in the pool
    idleTimeoutMillis: 30000        // Connection timeout 30 seconds
});


// Messaging Processing ////////////////////////////////////////////////////////////////////////////////////////////////

rabbitmq.connect(envProps.rabbitmqUrl, function(err, connection) {
    connection.createChannel(function(err, channel) {
        const storageIngestionQueue = 'storage-ingestion';

        channel.assertQueue(storageIngestionQueue, {durable: true});

        // Get one (1) message, let other storage servers grab messages if there are more
        channel.prefetch(1);

        console.log("Waiting for messages in '%s' queue...", storageIngestionQueue);

        channel.consume(storageIngestionQueue, function(msg) {
            const todoTitle = msg.content.toString();
            console.log("Received '%s' todo", todoTitle);

            // Insert todo in postgres DB
            postgresClient.connect((err, client) => {
                if (err) {
                    console.log('Could not connect to Postgres in AddTodo: ' + err);
                } else {
                    console.log('Postgres client connected in AddTodo');

                    client.query('INSERT INTO todo(title) VALUES($1)', [todoTitle], (error, reply) => {
                        if (error) {
                            console.log('Could not add ' + todoTitle + "' to Database: " + error);
                        } else {
                            console.log('Added Todo: [' + todoTitle + '] to Database');
                        }
                    });

                }
            });

            setTimeout(function() {
                channel.ack(msg);
            }, 1000); // 1 second

        }, {noAck: false});
    });
});
