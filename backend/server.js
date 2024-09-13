const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const { connectToRabbitMQ, publishMessage } = require('./rabbitmq');

const wss = new WebSocket.WebSocketServer({
    port: 10101,
    skipUTF8Validation: true,
});

console.log('Starting websocket server at port 10101');

// Démarrer la connexion à RabbitMQ
connectToRabbitMQ();

wss.on('connection', function connection(ws) {
    ws.id = uuidv4();
    ws.channel = 'general';
    ws.isAdmin = false;
    console.log(`Connection started with ID ${ws.id}`);

    ws.send(JSON.stringify({ type: 'user_connected', userId: ws.id }));

    ws.on('message', function message(data) {
        const parsedData = JSON.parse(data);

        if (parsedData.type === 'auth') {
            if (parsedData.username === 'admin' && parsedData.password === 'root') {
                ws.isAdmin = true;
                ws.send(JSON.stringify({ type: 'auth_success', isAdmin: true, userId: ws.id }));
            } else {
                ws.send(JSON.stringify({ type: 'auth_failed' }));
            }
        }

        else if (parsedData.type === 'switchChannel') {
            ws.channel = parsedData.channel;
            console.log(`User ${ws.id} switched to channel ${ws.channel}`);
        }

        else if (parsedData.type === 'addChannel' && ws.isAdmin) {
            const newChannel = parsedData.channel;
            broadcast({ type: 'new_channel', channel: newChannel });
        }

        else if (parsedData.type === 'message') {
            const messageWithId = {
                ...parsedData,
                id: uuidv4(),
                userId: ws.id,
            };

            console.log(`Message received for channel ${parsedData.channel}: ${parsedData.message}`);
            publishMessage(messageWithId);
            broadcast(messageWithId);
        }
    });

    function broadcast(data) {
        wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    }
});