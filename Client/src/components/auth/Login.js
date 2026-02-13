import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import {
    Box,
    Button,
    Container,
    FormControl,
    FormLabel,
    Input,
    VStack,
    Heading,
    Text,
    Divider,
    useToast,
    Center,
    Link,
    Stack,
    HStack,
    Badge
} from '@chakra-ui/react';
import axios from '../../utils/axios';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const toast = useToast();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleLoginSuccess = (data) => {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', data.user.role);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Redirect based on user role
        switch (data.user.role.toLowerCase()) {
            case 'admin':
                navigate('/admin/dashboard');
                break;
            case 'doctor':
                navigate('/doctor/dashboard');
                break;
            case 'patient':
                navigate('/patient/dashboard');
                break;
            default:
                navigate('/login');
                toast({
                    title: 'Error',
                    description: 'Invalid user role',
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const response = await axios.post('/auth/login', formData);
            if (response.data.success) {
                handleLoginSuccess(response.data);
            } else {
                throw new Error(response.data.message || 'Login failed');
            }
        } catch (err) {
            toast({
                title: 'Error',
                description: err.response?.data?.message || 'An error occurred',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            setLoading(true);
            
            if (!credentialResponse?.credential) {
                throw new Error('No credential received from Google');
            }

            const response = await axios.post('/auth/google', {
                credential: credentialResponse.credential
            });

            if (response.data.success) {
                handleLoginSuccess(response.data);
            } else {
                throw new Error('Login failed');
            }
        } catch (err) {
            toast({
                title: 'Error',
                description: err.message || 'Failed to authenticate with Google',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        toast({
            title: 'Error',
            description: 'Google Sign-In was unsuccessful',
            status: 'error',
            duration: 5000,
            isClosable: true,
        });
    };

    return (
        <Box minH="100vh" bg="gray.50" position="relative" overflow="hidden">
            <Box
                position="absolute"
                top="-120px"
                left="-120px"
                w="280px"
                h="280px"
                bg="teal.200"
                opacity={0.25}
                filter="blur(80px)"
                borderRadius="full"
            />
            <Box
                position="absolute"
                bottom="-140px"
                right="-140px"
                w="320px"
                h="320px"
                bg="blue.200"
                opacity={0.25}
                filter="blur(80px)"
                borderRadius="full"
            />
            <Container maxW="6xl" py={{ base: 12, md: 20 }} position="relative">
                <Stack direction={{ base: 'column', md: 'row' }} spacing={{ base: 10, md: 16 }} align="center">
                    <VStack align="flex-start" spacing={5} flex="1">
                        <Text fontSize="sm" letterSpacing="0.3em" color="gray.500">
                            HOSPITAL MANAGEMENT SYSTEM
                        </Text>
                        <Heading
                            fontFamily="'DM Serif Display', serif"
                            fontSize={{ base: '3xl', md: '4xl' }}
                            lineHeight="short"
                        >
                            NOVACARE HEALTH SYSTEM
                        </Heading>
                        <Text color="gray.600" fontSize="lg">
                            Secure access for patients, clinicians, and hospital staff across the NovaCare network.
                        </Text>
                        <HStack spacing={3} flexWrap="wrap">
                            <Badge colorScheme="teal" variant="subtle">HIPAA-ready workflows</Badge>
                            <Badge colorScheme="blue" variant="subtle">Realtime care updates</Badge>
                            <Badge colorScheme="cyan" variant="subtle">Protected messaging</Badge>
                        </HStack>
                    </VStack>

                    <Box
                        flex="1"
                        w="100%"
                        p={{ base: 6, md: 8 }}
                        bg="white"
                        borderRadius="2xl"
                        boxShadow="2xl"
                        borderWidth="1px"
                        borderColor="gray.100"
                    >
                        <VStack spacing={4} as="form" onSubmit={handleSubmit}>
                            <Heading size="md" w="100%">
                                Sign in to NovaCare
                            </Heading>
                            <Text color="gray.500" w="100%">
                                Use your NovaCare credentials to continue.
                            </Text>

                            <FormControl isRequired>
                                <FormLabel>Email Address</FormLabel>
                                <Input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={loading}
                                    bg="gray.50"
                                    borderColor="gray.200"
                                    _focus={{ bg: 'white', borderColor: 'teal.400' }}
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Password</FormLabel>
                                <Input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    disabled={loading}
                                    bg="gray.50"
                                    borderColor="gray.200"
                                    _focus={{ bg: 'white', borderColor: 'teal.400' }}
                                />
                            </FormControl>

                            <Text align="right" w="100%" fontSize="sm">
                                <Link 
                                    as={RouterLink} 
                                    to="/forgot-password" 
                                    color="teal.500"
                                    onClick={() => {
                                        if (formData.email) {
                                            localStorage.setItem('loginEmail', formData.email);
                                        }
                                    }}
                                >
                                    Forgot Password?
                                </Link>
                            </Text>

                            <Button
                                type="submit"
                                colorScheme="teal"
                                width="100%"
                                size="lg"
                                isLoading={loading}
                            >
                                Sign In
                            </Button>

                            <Text fontSize="sm">
                                Don&apos;t have an account?{' '}
                                <Link as={RouterLink} to="/signup" color="teal.500" fontWeight="semibold">
                                    Sign Up
                                </Link>
                            </Text>
                        </VStack>

                        <Divider my={6} />

                        <Center>
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                useOneTap
                                disabled={loading}
                            />
                        </Center>
                    </Box>
                </Stack>
            </Container>
        </Box>
    );
};

export default Login; 