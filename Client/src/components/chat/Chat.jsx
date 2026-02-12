import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    VStack,
    HStack,
    Input,
    Button,
    Text,
    Avatar,
    Flex,
    Divider,
    useToast,
    Badge,
    IconButton,
    Tooltip,
    Heading,
    Spinner,
} from '@chakra-ui/react';
import { FiSend, FiRefreshCw } from 'react-icons/fi';
import io from 'socket.io-client';
import axios from '../../utils/axios';

const SOCKET_URL = 'http://localhost:5000';

const Chat = ({ userType }) => {
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [socket, setSocket] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(true);
    const messagesEndRef = useRef(null);
    const processedMessages = useRef(new Set());
    const toast = useToast();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const initializeChat = async () => {
            try {
                setConnecting(true);
                const currentUser = JSON.parse(localStorage.getItem('user'));
                const token = localStorage.getItem('token');

                if (!currentUser || !token) {
                    console.error('Missing user data or token:', { currentUser, hasToken: !!token });
                    toast({
                        title: 'Authentication Error',
                        description: 'Please login again to continue.',
                        status: 'error',
                        duration: 5000,
                        isClosable: true,
                    });
                    return;
                }

                if (!currentUser.id || !currentUser.username || !currentUser.role) {
                    console.error('Invalid user data structure:', currentUser);
                    toast({
                        title: 'Error',
                        description: 'Invalid user data. Please login again.',
                        status: 'error',
                        duration: 5000,
                        isClosable: true,
                    });
                    return;
                }

                console.log('Initializing chat with user data:', {
                    id: currentUser.id,
                    username: currentUser.username,
                    role: currentUser.role
                });

                setUser(currentUser);

                const newSocket = io(SOCKET_URL, {
                    auth: { token },
                    query: {
                        userId: currentUser.id,
                        name: currentUser.username,
                        role: currentUser.role
                    },
                    transports: ['websocket'],
                    reconnection: true,
                    reconnectionAttempts: 5,
                    reconnectionDelay: 1000
                });

                const handleMessage = (newMessage) => {
                    const messageId = `${newMessage.userId}-${newMessage.timestamp}`;
                    if (!processedMessages.current.has(messageId)) {
                        processedMessages.current.add(messageId);
                        console.log('Processing new message:', newMessage);
                        setMessages(prev => [...prev, newMessage]);
                        scrollToBottom();
                    } else {
                        console.log('Duplicate message detected, skipping:', messageId);
                    }
                };

                const handleOnlineUsers = (users) => {
                    console.log('Received online users update:', users);
                    const filteredUsers = userType === 'doctor' 
                        ? users.filter(u => u.role === 'patient')
                        : users.filter(u => u.role === 'doctor');
                    setOnlineUsers(filteredUsers);
                };

                newSocket.on('connect', () => {
                    console.log('Socket connected, sending join event');
                    const userData = {
                        userId: currentUser.id,
                        name: currentUser.username,
                        role: currentUser.role
                    };
                    console.log('Join event data:', userData);
                    newSocket.emit('join', userData);
                    setConnecting(false);
                });

                newSocket.on('message', handleMessage);
                newSocket.on('updateOnlineUsers', handleOnlineUsers);
                newSocket.on('connect_error', (error) => {
                    console.error('Socket connection error:', error);
                    toast({
                        title: 'Connection Error',
                        description: 'Failed to connect to chat server. Please try again.',
                        status: 'error',
                        duration: 5000,
                        isClosable: true,
                    });
                    setConnecting(false);
                });

                setSocket(newSocket);
                await loadMessages();

                return () => {
                    console.log('Cleaning up socket connection and event listeners');
                    newSocket.off('message', handleMessage);
                    newSocket.off('updateOnlineUsers', handleOnlineUsers);
                    newSocket.close();
                };
            } catch (error) {
                console.error('Error initializing chat:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to initialize chat. Please refresh the page.',
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                });
            } finally {
                setConnecting(false);
            }
        };

        initializeChat();
    }, [userType, toast]);

    const loadMessages = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/chat/messages');
            if (response.data.success) {
                const filteredMessages = userType === 'doctor'
                    ? response.data.data.filter(msg => 
                        msg.role === 'patient' || msg.userId === user?._id
                    )
                    : response.data.data.filter(msg => 
                        msg.role === 'doctor' || msg.userId === user?._id
                    );
                setMessages(filteredMessages);
                scrollToBottom();
            }
        } catch (error) {
            console.error('Error loading messages:', error);
            toast({
                title: 'Error',
                description: 'Failed to load messages',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = () => {
        if (!message.trim() || !user || !socket) return;

        try {
            const timestamp = new Date().toISOString();
            const messageData = {
                userId: user.id,
                name: user.username,
                role: user.role,
                content: message.trim(),
                timestamp: timestamp,
            };

            // Add message immediately to the UI
            setMessages(prev => [...prev, messageData]);
            scrollToBottom();

            // Add to processed messages to prevent duplication when server responds
            const messageId = `${messageData.userId}-${messageData.timestamp}`;
            processedMessages.current.add(messageId);

            console.log('Sending message with data:', messageData);

            if (!messageData.userId || !messageData.name || !messageData.role) {
                console.error('Invalid message data:', messageData);
                toast({
                    title: 'Error',
                    description: 'Invalid user information. Please refresh the page.',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
                return;
            }

            // Emit the message to the server
            socket.emit('sendMessage', messageData, (error) => {
                if (error) {
                    console.error('Error sending message:', error);
                    // Remove the message from UI if server failed to process it
                    setMessages(prev => prev.filter(msg => 
                        !(msg.userId === messageData.userId && msg.timestamp === messageData.timestamp)
                    ));
                    processedMessages.current.delete(messageId);
                    toast({
                        title: 'Error',
                        description: 'Failed to send message. Please try again.',
                        status: 'error',
                        duration: 3000,
                        isClosable: true,
                    });
                }
            });

            setMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            toast({
                title: 'Error',
                description: 'Failed to send message. Please try again.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (connecting) {
        return (
            <Box height="100%" display="flex" alignItems="center" justifyContent="center">
                <VStack spacing={4}>
                    <Spinner size="xl" />
                    <Text>Connecting to chat...</Text>
                </VStack>
            </Box>
        );
    }

    return (
        <Box p={4} height="100%">
            <Flex height="100%">
                {/* Online Users Sidebar */}
                <Box
                    width="250px"
                    borderRight="1px"
                    borderColor="gray.200"
                    pr={4}
                    overflowY="auto"
                >
                    <VStack align="stretch" spacing={4}>
                        <Heading size="md">
                            {userType === 'doctor' ? 'Online Patients' : 'Online Doctors'}
                        </Heading>
                        <Divider />
                        {onlineUsers.map((onlineUser) => (
                            <HStack key={onlineUser.userId} spacing={3}>
                                <Avatar size="sm" name={onlineUser.name} />
                                <Box flex="1">
                                    <Text fontSize="sm" fontWeight="medium">
                                        {onlineUser.name}
                                    </Text>
                                    <Badge colorScheme={onlineUser.role === 'doctor' ? 'green' : 'blue'}>
                                        {onlineUser.role}
                                    </Badge>
                                </Box>
                            </HStack>
                        ))}
                        {onlineUsers.length === 0 && (
                            <Text color="gray.500" fontSize="sm">
                                No {userType === 'doctor' ? 'patients' : 'doctors'} online
                            </Text>
                        )}
                    </VStack>
                </Box>

                {/* Chat Area */}
                <Box flex="1" pl={4}>
                    <VStack height="100%" spacing={4}>
                        {/* Messages Container */}
                        <Box
                            flex="1"
                            width="100%"
                            overflowY="auto"
                            borderRadius="md"
                            bg="gray.50"
                            p={4}
                        >
                            <VStack align="stretch" spacing={4}>
                                {messages.map((msg, index) => (
                                    <Box
                                        key={index}
                                        alignSelf={msg.userId === user?.id ? "flex-end" : "flex-start"}
                                        maxW="70%"
                                    >
                                        <HStack spacing={2} mb={1}>
                                            <Avatar size="xs" name={msg.name} />
                                            <Text fontSize="sm" fontWeight="medium">
                                                {msg.name}
                                            </Text>
                                            <Badge colorScheme={msg.role === 'doctor' ? 'green' : 'blue'}>
                                                {msg.role}
                                            </Badge>
                                            <Text fontSize="xs" color="gray.500">
                                                {new Date(msg.timestamp).toLocaleTimeString()}
                                            </Text>
                                        </HStack>
                                        <Box
                                            bg={msg.userId === user?.id ? "blue.500" : "white"}
                                            color={msg.userId === user?.id ? "white" : "black"}
                                            p={3}
                                            borderRadius="lg"
                                            boxShadow="sm"
                                        >
                                            <Text>{msg.content}</Text>
                                        </Box>
                                    </Box>
                                ))}
                                <div ref={messagesEndRef} />
                            </VStack>
                        </Box>

                        {/* Message Input */}
                        <HStack width="100%">
                            <Input
                                flex="1"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your message..."
                                size="lg"
                            />
                            <Tooltip label="Send message">
                                <IconButton
                                    icon={<FiSend />}
                                    onClick={handleSendMessage}
                                    colorScheme="blue"
                                    size="lg"
                                />
                            </Tooltip>
                            <Tooltip label="Refresh messages">
                                <IconButton
                                    icon={<FiRefreshCw />}
                                    onClick={loadMessages}
                                    size="lg"
                                    isLoading={loading}
                                />
                            </Tooltip>
                        </HStack>
                    </VStack>
                </Box>
            </Flex>
        </Box>
    );
};

export default Chat; 