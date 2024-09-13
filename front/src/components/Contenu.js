import React, { useState, useEffect } from 'react';
import { VStack, Flex, Box, Text, Container, Button, Input, Textarea } from '@chakra-ui/react';
import useWebSocket from 'react-use-websocket';

function Contenu({ nom, isAdmin, userId, sendMessage, channels, setChannels }) {
    const [message, setMessage] = useState('');
    const [image, setImage] = useState(null);
    const [channel, setChannel] = useState('general');
    const [messagesByChannel, setMessagesByChannel] = useState({ general: [] });
    const [modalImage, setModalImage] = useState(null);
    const [newChannelName, setNewChannelName] = useState('');

    const handleSetMessage = (event) => {
        setMessage(event.target.value);
    };

    const handleSetImage = (event) => {
        setImage(event.target.files[0]);
    };

    const handleChannelChange = (newChannel) => {
        setChannel(newChannel);
        sendMessage(JSON.stringify({ type: 'switchChannel', channel: newChannel }));
    };

    const envoyer = () => {
        if (image) {
            envoyerImage();
        }
        if (message.trim()) {
            envoyerMessage();
        }
    };

    const envoyerMessage = () => {
        sendMessage(JSON.stringify({ type: 'message', username: nom, message: message.trim(), channel, userId }));
        setMessage('');
    };

    const envoyerImage = () => {
        if (image) {
            const reader = new FileReader();
            reader.onload = () => {
                sendMessage(JSON.stringify({ type: 'message', username: nom, image: reader.result, channel, userId }));
                setImage(null);
            };
            reader.readAsDataURL(image);
        }
    };

    const addChannel = () => {
        if (isAdmin && newChannelName.trim()) {
            sendMessage(JSON.stringify({ type: 'addChannel', channel: newChannelName.trim() }));
            setNewChannelName('');
        }
    };

    const openImageModal = (src) => {
        setModalImage(src);
    };

    const closeImageModal = () => {
        setModalImage(null);
    };

    const { lastMessage } = useWebSocket('ws://localhost:10101', {
        share: true,
        shouldReconnect: () => false,
    });

    useEffect(() => {
        if (lastMessage !== null) {
            try {
                const msg = JSON.parse(lastMessage.data);
                if (msg.type === 'message') {
                    setMessagesByChannel((prev) => {
                        const newMessages = { ...prev };
                        if (!newMessages[msg.channel]) {
                            newMessages[msg.channel] = [];
                        }
                        if (!newMessages[msg.channel].some(existingMsg => existingMsg.id === msg.id)) {
                            newMessages[msg.channel] = [...newMessages[msg.channel], msg];
                        }
                        return newMessages;
                    });
                } else if (msg.type === 'new_channel') {
                    setChannels((prev) => !prev.includes(msg.channel) ? [...prev, msg.channel] : prev);
                }
            } catch (error) {
                console.error("Erreur lors de l'analyse des données du message :", error);
            }
        }
    }, [lastMessage]);

    const messagesToDisplay = messagesByChannel[channel] || [];

    return (
        <div className="App">
            <header className="App-header">
                <h1>HiddeChat</h1>
                <Flex>
                    <VStack spacing={4} align="stretch" maxW="200px" border="1px solid #ddd" p={2} borderRadius="md" bg="white">
                        {channels.map((ch) => (
                            <Box key={ch} p={3} borderRadius="md" bg={channel === ch ? 'gray.200' : 'gray.100'} cursor="pointer" onClick={() => handleChannelChange(ch)}>
                                <Text fontWeight="bold">{ch}</Text>
                                {messagesByChannel[ch] && messagesByChannel[ch].length > 0 && (
                                    <Text fontSize="sm" fontWeight={messagesByChannel[ch][0]?.userId === userId ? 'normal' : 'bold'}>
                                        {messagesByChannel[ch][0]?.message || 'Image'}
                                    </Text>
                                )}
                            </Box>
                        ))}
                        {isAdmin && (
                            <Box p={2} borderRadius="md" bg="gray.100">
                                <Input placeholder="Nom du nouveau channel" value={newChannelName} onChange={(e) => setNewChannelName(e.target.value)} />
                                <Button onClick={addChannel}>Ajouter Channel</Button>
                            </Box>
                        )}
                    </VStack>

                    <Box flex="1" ml={4}>
                        <Box maxW="container.sm" minW="container.sm" my="50px" border="1px" borderRadius="md">
                            {messagesToDisplay.map((msg, index) => (
                                <div key={msg.id || index} className={`message-row ${msg.userId === userId ? 'user' : 'other'}`}>
                                    {msg.userId !== userId && <div className="avatar">{msg.username.charAt(0).toUpperCase()}</div>}
                                    <div className="message-block">
                                        {msg.message || (msg.image && <img src={msg.image} alt="sent" className="thumbnail" onClick={() => openImageModal(msg.image)} />)}
                                    </div>
                                    {msg.userId === userId && <div className="avatar">{msg.username.charAt(0).toUpperCase()}</div>}
                                </div>
                            ))}
                        </Box>
                        <Container maxW="container.sm">
                            <Flex>
                                <Textarea placeholder="Tapez quelque chose" value={message} onChange={handleSetMessage} />
                                <Button onClick={envoyer}>➤</Button>
                            </Flex>
                            <Flex mt={2} alignItems="center">
                                <Input type="file" accept="image/*" onChange={handleSetImage} />
                            </Flex>
                        </Container>
                    </Box>
                </Flex>
            </header>

            {modalImage && (
                <div className="modal" onClick={closeImageModal}>
                    <img src={modalImage} alt="enlarged" className="modal-image" />
                </div>
            )}
        </div>
    );
}

export default Contenu;
