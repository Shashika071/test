const express = require('express');
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing
const multer = require('multer');
const Employee = require('../models/Employee');
const EmployeeDetails = require('../models/EmployeeDetails');

//use express validator to sanitize the input
const router = express.Router();
const { body, validationResult } = require('express-validator');

// route for signUP
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

        //used mongoose methods to prevent SQL injection
        const existingEmployee = await Employee.findOne({ email });

        if (existingEmployee) {
          return res.status(400).json({ message: 'Email already exists' });
        }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      //create the new employee with the hashed password
      const newEmployee = new Employee({ email, password: hashedPassword });

      await newEmployee.save();
      res.status(201).json(newEmployee);
    } catch (err) {
      res.status(400).json({ message: 'Error signing up', error: err });
    }
  }
);


// route for login
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

    // Compare the provided password with the hashed password
    const isPasswordValid = await bcrypt.compare(password, employee.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Authentication successful
    res.status(200).json({ message: 'Login successful', employee });
  } catch (err) {
    res.status(500).json({ message: 'Error logging in', error: err });
  }
});

// route for Add an employee
router.post(
  '/employees',

  //These fields should be there
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

      //check if the employeeID exists
      const empIdExists = await EmployeeDetails.findOne({ empId });

      if (empIdExists) {
        return res.status(400).json({ message: 'Employee ID already exists.' });
      }

      //create new employee object
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


// route for get employee details
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

//route for update employee details
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

//routr for delete an employee
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

//export the route
module.exports = router;
