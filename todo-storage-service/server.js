const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
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

// Set up the API routes ///////////////////////////////////////////////////////////////////////////////////////////////

// Get all todos
app.route('/api/v1/todos').get( async (req, res) => {
    console.log('CALLED GET api/v1/todos');

    res.setHeader('Content-Type', 'application/json');

    postgresClient.connect( (err, client) => {
        if (err) {
            console.log('Could not connect to Postgres when getAllTodos: ' + err);

            res.send([]);
        } else {
            console.log('Postgres client connected when getAllTodos');

            client.query('SELECT title FROM todo', (error, todoRows) => {
                if (error) {
                    throw error;
                }
                todos = todoRows.rows; // [{"title":"Get kids from school"},{"title":"Take out the trash"},{"title":"Go shopping"}]

                console.log('Got todos from PostgreSQL database (' + todos.length + ')');

                res.send(todos);
            });
        }
    });
});


// Start the server ////////////////////////////////////////////////////////////////////////////////////////////////////
app.listen(port, () => {
    console.log('Todo Storage Service started!');
});

