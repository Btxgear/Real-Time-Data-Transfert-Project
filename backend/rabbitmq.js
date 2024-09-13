const amqp = require('amqplib');

const exchangeName = 'chat.fanout';
let channel = null;

// Fonction pour se connecter à RabbitMQ avec des tentatives de reconnexion
function connectToRabbitMQ(retries = 5, delay = 5000) {
    return amqp
        .connect(process.env.RABBITMQ_HOST || 'amqp://localhost')
        .then((conn) => conn.createChannel())
        .then((ch) => {
            channel = ch;
            console.log('Connected to RabbitMQ and channel created.');
            return channel.assertExchange(exchangeName, 'fanout', { durable: false });
        })
        .catch((err) => {
            console.error(`Failed to connect to RabbitMQ: ${err.message}`);
            if (retries > 0) {
                console.log(`Retrying in ${delay / 1000} seconds... (${retries} retries left)`);
                setTimeout(() => connectToRabbitMQ(retries - 1, delay), delay);
            } else {
                console.error('Could not connect to RabbitMQ after several attempts.');
            }
        });
}

function publishMessage(message) {
    if (channel) {
        channel.publish(exchangeName, '', Buffer.from(JSON.stringify(message)));
    } else {
        console.error('Channel is not available.');
    }
}

module.exports = { connectToRabbitMQ, publishMessage };