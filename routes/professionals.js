/**
 * Professional Routes
 * ITI-821 Advanced Database Course
 * 
 * REST API routes for professional registration and management
 * Updated to work with simplified Professional model and Curriculum model
 */

const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const Professional = require('../models/Professional');
const Curriculum = require('../models/Curriculum');
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
    
    let professionalIds = null;
    
    // Filter by profession through curriculum
    if (profession) {
      const professionDoc = await Profession.findOne({ 
        $or: [{ name: new RegExp(profession, 'i') }, { code: profession.toUpperCase() }]
      });
      
      if (professionDoc) {
        const curricula = await Curriculum.find({
          'professions.professionId': professionDoc._id
        }).select('professionalId');
        
        professionalIds = curricula.map(c => c.professionalId);
        if (professionalIds.length > 0) {
          filter._id = { $in: professionalIds };
        } else {
          // No professionals found with this profession
          return res.json({
            success: true,
            data: [],
            pagination: {
              currentPage: parseInt(page),
              totalPages: 0,
              totalRecords: 0,
              hasNext: false,
              hasPrev: false
            }
          });
        }
      }
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const professionals = await Professional.find(filter)
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
    const professional = await Professional.findById(req.params.id);
    
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found'
      });
    }
    
    // Get curriculum if exists
    const curriculum = await professional.getCurriculum();
    
    res.json({
      success: true,
      data: {
        ...professional.toObject(),
        curriculum: curriculum
      }
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
    const professional = await Professional.findOne({ cedula: req.params.cedula });
    
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found with the provided cedula'
      });
    }
    
    // Get curriculum if exists
    const curriculum = await professional.getCurriculum();
    
    res.json({
      success: true,
      data: {
        ...professional.toObject(),
        curriculum: curriculum
      }
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
 * @desc    Register a new professional (basic profile only)
 * @access  Public
 */
router.post('/', validateProfessional, async (req, res) => {
  try {
    const {
      cedula, firstName, lastName, email, phone, canton, address,
      birthDate, gender
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
    
    // Create professional document (basic profile only)
    const professional = new Professional({
      cedula,
      firstName,
      lastName,
      email,
      phone,
      canton,
      address,
      birthDate: new Date(birthDate),
      gender
    });
    
    await professional.save();
    
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
    
    // Update basic fields only
    const updatableFields = [
      'firstName', 'lastName', 'email', 'phone', 'canton', 
      'address', 'birthDate', 'gender'
    ];
    
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        professional[field] = req.body[field];
      }
    });
    
    await professional.save();
    
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
 * @route   DELETE /api/professionals/:id
 * @desc    Soft delete professional (set isActive to false)
 * @access  Public
 */
router.delete('/:id', async (req, res) => {
  try {
    const professional = await Professional.findByIdAndUpdate(
      req.params.id,
      { isActive: false, lastUpdated: new Date() },
      { new: true }
    );
    
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Professional deactivated successfully'
    });
    
  } catch (error) {
    console.error('Error deactivating professional:', error);
    res.status(500).json({
      success: false,
      message: 'Error deactivating professional',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/professionals/bulk-upload
 * @desc    Bulk upload professionals from CSV or JSON file (basic profiles only)
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
        
        // Create professional (basic profile only)
        const professional = new Professional({
          cedula: professionalData.cedula,
          firstName: professionalData.firstName,
          lastName: professionalData.lastName,
          email: professionalData.email,
          phone: professionalData.phone,
          canton: professionalData.canton,
          address: professionalData.address,
          birthDate: new Date(professionalData.birthDate),
          gender: professionalData.gender
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
 * @route   GET /api/professionals/stats/general
 * @desc    Get general professional statistics
 * @access  Public
 */
router.get('/stats/general', async (req, res) => {
  try {
    const stats = await Professional.getStats();
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Error getting general stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting statistics',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/professionals/by-profession/:professionId
 * @desc    Get professionals by profession (through curriculum)
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
 * @route   GET /api/professionals/by-canton/:canton
 * @desc    Get professionals by canton
 * @access  Public
 */
router.get('/by-canton/:canton', async (req, res) => {
  try {
    const professionals = await Professional.findByCanton(req.params.canton);
    
    res.json({
      success: true,
      data: professionals
    });
    
  } catch (error) {
    console.error('Error getting professionals by canton:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching professionals',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/professionals/search/:searchText
 * @desc    Search professionals by text
 * @access  Public
 */
router.get('/search/:searchText', async (req, res) => {
  try {
    const searchText = req.params.searchText;
    const searchRegex = new RegExp(searchText, 'i');
    
    const professionals = await Professional.find({
      isActive: true,
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { cedula: searchRegex }
      ]
    }).sort({ firstName: 1, lastName: 1 });
    
    res.json({
      success: true,
      data: professionals
    });
    
  } catch (error) {
    console.error('Error searching professionals:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching professionals',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/professionals/:id/complete-profile
 * @desc    Mark professional profile as completed
 * @access  Public
 */
router.put('/:id/complete-profile', async (req, res) => {
  try {
    const professional = await Professional.findById(req.params.id);
    
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found'
      });
    }
    
    const updatedProfessional = await professional.completeProfile();
    
    res.json({
      success: true,
      message: 'Profile marked as completed',
      data: updatedProfessional
    });
    
  } catch (error) {
    console.error('Error completing profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing profile',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/professionals/:id/application-limit
 * @desc    Check professional's monthly application limit
 * @access  Public
 */
router.get('/:id/application-limit', async (req, res) => {
  try {
    const professional = await Professional.findById(req.params.id);
    
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found'
      });
    }
    
    const limitStatus = await professional.canApplyToMoreJobs();
    
    res.json({
      success: true,
      data: limitStatus
    });
    
  } catch (error) {
    console.error('Error checking application limit:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking application limit',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/professionals/:id/curriculum
 * @desc    Get professional's curriculum
 * @access  Public
 */
router.get('/:id/curriculum', async (req, res) => {
  try {
    const professional = await Professional.findById(req.params.id);
    
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found'
      });
    }
    
    const curriculum = await professional.getCurriculum();
    
    if (!curriculum) {
      return res.status(404).json({
        success: false,
        message: 'Curriculum not found for this professional'
      });
    }
    
    res.json({
      success: true,
      data: curriculum
    });
    
  } catch (error) {
    console.error('Error fetching curriculum:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching curriculum',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/professionals/:id/professions
 * @desc    Get professional's professions through curriculum
 * @access  Public
 */
router.get('/:id/professions', async (req, res) => {
  try {
    const professional = await Professional.findById(req.params.id);
    
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found'
      });
    }
    
    const professions = await professional.getProfessions();
    
    res.json({
      success: true,
      data: professions
    });
    
  } catch (error) {
    console.error('Error fetching professions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching professions',
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
        // Convert CSV row to professional object (basic fields only)
        const professional = {
          cedula: row.cedula || row.Cedula,
          firstName: row.firstName || row.FirstName || row.first_name,
          lastName: row.lastName || row.LastName || row.last_name,
          email: row.email || row.Email,
          phone: row.phone || row.Phone,
          canton: row.canton || row.Canton,
          address: row.address || row.Address,
          birthDate: row.birthDate || row.BirthDate || row.birth_date,
          gender: row.gender || row.Gender
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