import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Heading,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  VStack,
  HStack,
  SimpleGrid,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Select,
  Spinner,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import Layout from '../shared/Layout';
import axios from '../../utils/axios';
import { FaComments } from 'react-icons/fa';
import { Icon } from '@chakra-ui/react';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [availableDays, setAvailableDays] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [doctorSchedule, setDoctorSchedule] = useState(null);
  
  // Modal states
  const { isOpen: isRescheduleOpen, onOpen: onRescheduleOpen, onClose: onRescheduleClose } = useDisclosure();
  const { isOpen: isCancelOpen, onOpen: onCancelOpen, onClose: onCancelClose } = useDisclosure();
  const cancelRef = React.useRef();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get('/appointments/my-appointments');
      if (response.data.success) {
        setAppointments(response.data.appointments);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch appointments',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle opening the cancel appointment dialog
  const handleCancelClick = (appointment) => {
    setSelectedAppointment(appointment);
    onCancelOpen();
  };

  // Handle cancelling an appointment
  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;
    
    try {
      setLoadingAction(true);
      const response = await axios.patch(`/appointments/${selectedAppointment._id}/cancel`);
      
      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Appointment cancelled successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Update the appointments list
        fetchAppointments();
        onCancelClose();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to cancel appointment',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle opening the reschedule appointment modal
  const handleRescheduleClick = async (appointment) => {
    setSelectedAppointment(appointment);
    setSelectedDay('');
    setSelectedDate('');
    setSelectedSlot(null);
    setAvailableDays([]);
    setAvailableSlots([]);
    
    try {
      setLoadingAction(true);
      // Fetch doctor's schedule
      const response = await axios.get(`/schedules/schedule/${appointment.doctor._id}`);
      
      if (response.data.success) {
        setDoctorSchedule(response.data.data);
        // Extract available days
        const availableDays = response.data.data.weeklySchedule
          .filter(day => day.isWorkingDay && day.timeSlots && day.timeSlots.length > 0)
          .map(day => day.day);
        setAvailableDays(availableDays);
      }
      onRescheduleOpen();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch doctor\'s schedule',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingAction(false);
    }
  };

  // Get next 4 weeks of dates for selected day
  const getNextFourWeeksDates = (selectedDay) => {
    const dates = [];
    const today = new Date();
    const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(selectedDay);
    
    // Find the next occurrence of the selected day
    let nextDate = new Date(today);
    while (nextDate.getDay() !== dayIndex) {
      nextDate.setDate(nextDate.getDate() + 1);
    }

    // Get 4 weeks of dates
    for (let i = 0; i < 4; i++) {
      const date = new Date(nextDate);
      dates.push(date.toISOString().split('T')[0]);
      nextDate.setDate(nextDate.getDate() + 7);
    }

    return dates;
  };

  // Handle day selection for rescheduling
  const handleDaySelect = (day) => {
    setSelectedDay(day);
    setSelectedDate('');
    setSelectedSlot(null);
    setAvailableSlots([]);
    
    // Generate next 4 weeks of available dates for the selected day
    const dates = getNextFourWeeksDates(day);
    setAvailableDates(dates);
  };

  // Handle date selection for rescheduling
  const handleDateSelect = async (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    
    if (!selectedAppointment || !date) return;
    
    try {
      setLoadingAction(true);
      const response = await axios.get(
        `/schedules/schedule/${selectedAppointment.doctor._id}/available-slots/${date}`
      );
      
      if (response.data.success) {
        setAvailableSlots(response.data.availableSlots);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch available slots',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setAvailableSlots([]);
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle slot selection for rescheduling
  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  // Handle rescheduling an appointment
  const handleRescheduleAppointment = async () => {
    if (!selectedAppointment || !selectedDate || !selectedSlot) {
      toast({
        title: 'Error',
        description: 'Please select all required fields',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setLoadingAction(true);
      const response = await axios.patch(`/appointments/${selectedAppointment._id}/patient-reschedule`, {
        date: selectedDate,
        time: selectedSlot.startTime,
        duration: selectedSlot.endTime
      });
      
      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Appointment rescheduled successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Update the appointments list
        fetchAppointments();
        onRescheduleClose();
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
      setLoadingAction(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'upcoming':
        return 'blue';
      case 'completed':
        return 'green';
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  const handleBookAppointment = () => {
    console.log('PatientDashboard: Attempting to navigate to book appointment', {
      currentPath: window.location.pathname,
      timestamp: new Date().toISOString()
    });
    navigate('/patient/book-appointment');
  };

  return (
    <Layout>
      <Box>
        <HStack justify="space-between" mb={6}>
          <Heading>Welcome Back!</Heading>
          <Button 
            colorScheme="blue" 
            onClick={handleBookAppointment}
            size="lg"
          >
            Book New Appointment
          </Button>
        </HStack>

        {/* Quick Actions */}
        <Grid templateColumns="repeat(4, 1fr)" gap={6} mb={8}>
          <Box p={6} bg="white" borderRadius="lg" shadow="sm">
            <VStack align="start" spacing={3}>
              <Heading size="md">Next Appointment</Heading>
              {appointments.length > 0 ? (
                <>
                  <Text>{appointments[0].doctor.name}</Text>
                  <Text color="gray.600">
                    {new Date(appointments[0].date).toLocaleDateString()} - {appointments[0].time}
                  </Text>
                  <Button size="sm" colorScheme="blue">
                    View Details
                  </Button>
                </>
              ) : (
                <Text color="gray.600">No upcoming appointments</Text>
              )}
            </VStack>
          </Box>

          <Box p={6} bg="white" borderRadius="lg" shadow="sm">
            <VStack align="start" spacing={3}>
              <Heading size="md">Medical Records</Heading>
              <Text>Last Updated: {new Date().toLocaleDateString()}</Text>
              <Button size="sm" colorScheme="blue" onClick={() => navigate('/patient/medical-records')}>
                View Records
              </Button>
            </VStack>
          </Box>

          <Box p={6} bg="white" borderRadius="lg" shadow="sm">
            <VStack align="start" spacing={3}>
              <Heading size="md">Prescriptions</Heading>
              <Text>Active Prescriptions</Text>
              <Button size="sm" colorScheme="blue" onClick={() => navigate('/patient/prescriptions')}>
                View All
              </Button>
            </VStack>
          </Box>

          <Box p={6} bg="white" borderRadius="lg" shadow="sm">
            <VStack align="start" spacing={3}>
              <Heading size="md">Chat</Heading>
              <Text>Connect with your doctor</Text>
              <Button 
                size="sm" 
                colorScheme="purple"
                leftIcon={<Icon as={FaComments} />}
                onClick={() => navigate('/patient/chat')}
              >
                Open Chat
              </Button>
            </VStack>
          </Box>
        </Grid>

        {/* Appointments List */}
        <Box bg="white" p={6} borderRadius="lg" shadow="sm">
          <Heading size="md" mb={4}>
            Your Appointments
          </Heading>
          {loading ? (
            <Text>Loading appointments...</Text>
          ) : appointments.length > 0 ? (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Doctor</Th>
                  <Th>Date</Th>
                  <Th>Time</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {appointments.map((appointment) => (
                  <Tr key={appointment._id}>
                    <Td>{appointment.doctor.name}</Td>
                    <Td>{new Date(appointment.date).toLocaleDateString()}</Td>
                    <Td>{appointment.time}</Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(appointment.status)}>
                        {appointment.status}
                      </Badge>
                    </Td>
                    <Td>
                      {(appointment.status.toLowerCase() === 'upcoming' || appointment.status.toLowerCase() === 'scheduled' || appointment.status.toLowerCase() === 'rescheduled') && (
                        <HStack spacing={2}>
                          <Button 
                            size="sm" 
                            colorScheme="blue"
                            onClick={() => handleRescheduleClick(appointment)}
                          >
                            Reschedule
                          </Button>
                          <Button 
                            size="sm" 
                            colorScheme="red"
                            onClick={() => handleCancelClick(appointment)}
                          >
                            Cancel
                          </Button>
                        </HStack>
                      )}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          ) : (
            <Text>No appointments found</Text>
          )}
        </Box>
      </Box>

      {/* Cancel Appointment Confirmation Dialog */}
      <AlertDialog
        isOpen={isCancelOpen}
        leastDestructiveRef={cancelRef}
        onClose={onCancelClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Cancel Appointment
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onCancelClose}>
                No
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleCancelAppointment} 
                ml={3}
                isLoading={loadingAction}
              >
                Yes, Cancel
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Reschedule Appointment Modal */}
      <Modal isOpen={isRescheduleOpen} onClose={onRescheduleClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Reschedule Appointment</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {loadingAction ? (
              <VStack spacing={4} py={4}>
                <Spinner size="xl" />
                <Text>Loading...</Text>
              </VStack>
            ) : (
              <VStack spacing={4} align="stretch">
                {selectedAppointment && (
                  <Box p={4} borderWidth={1} borderRadius="md">
                    <Text fontWeight="bold">Current Appointment:</Text>
                    <Text>Doctor: {selectedAppointment.doctor.name}</Text>
                    <Text>Date: {new Date(selectedAppointment.date).toLocaleDateString()}</Text>
                    <Text>Time: {selectedAppointment.time}</Text>
                  </Box>
                )}

                {/* Available Days */}
                {availableDays.length > 0 && (
                  <Box>
                    <FormLabel>Select Day</FormLabel>
                    <SimpleGrid columns={[2, 3, 7]} spacing={4}>
                      {availableDays.map((day) => (
                        <Button
                          key={day}
                          onClick={() => handleDaySelect(day)}
                          colorScheme={selectedDay === day ? 'blue' : 'gray'}
                        >
                          {day}
                        </Button>
                      ))}
                    </SimpleGrid>
                  </Box>
                )}

                {/* Available Dates */}
                {selectedDay && (
                  <Box>
                    <FormLabel>Select Date</FormLabel>
                    <SimpleGrid columns={[2, 3, 4]} spacing={4}>
                      {availableDates.map((date) => (
                        <Button
                          key={date}
                          onClick={() => handleDateSelect(date)}
                          colorScheme={selectedDate === date ? 'blue' : 'gray'}
                        >
                          {new Date(date).toLocaleDateString()}
                        </Button>
                      ))}
                    </SimpleGrid>
                  </Box>
                )}

                {/* Available Time Slots */}
                {selectedDate && (
                  <Box>
                    <FormLabel>Select Time Slot</FormLabel>
                    {loadingAction ? (
                      <Spinner size="md" />
                    ) : availableSlots.length > 0 ? (
                      <SimpleGrid columns={[2, 3, 4]} spacing={4}>
                        {availableSlots.map((slot) => (
                          <Button
                            key={`${slot.startTime}-${slot.endTime}`}
                            onClick={() => handleSlotSelect(slot)}
                            colorScheme={selectedSlot === slot ? 'blue' : 'gray'}
                          >
                            {slot.startTime} - {slot.endTime}
                          </Button>
                        ))}
                      </SimpleGrid>
                    ) : (
                      <Text color="red.500">No available time slots for this date</Text>
                    )}
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>

          <ModalFooter>
            <Button onClick={onRescheduleClose} mr={3}>Cancel</Button>
            <Button 
              colorScheme="blue" 
              onClick={handleRescheduleAppointment}
              isDisabled={!selectedDate || !selectedSlot}
              isLoading={loadingAction}
            >
              Reschedule
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Layout>
  );
};

export default PatientDashboard; 