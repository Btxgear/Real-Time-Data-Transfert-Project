const WebSocket = require('ws');

// Use environment variable for RabbitMQ host, default to 'amqp://localhost' if not set
const rabbitmqHost = process.env.RABBITMQ_HOST || 'amqp://localhost';

const wss = new WebSocket.WebSocketServer({
    port: 10101,
    skipUTF8Validation: true,
});

const exchangeName = 'amq.fanout';

let channel = null;

// Function to connect to RabbitMQ with retries
function connectToRabbitMQ(retries = 5, delay = 5000) {
    require('amqplib')
        .connect(rabbitmqHost)
        .then((conn) => conn.createChannel())
        .then((ch) => {
            channel = ch;
            console.log('Connected to RabbitMQ and channel created.');
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

console.log('Starting websocket server at port 10101');

// Start the RabbitMQ connection with retries
connectToRabbitMQ();

// Handle new client connections to the WebSocket server
wss.on('connection', function connection(ws) {
    // Generate a random ID for the queue
    const rand = Math.random() * 100000000;
    ws.id = rand;
    console.log(`Connection started with ID ${ws.id}`);

    // Handle messages sent from the client
    ws.on('message', function message(data) {
        console.log('Received: %s (%i)', data, ws.id);
        if (channel) {
            channel.publish(exchangeName, '', Buffer.from(data)); // Publish message to the RabbitMQ exchange
        } else {
            console.error('Channel is not available.');
        }
    });

    // Handle sending messages back to the client
    if (channel !== null) {
        const queueName = `chat-client-${ws.id}`;
        channel
            .assertQueue(queueName, {
                autoDelete: true,
                durable: false,
            })
            .then((ok) => {
                // Bind the queue to the exchange
                return channel.bindQueue(queueName, exchangeName, '');
            })
            .then((ok) => {
                // Consume messages from the queue and send them to the client
                return channel.consume(queueName, (message) => {
                    ws.send(JSON.stringify(JSON.parse(message.content)));
                });
            })
            .catch((err) => {
                console.error('Failed to set up queue:', err);
            });
    } else {
        console.error('Channel is not available for setting up the queue.');
    }
});
