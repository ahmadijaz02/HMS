import React, { useState, useEffect } from 'react';
import {
  Box,
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
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  SimpleGrid,
  Spinner,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Flex,
  IconButton,
  Divider
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, DownloadIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import Layout from '../shared/Layout';
import axios from '../../utils/axios';

const PrescriptionManagement = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [formData, setFormData] = useState({
    patient: '',
    medicalRecord: '',
    medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
    notes: '',
    expiryDate: ''
  });

  useEffect(() => {
    fetchPrescriptions();
    fetchPatients();
    fetchMedicalRecords();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/prescriptions/doctor/prescriptions');
      if (response.data.success) {
        setPrescriptions(response.data.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch prescriptions',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      console.log('Fetching patients...');
      const response = await axios.get('/users/patients');
      console.log('Patients response:', response.data);
      if (response.data.success) {
        setPatients(response.data.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch patients',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const fetchMedicalRecords = async () => {
    try {
      const response = await axios.get('/medical-records/doctor/records');
      if (response.data.success) {
        setMedicalRecords(response.data.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch medical records',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleViewPrescription = async (prescriptionId) => {
    try {
      setLoading(true);
      console.log('Doctor viewing prescription with ID:', prescriptionId);
      
      // Add authorization headers explicitly
      const token = localStorage.getItem('token');
      const response = await axios.get(`/prescriptions/${prescriptionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Prescription response:', response.data);
      
      if (response.data.success) {
        setSelectedPrescription(response.data.data);
        setIsViewModalOpen(true);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch prescription details',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Download functionality has been moved to the patient side only

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleMedicationChange = (index, field, value) => {
    const updatedMedications = [...formData.medications];
    updatedMedications[index][field] = value;
    setFormData({
      ...formData,
      medications: updatedMedications
    });
  };

  const addMedication = () => {
    setFormData({
      ...formData,
      medications: [
        ...formData.medications,
        { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
      ]
    });
  };

  const removeMedication = (index) => {
    const updatedMedications = [...formData.medications];
    updatedMedications.splice(index, 1);
    setFormData({
      ...formData,
      medications: updatedMedications
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Calculate expiry date if not provided (default to 30 days from now)
      let expiryDate = formData.expiryDate;
      if (!expiryDate) {
        const date = new Date();
        date.setDate(date.getDate() + 30);
        expiryDate = date.toISOString().split('T')[0];
      }
      
      const payload = {
        ...formData,
        expiryDate
      };

      const response = await axios.post('/prescriptions', payload);
      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Prescription created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        setIsCreateModalOpen(false);
        fetchPrescriptions();
        // Reset form
        setFormData({
          patient: '',
          medicalRecord: '',
          medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
          notes: '',
          expiryDate: ''
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create prescription',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'green';
      case 'completed':
        return 'blue';
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <Layout>
      <Box p={6}>
        <HStack justify="space-between" mb={6}>
          <Heading size="lg">Prescription Management</Heading>
          <Button 
            leftIcon={<AddIcon />} 
            colorScheme="blue" 
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create New Prescription
          </Button>
        </HStack>

        <Box bg="white" p={6} borderRadius="lg" shadow="sm">
          <Heading size="md" mb={4}>
            Prescriptions
          </Heading>
          {loading ? (
            <Flex justify="center" align="center" h="200px">
              <Spinner size="xl" />
            </Flex>
          ) : prescriptions.length > 0 ? (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Patient</Th>
                  <Th>Created Date</Th>
                  <Th>Expiry Date</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {prescriptions.map((prescription) => (
                  <Tr key={prescription._id}>
                    <Td>{prescription.patient.name}</Td>
                    <Td>{formatDate(prescription.createdAt)}</Td>
                    <Td>{formatDate(prescription.expiryDate)}</Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(prescription.status)}>
                        {prescription.status}
                      </Badge>
                    </Td>
                    <Td>
                      <Button size="sm" colorScheme="blue" onClick={() => handleViewPrescription(prescription._id)}>
                        View Details
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          ) : (
            <Text>No prescriptions found</Text>
          )}
        </Box>

        {/* Create Prescription Modal */}
        <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Create New Prescription</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel>Patient</FormLabel>
                  <Select
                    name="patient"
                    value={formData.patient}
                    onChange={handleInputChange}
                    placeholder="Select patient"
                  >
                    {patients.map(patient => (
                      <option key={patient._id} value={patient._id}>
                        {patient.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Medical Record (Optional)</FormLabel>
                  <Select
                    name="medicalRecord"
                    value={formData.medicalRecord}
                    onChange={handleInputChange}
                    placeholder="Select related medical record"
                  >
                    {medicalRecords
                      .filter(record => record.patient._id === formData.patient)
                      .map(record => (
                        <option key={record._id} value={record._id}>
                          {formatDate(record.createdAt)} - {record.diagnosis.substring(0, 30)}...
                        </option>
                      ))}
                  </Select>
                </FormControl>

                <Divider my={2} />
                <Heading size="sm">Medications</Heading>

                {formData.medications.map((medication, index) => (
                  <Box key={index} p={3} borderWidth="1px" borderRadius="md">
                    <HStack justify="space-between" mb={2}>
                      <Text fontWeight="bold">Medication #{index + 1}</Text>
                      {index > 0 && (
                        <IconButton
                          size="sm"
                          colorScheme="red"
                          icon={<DeleteIcon />}
                          onClick={() => removeMedication(index)}
                          aria-label="Remove medication"
                        />
                      )}
                    </HStack>
                    <SimpleGrid columns={2} spacing={4}>
                      <FormControl isRequired>
                        <FormLabel>Name</FormLabel>
                        <Input
                          value={medication.name}
                          onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                          placeholder="Medication name"
                        />
                      </FormControl>
                      <FormControl isRequired>
                        <FormLabel>Dosage</FormLabel>
                        <Input
                          value={medication.dosage}
                          onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                          placeholder="e.g., 500mg"
                        />
                      </FormControl>
                      <FormControl isRequired>
                        <FormLabel>Frequency</FormLabel>
                        <Input
                          value={medication.frequency}
                          onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                          placeholder="e.g., Twice daily"
                        />
                      </FormControl>
                      <FormControl isRequired>
                        <FormLabel>Duration</FormLabel>
                        <Input
                          value={medication.duration}
                          onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                          placeholder="e.g., 7 days"
                        />
                      </FormControl>
                    </SimpleGrid>
                    <FormControl mt={2}>
                      <FormLabel>Instructions</FormLabel>
                      <Textarea
                        value={medication.instructions}
                        onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
                        placeholder="Special instructions"
                      />
                    </FormControl>
                  </Box>
                ))}

                <Button leftIcon={<AddIcon />} onClick={addMedication} colorScheme="blue" variant="outline">
                  Add Another Medication
                </Button>

                <FormControl>
                  <FormLabel>Notes</FormLabel>
                  <Textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Additional notes"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Expiry Date</FormLabel>
                  <Input
                    name="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    placeholder="Select expiry date"
                  />
                  <Text fontSize="sm" color="gray.500">
                    If not specified, prescription will expire in 30 days
                  </Text>
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" mr={3} onClick={handleSubmit} isLoading={loading}>
                Save Prescription
              </Button>
              <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* View Prescription Modal */}
        <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Prescription Details</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedPrescription && (
                <VStack spacing={4} align="stretch">
                  <Box p={4} bg="gray.50" borderRadius="md">
                    <Heading size="sm" mb={2}>Patient Information</Heading>
                    <Text><strong>Name:</strong> {selectedPrescription.patient.name}</Text>
                    <Text><strong>Email:</strong> {selectedPrescription.patient.email}</Text>
                  </Box>

                  <Box p={4} bg="gray.50" borderRadius="md">
                    <Heading size="sm" mb={2}>Prescription Details</Heading>
                    <Text><strong>Created:</strong> {formatDate(selectedPrescription.createdAt)}</Text>
                    <Text><strong>Expires:</strong> {formatDate(selectedPrescription.expiryDate)}</Text>
                    <Text>
                      <strong>Status:</strong>{' '}
                      <Badge colorScheme={getStatusColor(selectedPrescription.status)}>
                        {selectedPrescription.status}
                      </Badge>
                    </Text>
                  </Box>

                  <Box p={4} bg="gray.50" borderRadius="md">
                    <Heading size="sm" mb={2}>Medications</Heading>
                    {selectedPrescription.medications.map((med, index) => (
                      <Box key={index} p={3} mb={2} borderWidth="1px" borderRadius="md" bg="white">
                        <Text fontWeight="bold">{med.name}</Text>
                        <Text><strong>Dosage:</strong> {med.dosage}</Text>
                        <Text><strong>Frequency:</strong> {med.frequency}</Text>
                        <Text><strong>Duration:</strong> {med.duration}</Text>
                        {med.instructions && (
                          <Text><strong>Instructions:</strong> {med.instructions}</Text>
                        )}
                      </Box>
                    ))}
                  </Box>

                  {selectedPrescription.notes && (
                    <Box p={4} bg="gray.50" borderRadius="md">
                      <Heading size="sm" mb={2}>Notes</Heading>
                      <Text>{selectedPrescription.notes}</Text>
                    </Box>
                  )}
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" onClick={() => setIsViewModalOpen(false)}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Layout>
  );
};

export default PrescriptionManagement;
