const elasticsearch = require('elasticsearch');
const rabbitmq = require('amqplib/callback_api');
const envProps = require('./env_props');

// Elasticsearch Client Setup //////////////////////////////////////////////////////////////////////////////////////////
const elasticClient = new elasticsearch.Client({
    hosts: [ envProps.elasticHost + ':' + envProps.elasticPort], // needed when we are running Elastic, we need to set the port
    //hosts: [ envProps.elasticHost ], // used when Elastic is running as a service in AWS
    log: 'trace'
});

const TODO_SEARCH_INDEX_NAME = "todos";
const TODO_SEARCH_INDEX_TYPE = "todo";

// Ping the client to be sure Elastic is up
elasticClient.ping({
    requestTimeout: 30000,
}, function(error) {
    if (error) {
        console.error('Something went wrong with Elasticsearch ' + envProps.elasticHost + ':' + envProps.elasticPort + ' : ' + error.message);
    } else {
        console.log('Elasticsearch client connected to ' + envProps.elasticHost + ':' + envProps.elasticPort);

        // Check if todo index already exists?
        const todoIndexExists = elasticClient.indices.exists({
            index: TODO_SEARCH_INDEX_NAME
        }, function (error, response, status) {
            if (error) {
                console.log(error);
            } else {
                console.log('Todo index exists in Elasticsearch');
            }
        });


        if (!todoIndexExists) {
            // Create a Todos index. If the index has already been created, then this function fails safely
            elasticClient.indices.create({
                index: TODO_SEARCH_INDEX_NAME
            }, function (error, response, status) {
                if (error) {
                    console.log('Could not create Todo index in Elasticsearch: ' + error);
                } else {
                    console.log('Created Todo index in Elasticsearch');
                }
            });
        }
    }
});

// Messaging Processing ////////////////////////////////////////////////////////////////////////////////////////////////

rabbitmq.connect(envProps.rabbitmqUrl, function(err, connection) {
    connection.createChannel(function(err, channel) {
        const searchIngestionQueue = 'search-ingestion';

        channel.assertQueue(searchIngestionQueue, {durable: true});

        // Get one (1) message, let other search servers grab messages if there are more
        channel.prefetch(1);

        console.log("Waiting for messages in '%s' queue...", searchIngestionQueue);

        channel.consume(searchIngestionQueue, function(msg) {
            const todoTitle = msg.content.toString();
            console.log("Received '%s' todo", todoTitle);

            // Update the search index
            elasticClient.index({
                index: TODO_SEARCH_INDEX_NAME,
                type: TODO_SEARCH_INDEX_TYPE,
                body: {
                    todotext: todoTitle
                }
            }, function(err, resp, status) {
                if (err) {
                    console.log('Could not index ' + todoTitle + ": " + err);
                } else {
                    console.log('Added Todo: [' + todoTitle + '] to Elasticsearch Index');
                }
            });

            setTimeout(function() {
                channel.ack(msg);
            }, 1000); // 1 second

        }, {noAck: false});
    });
});
