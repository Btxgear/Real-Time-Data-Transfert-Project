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
    // Attribution d'un uuid à la session connectée
    ws.id = uuidv4();
    // Channel de base general
    ws.channel = 'general';
    ws.isAdmin = false;
    console.log(`Connection started with ID ${ws.id}`);

    ws.send(JSON.stringify({ type: 'user_connected', userId: ws.id }));

    ws.on('message', function message(data) {
        const parsedData = JSON.parse(data);

        // Data de type = Authentification (onglet admin sur la page de connexion)
        if (parsedData.type === 'auth') {
            // Vérification des crédentials
            if (parsedData.username === 'admin' && parsedData.password === 'root') {
                ws.isAdmin = true;
                ws.send(JSON.stringify({ type: 'auth_success', isAdmin: true, userId: ws.id }));
            } else {
                ws.send(JSON.stringify({ type: 'auth_failed' }));
            }
        }

        // Data de type = Changement de channel
        else if (parsedData.type === 'switchChannel') {
            // Changement de channel
            ws.channel = parsedData.channel;
            console.log(`User ${ws.id} switched to channel ${ws.channel}`);
        }

        // Data de type = ajout de Channel (Seulement utilisable par les admins)
        else if (parsedData.type === 'addChannel' && ws.isAdmin) {
            const newChannel = parsedData.channel;
            // Ajout d'un channel en broadcast pour permettre à tout les utilisateurs connectés d'y avoir accès
            broadcast({ type: 'new_channel', channel: newChannel });
        }

        // Data de type = messages
        else if (parsedData.type === 'message') {
            const messageWithId = {
                ...parsedData,
                id: uuidv4(),
                userId: ws.id,
            };

            console.log(`Message received for channel ${parsedData.channel}: ${parsedData.message}`);
            // Envoi du message en broadcast sur tout les utilisateurs peu importe le channel pour permettre le chargement
            // de messages dans les channels non ouvert par l'utilisateur
            publishMessage(messageWithId);
            broadcast(messageWithId);
        }
    });

    function broadcast(data) {
        // Envoie la data à tout les clients connectés
        wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    }
});