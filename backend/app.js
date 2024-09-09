const WebSocket = require('ws');


const wss = new WebSocket.WebSocketServer(
    { 
        port: 10101,
        skipUTF8Validation: true
    }
    );

const exchangeName = 'amq.fanout'

// Maak een verbinding
var open = require('amqplib').connect('amqp://localhost');

var channel = null

console.log("Starting websocket server at port 6667")

open.then(function(conn){
    return conn.createChannel();
}).then(function(ch) {
    channel = ch
})

// Nieuwe client van de chat app
wss.on('connection', function connection(ws) {
  // genereer een willekeurig ID voor de queue
  const rand = Math.random() * 100000000
  ws.id = rand
  // Dit stuk regelt de POST van de gebruiker
  ws.on('message', function message(data) {
      // Bericht komt binnen van de gebruiker om naar iedereen te sturen
    console.log('received: %s (%i)\n', data, ws.id);
    channel.publish(exchangeName, '', data)
  });

  // Dit stuk regelt het terugsturen van berichten naar de client
  if(channel !== null) {
      // Creeer een queue als een nieuwe client aanmeld
    const queueName = `chat-client-${ws.id}`
    channel.assertQueue(queueName, {
        autoDelete: true,
        durable: false
    }).then((ok) => {
        // Bind de queue aan de exchange
        channel.bindQueue(queueName, exchangeName, '')
    }).then((ok) => {
        // Maak een functie die aangeroepen wordt als we een bericht consumeren uit de queue
        channel.consume(queueName, (message) => {
            ws.send(JSON.stringify(JSON.parse(message.content)))
        })
    })
  }
  console.log(`connection started with ID ${ws.id}`)
});
