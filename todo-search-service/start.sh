#!/bin/bash

while ! curl http://todo-elastic:9200; do sleep 1; done;

npm start
