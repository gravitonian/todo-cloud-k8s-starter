const redis = require('redis');
const rabbitmq = require('amqplib/callback_api');
const apiAdapter = require('./apiAdapter');
const envProps = require('./env_props');

const storageServiceApi = apiAdapter(envProps.storageServiceURL);

// Redis Client Setup //////////////////////////////////////////////////////////////////////////////////////////////////
const redisClient = redis.createClient({
    host: envProps.redisHost,
    port: envProps.redisPort,
    enable_offline_queue: false,
    retry_strategy: () => 1000 // try reconnecting after 1 sec.
});
redisClient.on('connect', () => console.log('Redis client connected'));
redisClient.on('error', (err) => console.log('Something went wrong with Redis: ' + err));

// Messaging Processing ////////////////////////////////////////////////////////////////////////////////////////////////

rabbitmq.connect(envProps.rabbitmqUrl, function(err, connection) {
    connection.createChannel(function(err, channel) {
        const cacheIngestionQueue = 'cache-ingestion';

        channel.assertQueue(cacheIngestionQueue, {durable: true});

        // Get one (1) message, let other cache servers grab messages if there are more
        channel.prefetch(1);

        console.log("Waiting for messages in '%s' queue...", cacheIngestionQueue);

        channel.consume(cacheIngestionQueue, function(msg) {
            const msgContent = msg.content.toString();

            console.log("Received '%s' message", msgContent);

            if (msgContent === '**load**') {
                loadRedisFromStorage();
            } else {
                addTodo2Redis(msgContent);
            }

            setTimeout(function() {
                channel.ack(msg);
            }, 1000); // 1 second

        }, {noAck: false});
    });
});

function loadRedisFromStorage(todoTitle) {
    storageServiceApi.get('/api/v1/todos')
        .then(resp2 => {
            todos = resp2.data;
            if (todos == null || todos.length <=0) {
                console.log('Nothing to load, got nothing from Todo Storage');
            } else {
                console.log('Loading Todos from Todo Storage (' + todos.length + ')');
                for (let i = 0; i < todos.length; i++) {
                    addTodo2Redis(todos[i].title)
                }
            }
        })
        .catch(err2 => {
            console.log(err2);
        });
}

function addTodo2Redis(todoTitle) {
    // Update the Redis cache (add the todo text to the Set in Redis)
    redisClient.sadd(['todos', todoTitle], (error, reply) => {
        if (error) {
            console.error('Not able to add Todo: [' + todoTitle + '] to Redis Cache');
        } else {
            console.log('Added Todo: [' + todoTitle + '] to Redis Cache');
        }
    });
}
