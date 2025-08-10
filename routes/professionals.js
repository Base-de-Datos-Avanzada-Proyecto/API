/**
 * Professional Routes
 * ITI-821 Advanced Database Course
 * 
 * REST API routes for professional registration and management
 * Supports both individual and bulk registration operations
 */

const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const Professional = require('../models/Professional');
const Profession = require('../models/Profession');
const { validateProfessional, validateBulkUpload } = require('../middleware/validation');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['text/csv', 'application/json'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and JSON files are allowed'));
    }
  }
});

/**
 * @route   GET /api/professionals
 * @desc    Get all professionals with optional filtering
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { canton, profession, gender, page = 1, limit = 10 } = req.query;
    
    // Build filter object
    const filter = { isActive: true };
    if (canton) filter.canton = canton;
    if (gender) filter.gender = gender;
    if (profession) {
      const professionDoc = await Profession.findOne({ 
        $or: [{ name: new RegExp(profession, 'i') }, { code: profession.toUpperCase() }]
      });
      if (professionDoc) {
        filter['professions.professionId'] = professionDoc._id;
      }
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with population
    const professionals = await Professional.find(filter)
      .populate('professions.professionId', 'name code category')
      .sort({ registrationDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await Professional.countDocuments(filter);
    
    res.json({
      success: true,
      data: professionals,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        hasNext: skip + professionals.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
    
  } catch (error) {
    console.error('Error fetching professionals:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching professionals',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/professionals/:id
 * @desc    Get professional by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const professional = await Professional.findById(req.params.id)
      .populate('professions.professionId', 'name code category description');
    
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found'
      });
    }
    
    res.json({
      success: true,
      data: professional
    });
    
  } catch (error) {
    console.error('Error fetching professional:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching professional',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/professionals/cedula/:cedula
 * @desc    Get professional by cedula
 * @access  Public
 */
router.get('/cedula/:cedula', async (req, res) => {
  try {
    const professional = await Professional.findOne({ cedula: req.params.cedula })
      .populate('professions.professionId', 'name code category description');
    
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found with the provided cedula'
      });
    }
    
    res.json({
      success: true,
      data: professional
    });
    
  } catch (error) {
    console.error('Error fetching professional by cedula:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching professional',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/professionals
 * @desc    Register a new professional
 * @access  Public
 */
router.post('/', validateProfessional, async (req, res) => {
  try {
    const {
      cedula, firstName, lastName, email, phone, canton, address,
      birthDate, gender, professionIds
    } = req.body;
    
    // Check if professional already exists
    const existingProfessional = await Professional.findOne({
      $or: [{ cedula }, { email }]
    });
    
    if (existingProfessional) {
      return res.status(400).json({
        success: false,
        message: 'Professional already exists with this cedula or email'
      });
    }
    
    // Validate profession IDs exist
    const validProfessions = await Profession.find({
      _id: { $in: professionIds },
      isActive: true
    });
    
    if (validProfessions.length !== professionIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more profession IDs are invalid'
      });
    }
    
    // Create professional document
    const professional = new Professional({
      cedula,
      firstName,
      lastName,
      email,
      phone,
      canton,
      address,
      birthDate: new Date(birthDate),
      gender,
      professions: professionIds.map(id => ({
        professionId: id,
        registrationDate: new Date()
      }))
    });
    
    await professional.save();
    
    // Populate profession data for response
    await professional.populate('professions.professionId');
    
    res.status(201).json({
      success: true,
      message: 'Professional registered successfully',
      data: professional
    });
    
  } catch (error) {
    console.error('Error registering professional:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error registering professional',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/professionals/:id
 * @desc    Update professional information
 * @access  Public
 */
router.put('/:id', validateProfessional, async (req, res) => {
  try {
    const professional = await Professional.findById(req.params.id);
    
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found'
      });
    }
    
    // Update fields
    const updatableFields = [
      'firstName', 'lastName', 'email', 'phone', 'canton', 
      'address', 'birthDate', 'gender'
    ];
    
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        professional[field] = req.body[field];
      }
    });
    
    // Handle profession updates if provided
    if (req.body.professionIds) {
      const validProfessions = await Profession.find({
        _id: { $in: req.body.professionIds },
        isActive: true
      });
      
      if (validProfessions.length !== req.body.professionIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more profession IDs are invalid'
        });
      }
      
      professional.professions = req.body.professionIds.map(id => ({
        professionId: id,
        registrationDate: new Date()
      }));
    }
    
    await professional.save();
    await professional.populate('professions.professionId');
    
    res.json({
      success: true,
      message: 'Professional updated successfully',
      data: professional
    });
    
  } catch (error) {
    console.error('Error updating professional:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating professional',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/professionals/bulk-upload
 * @desc    Bulk upload professionals from CSV or JSON file
 * @access  Public
 */
router.post('/bulk-upload', upload.single('file'), validateBulkUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    let professionals = [];
    
    if (fileExtension === '.csv') {
      // Process CSV file
      professionals = await processCsvFile(filePath);
    } else if (fileExtension === '.json') {
      // Process JSON file
      const fileContent = fs.readFileSync(filePath, 'utf8');
      professionals = JSON.parse(fileContent);
    }
    
    // Validate and process each professional
    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };
    
    for (let i = 0; i < professionals.length; i++) {
      try {
        const professionalData = professionals[i];
        
        // Validate required fields
        if (!professionalData.cedula || !professionalData.firstName || 
            !professionalData.lastName || !professionalData.email) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            error: 'Missing required fields (cedula, firstName, lastName, email)'
          });
          continue;
        }
        
        // Check if professional already exists
        const existing = await Professional.findOne({
          $or: [
            { cedula: professionalData.cedula },
            { email: professionalData.email }
          ]
        });
        
        if (existing) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            error: 'Professional already exists with this cedula or email'
          });
          continue;
        }
        
        // Process profession names/codes to IDs
        let professionIds = [];
        if (professionalData.professions) {
          const professionNames = Array.isArray(professionalData.professions) 
            ? professionalData.professions 
            : professionalData.professions.split(',').map(p => p.trim());
          
          for (const profName of professionNames) {
            const profession = await Profession.findOne({
              $or: [
                { name: new RegExp(`^${profName}$`, 'i') },
                { code: profName.toUpperCase() }
              ],
              isActive: true
            });
            
            if (profession) {
              professionIds.push(profession._id);
            }
          }
        }
        
        if (professionIds.length === 0) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            error: 'No valid professions found'
          });
          continue;
        }
        
        // Create professional
        const professional = new Professional({
          cedula: professionalData.cedula,
          firstName: professionalData.firstName,
          lastName: professionalData.lastName,
          email: professionalData.email,
          phone: professionalData.phone,
          canton: professionalData.canton,
          address: professionalData.address,
          birthDate: new Date(professionalData.birthDate),
          gender: professionalData.gender,
          professions: professionIds.map(id => ({
            professionId: id,
            registrationDate: new Date()
          }))
        });
        
        await professional.save();
        results.successful++;
        
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: i + 1,
          error: error.message
        });
      }
    }
    
    // Clean up uploaded file
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      message: 'Bulk upload completed',
      results: results
    });
    
  } catch (error) {
    console.error('Error in bulk upload:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Error processing bulk upload',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/professionals/stats/by-gender
 * @desc    Get professionals statistics by gender
 * @access  Public
 */
router.get('/stats/by-gender', async (req, res) => {
  try {
    const stats = await Professional.getGenderStats();
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Error getting gender stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting statistics',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/professionals/by-profession/:professionId
 * @desc    Get professionals by profession
 * @access  Public
 */
router.get('/by-profession/:professionId', async (req, res) => {
  try {
    const professionals = await Professional.findByProfession(req.params.professionId);
    
    res.json({
      success: true,
      data: professionals
    });
    
  } catch (error) {
    console.error('Error getting professionals by profession:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching professionals',
      error: error.message
    });
  }
});

/**
 * Helper function to process CSV file
 * @param {string} filePath - Path to the CSV file
 * @returns {Promise<Array>} Array of professional objects
 */
function processCsvFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // Convert CSV row to professional object
        const professional = {
          cedula: row.cedula || row.Cedula,
          firstName: row.firstName || row.FirstName || row.first_name,
          lastName: row.lastName || row.LastName || row.last_name,
          email: row.email || row.Email,
          phone: row.phone || row.Phone,
          canton: row.canton || row.Canton,
          address: row.address || row.Address,
          birthDate: row.birthDate || row.BirthDate || row.birth_date,
          gender: row.gender || row.Gender,
          professions: row.professions || row.Professions
        };
        
        results.push(professional);
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

module.exports = router;