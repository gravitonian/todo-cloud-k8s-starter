const express = require('express');
const bodyParser = require('body-parser');
const rabbitmq = require('amqplib/callback_api');
const apiAdapter = require('./apiAdapter');
const envProps = require('./env_props');

const cacheServiceApi = apiAdapter(envProps.cacheServiceURL);
const searchServiceApi = apiAdapter(envProps.searchServiceURL);
const storageServiceApi = apiAdapter(envProps.storageServiceURL);

// Initializing the Express Framework //////////////////////////////////////////////////////////////////////////////////
const app = express();
const port = 3000;
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true
    })
);

// Set up the API routes ///////////////////////////////////////////////////////////////////////////////////////////////

// Get all todos
app.route('/api/v1/todos').get( async (req, res) => {
    console.log('CALLED GET api/v1/todos');

    res.setHeader('Content-Type', 'application/json');

    let todos = [];
    let cacheServiceDown = false;

    // First, try to get todos from Todo cache
    await cacheServiceApi.get(req.path)
        .then(resp => {
            todos = resp.data;
        })
        .catch(err => {
            console.log('No response from Cache Service');
            cacheServiceDown = true;
        });

    if (todos == null || todos.length <=0) {
        console.log('Got nothing from Todo Cache');

        // Nothing in cache, try the Todo storage
        await storageServiceApi.get(req.path)
            .then(resp2 => {
            todos = resp2.data;
            if (todos == null || todos.length <=0) {
                console.log('Got nothing from Todo Storage');
            } else {
                console.log('Got Todos from Todo Storage (' + todos.length + ')');

                // Send message to Todo Cache about existing todos
                if (cacheServiceDown == false) {
                    sendMessageOnQueue('cache-ingestion', "**load**");
                }
            }
            res.send(todos);
        })
        .catch(err2 => {
            console.log('No response from Storage Service');
            res.send(todos);
        });
    } else {
        console.log('Got Todos from Todo Cache (' + todos.length + ')');
        res.send(todos);
    }
});

// Create a new todo
app.route('/api/v1/todos').post( (req, res) => {
    const todoTitle = req.body.title;

    console.log('CALLED POST api/v1/todos with title=' + todoTitle);

    // Send new Todo onto message queue for processing by todo-cache, todo-search, and todo-storage
    // Need different queues for the different ingestion services
    // (so we can have round-robin between each type when we scale up the solution)
    sendMessageOnQueue('cache-ingestion', todoTitle);
    sendMessageOnQueue('search-ingestion', todoTitle);
    sendMessageOnQueue('storage-ingestion', todoTitle);

    res.status(201).send(req.body);
});

// Search all todos
app.route('/api/v1/search').post((req, res) => {
    const searchText = req.body.searchText;

    console.log('CALLED POST api/v1/search with searchText=' + searchText);

    searchServiceApi.post(req.path, req.body)
        .then(resp => {
            console.log('Search Service response (' + resp.data + ')');
            res.send(resp.data);
        })
        .catch(err => {
            console.log('No response from Search Service');
        });
});

/**
 * Send a message on the passed in RabbitMQ Queue
 *
 * @param queueName the name of the queue to send message on
 * @param msg the message to send
 */
function sendMessageOnQueue(queueName, msg) {
    rabbitmq.connect(envProps.rabbitmqUrl, function (err, connection) {
        connection.createConfirmChannel(function (err, channel) {
            channel.assertQueue(queueName, {durable: true});
            channel.sendToQueue(queueName, Buffer.from(msg), {persistent: true},
                function (err, ok) {
                    if (err !== null)
                        console.warn("'%s' Message Nacked on queue '%s'", msg, queueName);
                    else
                        console.log("'%s' Message Acked on queue '%s'", msg, queueName);
                });
            console.log("Sent '%s' message on queue '%s'", msg, queueName);
        });

        setTimeout(function () {
            connection.close();
        }, 1000); // 1 second
    });
}


// Start the server ////////////////////////////////////////////////////////////////////////////////////////////////////
app.listen(port, () => {
    console.log('Todo API Gateway started!');
});