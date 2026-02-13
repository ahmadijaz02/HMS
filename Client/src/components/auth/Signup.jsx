import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
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
  RadioGroup,
  Radio,
  Stack,
  useToast,
  InputGroup,
  InputRightElement,
  IconButton,
  SimpleGrid,
  HStack,
  Badge,
  Link
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';

const Signup = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'patient',
    profile: {
      firstName: '',
      lastName: '',
      phoneNumber: '',
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('/auth/register', formData);
      if (response.data.success) {
        toast({
          title: 'Account created.',
          description: "We've created your account for you.",
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        navigate('/login');
      }
    } catch (error) {
      console.error('Signup Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });
      
      let errorMessage = 'Something went wrong';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.msg) {
        errorMessage = error.response.data.msg;
      } else if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.map(err => err.msg).join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg="gray.50" position="relative" overflow="hidden">
      <Box
        position="absolute"
        top="-120px"
        right="-120px"
        w="300px"
        h="300px"
        bg="purple.200"
        opacity={0.2}
        filter="blur(80px)"
        borderRadius="full"
      />
      <Container maxW="6xl" py={{ base: 12, md: 20 }} position="relative">
        <Stack direction={{ base: 'column', md: 'row' }} spacing={{ base: 10, md: 16 }} align="center">
          <VStack align="flex-start" spacing={5} flex="1">
            <Text fontSize="sm" letterSpacing="0.3em" color="gray.500">
              HOSPITAL MANAGEMENT SYSTEM
            </Text>
            <Heading fontFamily="'DM Serif Display', serif" fontSize={{ base: '3xl', md: '4xl' }}>
              NOVACARE HEALTH SYSTEM
            </Heading>
            <Text color="gray.600" fontSize="lg">
              Create a verified NovaCare profile to access appointments, records, and secure care messaging.
            </Text>
            <HStack spacing={3} flexWrap="wrap">
              <Badge colorScheme="teal" variant="subtle">Verified profiles</Badge>
              <Badge colorScheme="blue" variant="subtle">Care coordination</Badge>
              <Badge colorScheme="cyan" variant="subtle">Protected data</Badge>
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
                Create your NovaCare account
              </Heading>
              <Text color="gray.500" w="100%">
                Enter your details to request access to NovaCare.
              </Text>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="100%">
                <FormControl isRequired>
                  <FormLabel>Username</FormLabel>
                  <Input
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter username"
                    disabled={loading}
                    bg="gray.50"
                    borderColor="gray.200"
                    _focus={{ bg: 'white', borderColor: 'purple.400' }}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                    disabled={loading}
                    bg="gray.50"
                    borderColor="gray.200"
                    _focus={{ bg: 'white', borderColor: 'purple.400' }}
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <InputGroup>
                  <Input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    disabled={loading}
                    bg="gray.50"
                    borderColor="gray.200"
                    _focus={{ bg: 'white', borderColor: 'purple.400' }}
                  />
                  <InputRightElement>
                    <IconButton
                      icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      onClick={() => setShowPassword(!showPassword)}
                      variant="ghost"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="100%">
                <FormControl isRequired>
                  <FormLabel>First Name</FormLabel>
                  <Input
                    name="profile.firstName"
                    value={formData.profile.firstName}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    disabled={loading}
                    bg="gray.50"
                    borderColor="gray.200"
                    _focus={{ bg: 'white', borderColor: 'purple.400' }}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Last Name</FormLabel>
                  <Input
                    name="profile.lastName"
                    value={formData.profile.lastName}
                    onChange={handleChange}
                    placeholder="Enter last name"
                    disabled={loading}
                    bg="gray.50"
                    borderColor="gray.200"
                    _focus={{ bg: 'white', borderColor: 'purple.400' }}
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl isRequired>
                <FormLabel>Phone Number</FormLabel>
                <Input
                  name="profile.phoneNumber"
                  value={formData.profile.phoneNumber}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  disabled={loading}
                  bg="gray.50"
                  borderColor="gray.200"
                  _focus={{ bg: 'white', borderColor: 'purple.400' }}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Role</FormLabel>
                <RadioGroup name="role" value={formData.role} onChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                  <Stack direction="row">
                    <Radio value="patient">Patient</Radio>
                    <Radio value="doctor">Doctor</Radio>
                  </Stack>
                </RadioGroup>
              </FormControl>

              <Button 
                type="submit" 
                colorScheme="purple" 
                size="lg" 
                w="100%"
                isLoading={loading}
              >
                Create Account
              </Button>

              <Text textAlign="center" fontSize="sm">
                Already have an account?{' '}
                <Link as={RouterLink} to="/login" color="purple.500" fontWeight="semibold">
                  Login
                </Link>
              </Text>
            </VStack>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};

export default Signup; 