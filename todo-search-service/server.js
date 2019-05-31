const express = require('express');
const bodyParser = require('body-parser');
const elasticsearch = require('elasticsearch');
const envProps = require('./env_props');

/////// Test curl /////////////////////////////////////////////////////////////////////////
// curl --data "searchText=kids" http://localhost:3002/api/v1/search
///////////////////////////////////////////////////////////////////////////////////////////

// Initializing the Express Framework //////////////////////////////////////////////////////////////////////////////////
const app = express();
const port = 3000;
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true
    })
);

// Elasticsearch Client Setup //////////////////////////////////////////////////////////////////////////////////////////
const elasticClient = new elasticsearch.Client({
    // hosts: [ envProps.elasticHost + ':' + envProps.elasticPort]
    hosts: [ envProps.elasticHost ]
});
// Ping the client to be sure Elastic is up
elasticClient.ping({
    requestTimeout: 30000,
}, function(error) {
    if (error) {
        console.error('Something went wrong with Elasticsearch: ' + error);
    } else {
        console.log('Elasticsearch client connected');
    }
});

// Set up the API routes ///////////////////////////////////////////////////////////////////////////////////////////////

const TODO_SEARCH_INDEX_NAME = "todos";
const TODO_SEARCH_INDEX_TYPE = "todo";

// Search all todos
app.route('/api/v1/search').post((req, res) => {
    const searchText = req.body.searchText;

    console.log('CALLED POST api/v1/search with searchText=' + searchText);

    // Perform the actual search passing in the index, the search query and the type
    elasticClient.search({
        index: TODO_SEARCH_INDEX_NAME,
        type: TODO_SEARCH_INDEX_TYPE,
        body: {
            query: {
                match: {
                    todotext: searchText
                }
            }
        }
    })
    .then(results => {
        console.log('Search for "' + searchText + '" matched (' + results.hits.hits.length + ')');
        res.send(results.hits.hits);
    })
    .catch(err => {
        console.log(err);
        res.send([]);
    });
});


// Start the server ////////////////////////////////////////////////////////////////////////////////////////////////////
app.listen(port, () => {
    console.log('Todo Search Service started!');
});

