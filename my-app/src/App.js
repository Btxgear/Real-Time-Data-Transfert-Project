import logo from './logo.svg';
import './App.css';
import { ChakraProvider } from '@chakra-ui/react'
import { Textarea, Container, Flex, Button, Box, Input } from '@chakra-ui/react'
import React, { useEffect, useState } from 'react';

import useWebSocket, { ReadyState } from 'react-use-websocket';

import {
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  TableCaption,
} from '@chakra-ui/react'


function App() {
  return (
    <ChakraProvider>
       <Content />
    </ChakraProvider>
  );
}

export default App;


function Content() {
  const [bericht, setBericht] = React.useState('')
  const handleSetBericht = (event) => {
    setBericht(event.target.value)
  }
  const [naam, setNaam] = React.useState('TestMan')
  const handleSetNaam = (event) => {
    setNaam(event.target.value)
  }

  const [messageLog, setMessageLog] = React.useState([])


  const {
    sendMessage,
    lastMessage,
    readyState,
  } = useWebSocket('ws://localhost:10101', {
    onMessage: (message) => {
      const msg = JSON.parse(message.data)
      var history = messageLog
      history.push(msg)
      setMessageLog(history)
    }
  })


  const sendMessageToEveryone = () => {
    sendMessage(JSON.stringify({username: naam, bericht: bericht}))
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>
          HiddeChat
        </h1>
        <Input maxW='200px' placeholder='Naam' value={naam} onChange={handleSetNaam} />
        <Box  maxW='container.sm' minW='container.sm' my='50px' border='1px' borderRadius='md'>
          
        <Table fontSize='18px' variant='striped' colorScheme='black'>
          <Thead>
            <Tr>
              <Th>Van</Th>
              <Th>Bericht</Th>
            </Tr>
          </Thead>
          <Tbody>
            {messageLog.map((message, index) => 
            <Tr key={index}>
              <Td>{message.username}</Td>
              <Td>{message.bericht}</Td>
            </Tr>)
            }
          </Tbody>
        </Table>
        </Box>
        <Container maxW='container.sm'>
          <Flex>
            <Textarea 
              placeholder='Type iets'
              value={bericht}
              onChange={handleSetBericht}
            />
            <Button onClick={() => sendMessageToEveryone()}>
              Verstuur
            </Button>
          </Flex>
        </Container>
      </header>
    </div>
  )
}
