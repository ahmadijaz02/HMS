const express = require('express');
const { check, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const Schedule = require('../models/Schedule');
const Appointment = require('../models/Appointment');
const mongoose = require('mongoose');
const router = express.Router();

const DEFAULT_SCHEDULE = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
].map(day => ({
    day,
    isWorkingDay: false,
    timeSlots: []
}));

// Helper function to check if user is authorized to access/modify the schedule
const isAuthorizedForSchedule = (user, doctorId) => {
    try {
        // Convert both IDs to strings for comparison
        const userId = user.id;
        const requestedId = doctorId.toString();
        
        console.log('Authorization comparison:', {
            userId,
            requestedId,
            userRole: user.role,
            isAdmin: user.role === 'admin',
            isMatch: userId === requestedId
        });
        
        return user.role === 'admin' || userId === requestedId;
    } catch (error) {
        console.error('Authorization check error:', error);
        return false;
    }
};

// Get doctor's schedule
router.get('/schedule/:doctorId', [
    protect,
    authorize('doctor', 'admin', 'patient')
], async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.doctorId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid doctor ID format'
            });
        }

        console.log('GET Schedule - Full request details:', {
            params: req.params,
            user: {
                id: req.user.id,
                role: req.user.role
            }
        });
        
        // Only check authorization for doctors and admins modifying schedules
        if (['doctor', 'admin'].includes(req.user.role)) {
            const isAuthorized = isAuthorizedForSchedule(req.user, req.params.doctorId);
            console.log('GET Schedule - Authorization check:', {
                userRole: req.user.role,
                userId: req.user.id,
                requestedDoctorId: req.params.doctorId,
                isAuthorized
            });

            if (!isAuthorized) {
                console.log('GET Schedule - Authorization failed');
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to view this schedule'
                });
            }
        }

        let schedule = await Schedule.findOne({ doctor: req.params.doctorId });
        console.log('GET Schedule - Database query result:', {
            doctorId: req.params.doctorId,
            scheduleFound: !!schedule
        });
        
        if (!schedule) {
            // Create default schedule if none exists
            schedule = new Schedule({
                doctor: req.params.doctorId,
                weeklySchedule: DEFAULT_SCHEDULE,
                defaultSlotDuration: 30,
                breakTime: { start: '13:00', end: '14:00' },
                maxPatientsPerSlot: 1
            });
            await schedule.save();
            console.log('GET Schedule - Created default schedule');
        }

        res.status(200).json({
            success: true,
            data: schedule
        });
    } catch (err) {
        console.error('Get schedule error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
});

// Create or update doctor's schedule
router.put('/schedule/:doctorId', [
    protect,
    authorize('doctor', 'admin'),
    [
        check('weeklySchedule').isArray(),
        check('weeklySchedule.*.day').isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
        check('weeklySchedule.*.isWorkingDay').isBoolean(),
        check('weeklySchedule.*.timeSlots').isArray(),
        check('weeklySchedule.*.timeSlots.*.startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        check('weeklySchedule.*.timeSlots.*.endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        check('defaultSlotDuration').isInt({ min: 5, max: 120 }),
        check('breakTime.start').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        check('breakTime.end').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        check('maxPatientsPerSlot').optional().isInt({ min: 1, max: 10 })
    ]
], async (req, res) => {
    try {
        console.log('PUT Schedule - Request params:', req.params);
        console.log('PUT Schedule - Request body:', req.body);
        console.log('PUT Schedule - Authenticated user:', req.user);

        // Check if user is the doctor or an admin
        if (!isAuthorizedForSchedule(req.user, req.params.doctorId)) {
            console.log('PUT Schedule - Authorization failed:', {
                userRole: req.user.role,
                userId: req.user.id || (req.user._id && req.user._id.toString()),
                requestedDoctorId: req.params.doctorId
            });
            return res.status(403).json({
                success: false,
                message: 'Not authorized to modify this schedule'
            });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const {
            weeklySchedule,
            defaultSlotDuration,
            breakTime,
            maxPatientsPerSlot
        } = req.body;

        // Find and update or create new schedule
        let schedule = await Schedule.findOne({ doctor: req.params.doctorId });
        console.log('PUT Schedule - Found existing schedule:', schedule);

        if (schedule) {
            schedule.weeklySchedule = weeklySchedule;
            schedule.defaultSlotDuration = defaultSlotDuration;
            schedule.breakTime = breakTime;
            schedule.maxPatientsPerSlot = maxPatientsPerSlot;
            schedule.updatedAt = Date.now();
        } else {
            schedule = new Schedule({
                doctor: req.params.doctorId,
                weeklySchedule,
                defaultSlotDuration,
                breakTime,
                maxPatientsPerSlot
            });
        }

        await schedule.save();
        console.log('PUT Schedule - Saved schedule:', schedule);

        res.json({
            success: true,
            schedule
        });
    } catch (error) {
        console.error('PUT Schedule - Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Update specific day's schedule
router.patch('/schedule/:doctorId/:day', [
    protect,
    authorize('doctor', 'admin'),
    [
        check('isWorkingDay').isBoolean(),
        check('timeSlots').optional().isArray(),
        check('timeSlots.*.startTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        check('timeSlots.*.endTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        check('timeSlots.*.isAvailable').optional().isBoolean()
    ]
], async (req, res) => {
    try {
        console.log('PATCH Schedule - Request params:', req.params);
        console.log('PATCH Schedule - Request body:', req.body);
        console.log('PATCH Schedule - Authenticated user:', req.user);

        // Check if user is the doctor or an admin
        if (!isAuthorizedForSchedule(req.user, req.params.doctorId)) {
            console.log('PATCH Schedule - Authorization failed:', {
                userRole: req.user.role,
                userId: req.user.id || (req.user._id && req.user._id.toString()),
                requestedDoctorId: req.params.doctorId
            });
            return res.status(403).json({
                success: false,
                message: 'Not authorized to modify this schedule'
            });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        let schedule = await Schedule.findOne({ doctor: req.params.doctorId });
        console.log('PATCH Schedule - Found schedule:', schedule);
        
        if (!schedule) {
            // Create a new schedule if it doesn't exist
            schedule = new Schedule({
                doctor: req.params.doctorId,
                weeklySchedule: DEFAULT_SCHEDULE,
                defaultSlotDuration: 30,
                breakTime: { start: '13:00', end: '14:00' },
                maxPatientsPerSlot: 1
            });
        }

        const dayIndex = schedule.weeklySchedule.findIndex(
            d => d.day.toLowerCase() === req.params.day.toLowerCase()
        );

        if (dayIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Day not found in schedule'
            });
        }

        // Update the day's schedule while preserving the day field
        schedule.weeklySchedule[dayIndex] = {
            day: req.params.day,
            isWorkingDay: req.body.isWorkingDay,
            timeSlots: req.body.timeSlots || []
        };

        console.log('PATCH Schedule - Updated schedule:', schedule);
        await schedule.save();

        res.json({
            success: true,
            data: schedule
        });
    } catch (error) {
        console.error('PATCH Schedule - Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Get available time slots for a specific day
router.get('/schedule/:doctorId/available-slots/:date', async (req, res) => {
    try {
        const schedule = await Schedule.findOne({ doctor: req.params.doctorId });
        
        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found'
            });
        }

        const date = new Date(req.params.date);
        const day = date.toLocaleDateString('en-US', { weekday: 'long' });
        
        const daySchedule = schedule.weeklySchedule.find(
            d => d.day === day && d.isWorkingDay
        );

        if (!daySchedule) {
            return res.json({
                success: true,
                availableSlots: []
            });
        }

        // Get booked appointments for the day
        const appointments = await Appointment.find({
            doctor: req.params.doctorId,
            date: {
                $gte: new Date(date.setHours(0, 0, 0)),
                $lt: new Date(date.setHours(23, 59, 59))
            }
        });

        // Filter out booked slots
        const availableSlots = daySchedule.timeSlots.filter(slot => {
            const bookedAppointments = appointments.filter(apt => 
                apt.time >= slot.startTime && apt.time < slot.endTime
            );
            return slot.isAvailable && bookedAppointments.length < schedule.maxPatientsPerSlot;
        });

        res.json({
            success: true,
            availableSlots
        });
    } catch (error) {
        console.error('Get available slots error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router; 