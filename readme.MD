# Système de Messagerie avec RabbitMQ

## Table des matières

1. [Introduction](#introduction)
2. [Architecture du Système](#architecture-du-système)
   - [Composants Principaux](#composants-principaux)
   - [Flux de Messages](#flux-de-messages)
3. [Démo de Fonctionnement](#démo-de-fonctionnement)
   - [Pré-requis](#pré-requis)
   - [Instructions de Démarrage](#instructions-de-démarrage)
   - [Accès](#accès)
   - [Scénarios](#scénarios)

## Introduction

Ce projet implémente un système de messagerie asynchrone utilisant RabbitMQ pour gérer la communication entre les producteurs et les consommateurs. Il est conçu pour illustrer les concepts de routage de messages, de gestion de files d'attente et de sécurité dans un système distribué.<br>
Le projet est monitoré au niveau backend pour avoir une vision globale de l'utilisation des performances et du nombre de connexion actives, une petite fenêtre résumant ces données s'affiche toutes les 10 secondes dans les logs du serveur.

## Architecture du Système

### Composants Principaux

L'architecture du système se compose des éléments suivants :

1. **RabbitMQ** : 
   - Le broker de messages qui gère la transmission et le routage des messages entre les producteurs et les consommateurs.
   - Exposé sur les ports `15672` pour l'interface de gestion et `5672` pour la messagerie.

2. **Backend** : 
   - Un serveur Node.js qui agit comme producteur et consommateur de messages.
   - Utilise WebSocket pour la communication temps réel entre les clients et le serveur.
   - Gère l'authentification des utilisateurs et le routage des messages vers les canaux appropriés via RabbitMQ.

3. **Frontend** :
   - Une application React qui sert d'interface utilisateur.
   - Permet aux utilisateurs de se connecter en tant qu'admin ou invité.
   - Affiche les messages reçus, permet d'envoyer des messages et de créer de nouveaux canaux (pour les administrateurs).

### Flux de Messages

Le flux de messages dans le système se déroule comme suit :

1. **Connexion de l'Utilisateur** :
   - L'utilisateur se connecte via le frontend en choisissant un rôle (admin ou invité).
   - Le frontend utilise WebSocket pour établir une connexion avec le backend.

2. **Authentification et Configuration Initiale** :
   - Si l'utilisateur est un admin, il est authentifié par le backend.
   - Le backend génère un `userId` unique pour chaque utilisateur et l'envoie au frontend.

3. **Communication via RabbitMQ** :
   - Lorsqu'un utilisateur envoie un message via le frontend, celui-ci est transmis au backend par WebSocket.
   - Le backend route ensuite le message vers RabbitMQ, où il est publié dans un échange de type `fanout`.
   - Les messages sont ensuite consommés par le backend et envoyés aux utilisateurs connectés appropriés.

4. **Gestion des Canaux et Utilisateurs** :
   - Les administrateurs peuvent créer de nouveaux canaux, et tous les utilisateurs sont notifiés en temps réel.
   - Les utilisateurs peuvent rejoindre ou quitter des canaux et les messages sont filtrés en fonction du canal actif.

## Démo de Fonctionnement

### Pré-requis

Docker et Docker compose sont nécéssaire au bon fonctionnement de ce chat

### Instructions de Démarrage

- ``docker-compose build``
- ``docker-compose up``

les deux commandes doivent être lancée depuis le root du projet (où est présent le docker-compose)

### Accès

http://localhost:3000

- Se connecter en tant qu'admin :
  - usr: admin
  - pwd: root
  - Création de channel possible
  - Accès aux chats généré après s'être connecté

- Se connecter en tant que guest
  - Accès au chat général + ceux ouvert par les admins (APRES s'être connecté)
  - Gestion d'envoi d'image

# Scénarios

## Scénario 1 : Création d'un Canal par un Administrateur

### Description :
Un administrateur se connecte au système, crée un nouveau canal, et tous les utilisateurs connectés reçoivent une notification du nouveau canal.

### Étapes :
1. L'administrateur ouvre le navigateur et accède à l'application à [http://localhost:3000](http://localhost:3000).
2. Il clique sur le bouton **Admin** et entre les informations de connexion :
   - **Nom d'utilisateur** : `admin`
   - **Mot de passe** : `root`
3. Après une authentification réussie, l'interface de chat s'ouvre.
4. L'administrateur saisit le nom d'un nouveau canal, par exemple **"Développement"**, dans le champ "Nom du nouveau channel".
5. L'administrateur clique sur **Ajouter Channel**.
6. Le nouveau canal **"Développement"** apparaît dans la liste des canaux pour tous les utilisateurs connectés.
7. Les utilisateurs déjà connectés peuvent maintenant rejoindre et discuter dans le nouveau canal créé par l'administrateur.

## Scénario 2 : Envoi de Messages dans un Canal

### Description :
Un utilisateur invité envoie un message dans un canal spécifique, et le message est reçu par tous les utilisateurs connectés au même canal.

### Étapes :
1. L'utilisateur invité ouvre le navigateur et accède à l'application à [http://localhost:3000](http://localhost:3000).
2. Il clique sur le bouton **Invité** et choisit un pseudonyme, par exemple **"Jean"**.
3. L'utilisateur entre dans le chat et rejoint le canal par défaut **"general"**.
4. L'utilisateur saisit un message, par exemple **"Bonjour à tous !"**, dans le champ de texte et clique sur le bouton d'envoi.
5. Tous les utilisateurs actuellement dans le canal **"general"** reçoivent immédiatement le message **"Jean : Bonjour à tous !"**.
6. Si l'utilisateur change de canal (par exemple vers **"Développement"**), il ne reçoit que les messages de ce canal, et les autres messages sont filtrés.

