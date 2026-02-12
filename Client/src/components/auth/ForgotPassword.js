import React, { useState, useEffect } from 'react';
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
    useToast,
    Link,
    Alert,
    AlertIcon
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [notificationEmail, setNotificationEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const toast = useToast();
    const location = useLocation();
    const navigate = useNavigate();

    // Get the email from login form if available
    useEffect(() => {
        const loginEmail = localStorage.getItem('loginEmail');
        if (loginEmail) {
            setEmail(loginEmail);
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        if (!email) {
            setError('Please enter the email address you used to log in');
            setLoading(false);
            return;
        }

        if (!notificationEmail) {
            setError('Please enter an email address to receive the reset instructions');
            setLoading(false);
            return;
        }
        
        try {
            const response = await axios.post('/auth/forgotpassword', { 
                accountEmail: email,
                notificationEmail: notificationEmail 
            });
            
            if (response.data.success) {
                setSuccess(true);
                toast({
                    title: 'Success',
                    description: 'Password reset instructions have been sent to your email',
                    status: 'success',
                    duration: 5000,
                    isClosable: true,
                });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred');
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

    return (
        <Container maxW="container.sm" py={8}>
            <VStack spacing={8}>
                <Heading>Forgot Password</Heading>
                <Box w="100%" p={8} borderWidth={1} borderRadius={8} boxShadow="lg">
                    {!success ? (
                        <VStack spacing={4} as="form" onSubmit={handleSubmit}>
                            <Text>
                                Enter your account email and the email where you want to receive reset instructions.
                            </Text>

                            {error && (
                                <Alert status="error">
                                    <AlertIcon />
                                    {error}
                                </Alert>
                            )}

                            <FormControl isRequired>
                                <FormLabel>Account Email (Used for Login)</FormLabel>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                    placeholder="Enter the email you use to log in"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Notification Email</FormLabel>
                                <Input
                                    type="email"
                                    value={notificationEmail}
                                    onChange={(e) => setNotificationEmail(e.target.value)}
                                    disabled={loading}
                                    placeholder="Enter email to receive reset instructions"
                                />
                            </FormControl>

                            <Button
                                type="submit"
                                colorScheme="blue"
                                width="100%"
                                isLoading={loading}
                            >
                                Send Reset Instructions
                            </Button>

                            <Text>
                                Remember your password?{' '}
                                <Link as={RouterLink} to="/login" color="blue.500">
                                    Back to Login
                                </Link>
                            </Text>
                        </VStack>
                    ) : (
                        <VStack spacing={4}>
                            <Text>
                                Password reset instructions have been sent to {notificationEmail}.
                                Please check your inbox and follow the instructions to reset your password.
                            </Text>
                            <Button
                                as={RouterLink}
                                to="/login"
                                colorScheme="blue"
                                width="100%"
                            >
                                Back to Login
                            </Button>
                        </VStack>
                    )}
                </Box>
            </VStack>
        </Container>
    );
};

export default ForgotPassword;
