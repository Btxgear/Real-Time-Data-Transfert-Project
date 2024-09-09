# Demo chat app for RabbitMQ in React/Node

In this repository is a setup to create a very simple chat app using RabbitMQ with a fanout exchange to facilitate a chat app. Clients create a queue and bind it to the default fanout exchange on 

## Architecture

Architecture is very simple, it doesn't even deserve the term here. The frontend talks to the backend over a websocket. On connection the backend generates a random ID for the client (it is not guaranteed unique, but will do for our purpose). This ID is used to create a queue (autoDelete=on will remove the queue after the node app quits) that, on consumption, writes the message to the websocket so the frontend can update its messages. The frontend can send a message and change the user's name. If it sends a message it will send it over the websocket to the backend which will publish it to the fanout exchange. 

## Setup

Run the following to set up a RabbitMQ instance with docker:

`docker run -d --hostname my-rabbit --name some-rabbit -p 8080:15672 -p 5672:5672 rabbitmq:3.13-management`

Note that both the RabbitMQ port is exposed as well as the admin interface.

Run the backend via `node server/app.js`. Run the frontend via `npm start` from the my-app folder.
You may need to edit the connection string in the `server/app.js` folder for your connection (think authorization if you don't use a default guest:guest login)
