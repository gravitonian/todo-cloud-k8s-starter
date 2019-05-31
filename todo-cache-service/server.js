const express = require('express');
const bodyParser = require('body-parser');
const redis = require('redis');
const envProps = require('./env_props');

// Initializing the Express Framework //////////////////////////////////////////////////////////////////////////////////
const app = express();
const port = 3000;
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true
    })
);

// Redis Client Setup //////////////////////////////////////////////////////////////////////////////////////////////////
const redisClient = redis.createClient({
    host: envProps.redisHost,
    port: envProps.redisPort,
    enable_offline_queue: false,
    retry_strategy: () => 1000 // try reconnecting after 1 sec.
});
redisClient.on('connect', () => console.log('Redis client connected'));
redisClient.on('error', (err) => console.log('Something went wrong with Redis: ' + err));

// Set up the API routes ///////////////////////////////////////////////////////////////////////////////////////////////

// Get all todos
app.route('/api/v1/todos').get( (req, res) => {
    console.log('CALLED GET api/v1/todos');

    res.setHeader('Content-Type', 'application/json');

    redisClient.smembers('todos', (error, cachedTodoSet) => { // ["Get kids from school","Take out the trash","Go shopping"]
        let todos = []; // [{"title":"Get kids from school"},{"title":"Take out the trash"},{"title":"Go shopping"}]

        if (error) {
            console.log('Error when getting todos from Redis: ' + error);
        } else {
            if (cachedTodoSet != null && cachedTodoSet.length > 0) {
                for (let i = 0; i < cachedTodoSet.length; i++) {
                    todos.push({"title": cachedTodoSet[i]});
                }

                console.log('Got todos from Redis (' + todos.length + ')');
            }
        }

        res.send(todos);
    });
});

// Start the server ////////////////////////////////////////////////////////////////////////////////////////////////////
app.listen(port, () => {
    console.log('Todo Cache Service started!');
});


module.exports = app;
