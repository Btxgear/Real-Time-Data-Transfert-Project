import logo from './logo.svg';
import './App.css';
import { ChakraProvider } from '@chakra-ui/react';
import { Textarea, Container, Flex, Button, Box, Input } from '@chakra-ui/react';
import React, { useState } from 'react';
import useWebSocket from 'react-use-websocket';

function App() {
  return (
      <ChakraProvider>
        <Main />
      </ChakraProvider>
  );
}

export default App;

function Main() {
  const [nom, setNom] = useState('');
  const [isChatActive, setIsChatActive] = useState(false);

  const handleSetNom = (event) => {
    setNom(event.target.value);
  };

  const startChat = () => {
    if (nom.trim()) {
      setIsChatActive(true);
    } else {
      alert('Veuillez entrer un pseudonyme valide.');
    }
  };

  return isChatActive ? (
      <Contenu nom={nom} />
  ) : (
      <div className="App">
        <header className="App-header">
          <h1>Bienvenue sur HiddeChat</h1>
          <Input
              maxW="200px"
              placeholder="Choisissez un pseudonyme"
              value={nom}
              onChange={handleSetNom}
          />
          <Button mt={4} onClick={startChat}>
            Entrer dans le chat
          </Button>
        </header>
      </div>
  );
}

function Contenu({ nom }) {
  const [message, setMessage] = useState('');
  const [image, setImage] = useState(null);
  const [historiqueMessages, setHistoriqueMessages] = useState([]);
  const [modalImage, setModalImage] = useState(null); // State for modal image

  const handleSetMessage = (event) => {
    setMessage(event.target.value);
  };

  const handleSetImage = (event) => {
    setImage(event.target.files[0]);
  };

  const { sendMessage } = useWebSocket('ws://localhost:10101', {
    onMessage: (message) => {
      const msg = JSON.parse(message.data);
      setHistoriqueMessages((prev) => [...prev, msg]);
    }
  });

  const envoyer = () => {
    if (image) {
      envoyerImage();
    }
    if (message.trim()) {
      envoyerMessage();
    }
  };

  const envoyerMessage = () => {
    sendMessage(JSON.stringify({ username: nom, message: message.trim() }));
    setMessage(''); // Clear the message after sending
  };

  const envoyerImage = () => {
    if (image) {
      const reader = new FileReader();
      reader.onload = () => {
        sendMessage(JSON.stringify({ username: nom, image: reader.result }));
        setImage(null); // Clear the image after sending
      };
      reader.readAsDataURL(image);
    }
  };

  const openImageModal = (src) => {
    setModalImage(src);
  };

  const closeImageModal = () => {
    setModalImage(null);
  };

  return (
      <div className="App">
        <header className="App-header">
          <h1>HiddeChat</h1>
          <Box maxW="container.sm" minW="container.sm" my="50px" border="1px" borderRadius="md">
            {historiqueMessages.map((msg, index) => (
                <div
                    key={index}
                    className={`message-row ${msg.username === nom ? 'user' : 'other'}`}
                >
                  {msg.username !== nom && (
                      <div className="avatar">{msg.username.charAt(0).toUpperCase()}</div>
                  )}
                  <div className="message-block">
                    {msg.message ? msg.message : null}
                    {msg.image ? (
                        <img
                            src={msg.image}
                            alt="sent"
                            className="thumbnail"
                            onClick={() => openImageModal(msg.image)}
                        />
                    ) : null}
                  </div>
                  {msg.username === nom && (
                      <div className="avatar">{msg.username.charAt(0).toUpperCase()}</div>
                  )}
                </div>
            ))}
          </Box>
          <Container maxW="container.sm">
            <Flex>
              <Textarea
                  placeholder="Tapez quelque chose"
                  value={message}
                  onChange={handleSetMessage}
              />
              <Button onClick={envoyer}>➤</Button>
            </Flex>
            <Flex mt={2} alignItems="center">
              <Input type="file" accept="image/*" onChange={handleSetImage} />
            </Flex>
          </Container>
        </header>

        {/* Modal for Enlarged Image */}
        {modalImage && (
            <div className="modal" onClick={closeImageModal}>
              <img src={modalImage} alt="enlarged" className="modal-image" />
            </div>
        )}
      </div>
  );
}
