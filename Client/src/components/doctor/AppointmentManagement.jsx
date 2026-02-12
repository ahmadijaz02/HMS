import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  useDisclosure,
  HStack,
  VStack,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  Card,
  CardHeader,
  CardBody,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  Flex,
  Divider,
  SimpleGrid
} from '@chakra-ui/react';
import { FaCalendarAlt, FaClock, FaUser, FaNotesMedical, FaSync, FaCalendarCheck, FaCheckCircle, FaBan } from 'react-icons/fa';
import Layout from '../shared/Layout';
import axios from '../../utils/axios';

const AppointmentManagement = () => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allAppointments, setAllAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState(0);

  // Get total appointments count
  const getTotalAppointments = () => {
    return allAppointments.length;
  };

  // Get today's appointments
  const getTodayAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    return allAppointments.filter(apt => 
      new Date(apt.date).toISOString().split('T')[0] === today &&
      apt.status.toLowerCase() === 'scheduled'
    ).length;
  };

  // Get completed appointments
  const getCompletedAppointments = () => {
    return allAppointments.filter(apt => 
      apt.status.toLowerCase() === 'completed'
    ).length;
  };

  // Get upcoming appointments
  const getUpcomingAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    return allAppointments.filter(apt => 
      new Date(apt.date).toISOString().split('T')[0] > today &&
      apt.status.toLowerCase() === 'scheduled'
    ).length;
  };

  // Get cancelled appointments
  const getCancelledAppointments = () => {
    return allAppointments.filter(apt => 
      apt.status.toLowerCase() === 'cancelled'
    ).length;
  };

  // Filter appointments based on tab
  const filterAppointments = (type) => {
    const today = new Date().toISOString().split('T')[0];
    let filtered = [];

    switch(type) {
      case 'today':
        filtered = allAppointments.filter(apt => 
          new Date(apt.date).toISOString().split('T')[0] === today
        );
        break;
      case 'upcoming':
        filtered = allAppointments.filter(apt => 
          new Date(apt.date).toISOString().split('T')[0] > today &&
          apt.status.toLowerCase() === 'scheduled'
        );
        break;
      case 'past':
        filtered = allAppointments.filter(apt => 
          new Date(apt.date).toISOString().split('T')[0] < today ||
          apt.status.toLowerCase() === 'completed'
        );
        break;
      default:
        filtered = allAppointments;
    }
    setFilteredAppointments(filtered);
  };

  // Fetch all appointments
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get('/appointments/doctor-appointments');
      console.log('Appointments response:', response.data);
      
      if (response.data.success) {
        const appointments = response.data.appointments || [];
        setAllAppointments(appointments);
        filterAppointments('all'); // Initial filter for all appointments
      } else {
        throw new Error(response.data.message || 'Failed to fetch appointments');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch appointments';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setAllAppointments([]);
      setFilteredAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchAppointments();
  }, []);

  // Filter appointments when tab changes
  useEffect(() => {
    const types = ['all', 'today', 'upcoming', 'past'];
    filterAppointments(types[activeTab]);
  }, [activeTab, allAppointments]);

  // Handle status change
  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      setLoading(true);
      const response = await axios.patch(`/appointments/${appointmentId}/status`, { 
        status: newStatus 
      });

      if (response.data.success) {
        // Update both all appointments and filtered appointments
        const updatedAppointments = allAppointments.map(apt => 
          apt._id === appointmentId ? { ...apt, status: newStatus } : apt
        );
        setAllAppointments(updatedAppointments);
        filterAppointments(activeTab === 0 ? 'all' : ['all', 'today', 'upcoming', 'past'][activeTab]);

        toast({
          title: 'Status Updated',
          description: 'Appointment status has been updated successfully.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update appointment status',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async (appointmentId, newDate, newTime) => {
    try {
      setLoading(true);
      const response = await axios.patch(`/appointments/${appointmentId}/reschedule`, {
        date: newDate,
        time: newTime
      });

      if (response.data.success) {
        setAllAppointments(allAppointments.map(apt => 
          apt._id === appointmentId ? { ...apt, date: newDate, time: newTime, status: 'Rescheduled' } : apt
        ));
        filterAppointments(activeTab === 0 ? 'all' : ['all', 'today', 'upcoming', 'past'][activeTab]);

        toast({
          title: 'Appointment Rescheduled',
          description: 'The appointment has been rescheduled successfully.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onClose();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reschedule appointment',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNotes = async (appointmentId, notes) => {
    try {
      setLoading(true);
      const response = await axios.patch(`/appointments/${appointmentId}/notes`, { notes });

      if (response.data.success) {
        setAllAppointments(allAppointments.map(apt => 
          apt._id === appointmentId ? { ...apt, notes } : apt
        ));
        filterAppointments(activeTab === 0 ? 'all' : ['all', 'today', 'upcoming', 'past'][activeTab]);

        toast({
          title: 'Notes Updated',
          description: 'Appointment notes have been updated successfully.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update notes',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    onOpen();
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'blue';
      case 'completed':
        return 'green';
      case 'cancelled':
        return 'red';
      case 'rescheduled':
        return 'orange';
      case 'in progress':
        return 'teal';
      default:
        return 'gray';
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (timeString) => {
    return timeString;  // You can enhance this based on your time format
  };

  const AppointmentCard = ({ appointment, onStatusChange }) => (
    <Card mb={4} boxShadow="sm" borderRadius="lg">
      <CardBody>
        <Stack spacing={4}>
          <Flex justify="space-between" align="center">
            <HStack>
              <Icon as={FaUser} color="blue.500" />
              <Text fontWeight="bold">{appointment.patient.name}</Text>
            </HStack>
            <Badge colorScheme={getStatusColor(appointment.status)} fontSize="sm">
              {appointment.status}
            </Badge>
          </Flex>
          
          <Divider />
          
          <SimpleGrid columns={2} spacing={4}>
            <HStack>
              <Icon as={FaCalendarAlt} color="gray.500" />
              <Text>{formatDate(appointment.date)}</Text>
            </HStack>
            <HStack>
              <Icon as={FaClock} color="gray.500" />
              <Text>{formatTime(appointment.time)}</Text>
            </HStack>
          </SimpleGrid>
          
          {appointment.notes && (
            <HStack>
              <Icon as={FaNotesMedical} color="gray.500" />
              <Text noOfLines={2}>{appointment.notes}</Text>
            </HStack>
          )}
          
          <Divider />
          
          <HStack spacing={2} justify="flex-end">
            <Button
              size="sm"
              colorScheme="blue"
              onClick={() => handleViewDetails(appointment)}
            >
              View Details
            </Button>
            {appointment.status === 'scheduled' && (
              <>
                <Button
                  size="sm"
                  colorScheme="green"
                  onClick={() => onStatusChange(appointment._id, 'completed')}
                >
                  Complete
                </Button>
                <Button
                  size="sm"
                  colorScheme="red"
                  onClick={() => onStatusChange(appointment._id, 'cancelled')}
                >
                  Cancel
                </Button>
              </>
            )}
          </HStack>
        </Stack>
      </CardBody>
    </Card>
  );

  return (
    <Layout>
      <Box p={4}>
        <VStack spacing={6} align="stretch">
          <HStack justify="space-between">
            <Heading size="lg">Appointment Management</Heading>
            <Button 
              leftIcon={<Icon as={FaSync} />}
              colorScheme="blue" 
              onClick={() => fetchAppointments()}
            >
              Refresh
            </Button>
          </HStack>

          {/* Statistics */}
          <SimpleGrid columns={[1, 2, 5]} spacing={4}>
            <Card>
              <CardBody>
                <VStack spacing={4} align="start">
                  <HStack>
                    <Icon as={FaCalendarAlt} color="blue.500" boxSize={6} />
                    <Text fontWeight="bold">Total Appointments</Text>
                  </HStack>
                  <Stat>
                    <StatNumber fontSize="3xl">{getTotalAppointments()}</StatNumber>
                    <StatHelpText>All time</StatHelpText>
                  </Stat>
                </VStack>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <VStack spacing={4} align="start">
                  <HStack>
                    <Icon as={FaCalendarCheck} color="green.500" boxSize={6} />
                    <Text fontWeight="bold">Today's</Text>
                  </HStack>
                  <Stat>
                    <StatNumber fontSize="3xl">{getTodayAppointments()}</StatNumber>
                    <StatHelpText>Scheduled today</StatHelpText>
                  </Stat>
                </VStack>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <VStack spacing={4} align="start">
                  <HStack>
                    <Icon as={FaCheckCircle} color="teal.500" boxSize={6} />
                    <Text fontWeight="bold">Completed</Text>
                  </HStack>
                  <Stat>
                    <StatNumber fontSize="3xl">{getCompletedAppointments()}</StatNumber>
                    <StatHelpText>All time</StatHelpText>
                  </Stat>
                </VStack>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <VStack spacing={4} align="start">
                  <HStack>
                    <Icon as={FaClock} color="orange.500" boxSize={6} />
                    <Text fontWeight="bold">Upcoming</Text>
                  </HStack>
                  <Stat>
                    <StatNumber fontSize="3xl">{getUpcomingAppointments()}</StatNumber>
                    <StatHelpText>Future appointments</StatHelpText>
                  </Stat>
                </VStack>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <VStack spacing={4} align="start">
                  <HStack>
                    <Icon as={FaBan} color="red.500" boxSize={6} />
                    <Text fontWeight="bold">Cancelled</Text>
                  </HStack>
                  <Stat>
                    <StatNumber fontSize="3xl">{getCancelledAppointments()}</StatNumber>
                    <StatHelpText>All time</StatHelpText>
                  </Stat>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>

          <Tabs variant="enclosed" index={activeTab} onChange={setActiveTab}>
            <TabList>
              <Tab>All Appointments</Tab>
              <Tab>Today's Appointments</Tab>
              <Tab>Upcoming Appointments</Tab>
              <Tab>Past Appointments</Tab>
            </TabList>

            <TabPanels>
              {['all', 'today', 'upcoming', 'past'].map((type, index) => (
                <TabPanel key={type}>
                  {loading ? (
                    <Box textAlign="center" py={8}>
                      <Spinner size="xl" />
                      <Text mt={4}>Loading appointments...</Text>
                    </Box>
                  ) : error ? (
                    <Box p={4} bg="red.50" borderRadius="md">
                      <Text color="red.500">{error}</Text>
                    </Box>
                  ) : filteredAppointments.length === 0 ? (
                    <Box p={8} textAlign="center" bg="gray.50" borderRadius="md">
                      <Text fontSize="lg" color="gray.600">No {type} appointments found</Text>
                      <Text mt={2} color="gray.500">Any new appointments will appear here</Text>
                    </Box>
                  ) : (
                    <VStack spacing={4} align="stretch">
                      {filteredAppointments.map((appointment) => (
                        <AppointmentCard 
                          key={appointment._id} 
                          appointment={appointment}
                          onStatusChange={handleStatusChange}
                        />
                      ))}
                    </VStack>
                  )}
                </TabPanel>
              ))}
            </TabPanels>
          </Tabs>
        </VStack>

        {/* Appointment Details Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Appointment Details</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedAppointment && (
                <VStack spacing={4} align="stretch">
                  <Heading size="md" mb={2}>Patient Information</Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl>
                      <FormLabel>Patient Name</FormLabel>
                      <Input value={selectedAppointment.patient.name || 'Not provided'} isReadOnly />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Email</FormLabel>
                      <Input value={selectedAppointment.patient.email || 'Not provided'} isReadOnly />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Phone Number</FormLabel>
                      <Input value={selectedAppointment.patient.phone || 'Not provided'} isReadOnly />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Date of Birth</FormLabel>
                      <Input value={selectedAppointment.patient.dateOfBirth || 'Not provided'} isReadOnly />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Gender</FormLabel>
                      <Input value={selectedAppointment.patient.gender || 'Not provided'} isReadOnly />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Blood Group</FormLabel>
                      <Input value={selectedAppointment.patient.bloodGroup || 'Not provided'} isReadOnly />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Height</FormLabel>
                      <Input value={selectedAppointment.patient.height || 'Not provided'} isReadOnly />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Weight</FormLabel>
                      <Input value={selectedAppointment.patient.weight || 'Not provided'} isReadOnly />
                    </FormControl>
                  </SimpleGrid>
                  
                  <FormControl>
                    <FormLabel>Address</FormLabel>
                    <Input value={selectedAppointment.patient.address || 'Not provided'} isReadOnly />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Allergies</FormLabel>
                    <Textarea value={selectedAppointment.patient.allergies || 'None reported'} isReadOnly />
                  </FormControl>
                  
                  {selectedAppointment.patient.emergencyContact && (
                    <Box mt={2} p={3} borderWidth="1px" borderRadius="md">
                      <Heading size="sm" mb={2}>Emergency Contact</Heading>
                      <Text><strong>Name:</strong> {selectedAppointment.patient.emergencyContact.name || 'Not provided'}</Text>
                      <Text><strong>Relationship:</strong> {selectedAppointment.patient.emergencyContact.relationship || 'Not provided'}</Text>
                      <Text><strong>Phone:</strong> {selectedAppointment.patient.emergencyContact.phone || 'Not provided'}</Text>
                    </Box>
                  )}
                  
                  <Divider my={4} />
                  
                  <Heading size="md" mb={2}>Appointment Details</Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl>
                      <FormLabel>Date</FormLabel>
                      <Input
                        type="date"
                        value={selectedAppointment.date}
                        onChange={(e) => setSelectedAppointment({
                          ...selectedAppointment,
                          date: e.target.value
                        })}
                        isDisabled={selectedAppointment.status !== 'Scheduled'}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Time</FormLabel>
                      <Input
                        type="time"
                        value={selectedAppointment.time}
                        onChange={(e) => setSelectedAppointment({
                          ...selectedAppointment,
                          time: e.target.value
                        })}
                        isDisabled={selectedAppointment.status !== 'Scheduled'}
                      />
                    </FormControl>
                  </SimpleGrid>
                  
                  <FormControl>
                    <FormLabel>Type</FormLabel>
                    <Input value={selectedAppointment.type || 'Regular Checkup'} isReadOnly />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Notes</FormLabel>
                    <Textarea
                      value={selectedAppointment.notes}
                      onChange={(e) => {
                        setSelectedAppointment({
                          ...selectedAppointment,
                          notes: e.target.value
                        });
                        handleUpdateNotes(selectedAppointment._id, e.target.value);
                      }}
                      placeholder="Add appointment notes here..."
                    />
                  </FormControl>
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Close
              </Button>
              {selectedAppointment?.status === 'Scheduled' && (
                <Button
                  colorScheme="blue"
                  onClick={() => handleReschedule(
                    selectedAppointment._id,
                    selectedAppointment.date,
                    selectedAppointment.time
                  )}
                  isLoading={loading}
                >
                  Save Changes
                </Button>
              )}
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Layout>
  );
};

export default AppointmentManagement; 