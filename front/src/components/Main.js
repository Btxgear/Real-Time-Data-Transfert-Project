import { useState } from 'react';
import { HStack, Input, Button, Text } from '@chakra-ui/react';
import useWebSocket from 'react-use-websocket';
import Contenu from './Contenu';

function Main() {
    // Definition des variables utilisées
    const [nom, setNom] = useState('');
    const [isChatActive, setIsChatActive] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loginType, setLoginType] = useState('guest');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [channels, setChannels] = useState(['general']);
    const [userId, setUserId] = useState(null);

    // Set du nom sur la page d'auth
    const handleSetNom = (event) => {
        setNom(event.target.value);
    };

    // Au moment d'entrer sur le chat (après el click du bouton sur la page de connexion)
    const startChat = () => {
        // Gestion de l'authentification Admin/Invité
        if (loginType === 'admin' && username.trim() && password.trim()) {
            authenticate(username, password);
        } else if (loginType === 'guest' && nom.trim()) {
            setIsChatActive(true);
        } else {
            alert('Veuillez entrer un pseudonyme valide.');
        }
    };

    // Envoi au backEnd de la demande d'authentification
    const authenticate = (username, password) => {
        sendMessage(JSON.stringify({ type: 'auth', username, password }));
    };

    const { sendMessage } = useWebSocket('ws://localhost:10101', {
        onMessage: (message) => {
            const msg = JSON.parse(message.data);
            // Retour backend = succès d'authentification
            if (msg.type === 'auth_success') {
                setIsAuthenticated(true);
                setIsAdmin(msg.isAdmin);
                setUserId(msg.userId);
                setIsChatActive(true);
            // Retour BackEnd = authentification failure
            } else if (msg.type === 'auth_failed') {
                alert('Échec de l\'authentification');
            // Retour BackEnd = Création de channel
            } else if (msg.type === 'new_channel') {
                setChannels((prev) => [...prev, msg.channel]);
            // Retour backEnd = connexion utilisateur
            } else if (msg.type === 'user_connected') {
                setUserId(msg.userId);
            }
        },
    });

    const handleLoginTypeChange = (type) => {
        setLoginType(type);
        if (type === 'guest') {
            setUsername('');
            setPassword('');
        }
    };

    return isChatActive ? (
        <Contenu nom={nom} isAdmin={isAdmin} userId={userId} sendMessage={sendMessage} channels={channels} setChannels={setChannels} />
    ) : (
        <div className="App">
            <header className="App-header">
                <h1>Welcome to this Live Chat Project</h1>
                <HStack spacing={4}>
                    <Button onClick={() => handleLoginTypeChange('guest')}>Invité</Button>
                    <Button onClick={() => handleLoginTypeChange('admin')}>Admin</Button>
                </HStack>
                {loginType === 'admin' ? (
                    <>
                        <Input
                            maxW="200px"
                            placeholder="Nom d'utilisateur"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <Input
                            maxW="200px"
                            type="password"
                            placeholder="Mot de passe"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </>
                ) : (
                    <Input
                        maxW="200px"
                        placeholder="Choisissez un pseudonyme"
                        value={nom}
                        onChange={handleSetNom}
                    />
                )}
                <Button mt={4} onClick={startChat}>
                    Entrer dans le chat
                </Button>
            </header>
        </div>
    );
}

export default Main;
