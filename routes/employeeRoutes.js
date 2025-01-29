const express = require('express');
const multer = require('multer');
const Employee = require('../models/Employee');
const EmployeeDetails = require('../models/EmployeeDetails');

// Use express validator to sanitize the input
const router = express.Router();
const { body, validationResult } = require('express-validator');

// Route for signUp
router.post(
  '/signup',
  [
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  ],
  async (req, res) => {

    // Prevent caching for this route
    res.set('Cache-Control', 'no-store, must-revalidate');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { email, password } = req.body;

      // Check if the email already exists in the database
      const existingEmployee = await Employee.findOne({ email });
      if (existingEmployee) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      // Create the new employee without hashing the password
      const newEmployee = new Employee({ email, password });

      await newEmployee.save();
      res.status(201).json(newEmployee);
    } catch (err) {
      res.status(400).json({ message: 'Error signing up', error: err });
    }
  }
);

// Route for login
router.post('/login', async (req, res) => {

  // Prevent caching for this route
  res.set('Cache-Control', 'no-store, must-revalidate');

  try {
    const { email, password } = req.body;

    // Find the employee by email from the database
    const employee = await Employee.findOne({ email });
    if (!employee) {
      return res.status(404).json({ message: 'Invalid email or password' });
    }

    // Compare the provided password with the stored password (plain text)
    if (employee.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Authentication successful
    res.status(200).json({ message: 'Login successful', employee });
  } catch (err) {
    res.status(500).json({ message: 'Error logging in', error: err });
  }
});

// Route for adding an employee
router.post(
  '/employees',

  // These fields should be there
  [
    body('empId').isString().notEmpty().withMessage('Employee ID is required'),
    body('email').isEmail().withMessage('Invalid email format'),
    body('firstName').isString().notEmpty().withMessage('First name is required'),
    body('lastName').isString().notEmpty().withMessage('Last name is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { empId, firstName, lastName, department, email, mobileNo, dob, dateOfJoining, address, salary, designation } = req.body;

      // Check if the employeeID exists
      const empIdExists = await EmployeeDetails.findOne({ empId });

      if (empIdExists) {
        return res.status(400).json({ message: 'Employee ID already exists.' });
      }

      // Create a new employee object
      const newEmployeeDetails = new EmployeeDetails({
        empId,
        firstName,
        lastName,
        department,
        email,
        mobileNo,
        dob,
        dateOfJoining,
        address,
        salary,
        designation,
      });
      await newEmployeeDetails.save();
      res.status(201).json(newEmployeeDetails);
    } catch (err) {
      console.error('Error adding employee:', err);
      res.status(400).json({ message: 'Error adding employee', error: err });
    }
  }
);

// Route for getting employee details
router.get('/employees', async (req, res) => {

  // Prevent caching for this route
  res.set('Cache-Control', 'no-store, must-revalidate');

  try {
    const employees = await EmployeeDetails.find();
    res.status(200).json(employees);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching employees', error: err });
  }
});

// Route for updating employee details
router.put('/employees/:id', async (req, res) => {

  // Prevent caching for this route
  res.set('Cache-Control', 'no-store, must-revalidate');

  try {
    const updatedEmployee = await EmployeeDetails.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updatedEmployee);
  } catch (err) {
    res.status(400).json({ message: 'Error updating employee', error: err });
  }
});

// Route for deleting an employee
router.delete('/employees/:id', async (req, res) => {

  // Prevent caching for this route
  res.set('Cache-Control', 'no-store, must-revalidate');

  try {
    await EmployeeDetails.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Employee deleted successfully' });
  } catch (err) {
    res.status(400).json({ message: 'Error deleting employee', error: err });
  }
});

// Export the route
module.exports = router;
