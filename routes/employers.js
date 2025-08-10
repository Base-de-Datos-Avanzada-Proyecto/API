/**
 * Employer Routes
 * ITI-821 Advanced Database Course
 * 
 * REST API routes for employer registration and management
 * Supports both individual persons (física) and legal entities (jurídica)
 */

const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const Employer = require('../models/Employer');
const Profession = require('../models/Profession');
const { validateEmployer, validateBulkUpload } = require('../middleware/validation');

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
 * @route   GET /api/employers
 * @desc    Get all employers with optional filtering
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { 
      canton, 
      employerType, 
      businessSector, 
      isVerified, 
      page = 1, 
      limit = 10 
    } = req.query;
    
    // Build filter object
    const filter = { isActive: true };
    if (canton) filter.canton = canton;
    if (employerType) filter.employerType = employerType;
    if (businessSector) filter.businessSector = new RegExp(businessSector, 'i');
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with population
    const employers = await Employer.find(filter)
      .populate('preferredProfessions', 'name code category')
      .sort({ registrationDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await Employer.countDocuments(filter);
    
    res.json({
      success: true,
      data: employers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        hasNext: skip + employers.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
    
  } catch (error) {
    console.error('Error fetching employers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employers',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/employers/:id
 * @desc    Get employer by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const employer = await Employer.findById(req.params.id)
      .populate('preferredProfessions', 'name code category description');
    
    if (!employer) {
      return res.status(404).json({
        success: false,
        message: 'Employer not found'
      });
    }
    
    res.json({
      success: true,
      data: employer
    });
    
  } catch (error) {
    console.error('Error fetching employer:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employer',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/employers/identification/:identification
 * @desc    Get employer by identification
 * @access  Public
 */
router.get('/identification/:identification', async (req, res) => {
  try {
    const employer = await Employer.findOne({ identification: req.params.identification })
      .populate('preferredProfessions', 'name code category description');
    
    if (!employer) {
      return res.status(404).json({
        success: false,
        message: 'Employer not found with the provided identification'
      });
    }
    
    res.json({
      success: true,
      data: employer
    });
    
  } catch (error) {
    console.error('Error fetching employer by identification:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employer',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/employers
 * @desc    Register a new employer
 * @access  Public
 */
router.post('/', validateEmployer, async (req, res) => {
  try {
    const {
      identification, employerType, name, lastName, legalName, businessSector,
      email, phone, alternativePhone, canton, address, website, description,
      expectedHires, preferredProfessionIds, registrationNumber
    } = req.body;
    
    // Check if employer already exists
    const existingEmployer = await Employer.findOne({
      $or: [{ identification }, { email }]
    });
    
    if (existingEmployer) {
      return res.status(400).json({
        success: false,
        message: 'Employer already exists with this identification or email'
      });
    }
    
    // Validate preferred profession IDs if provided
    if (preferredProfessionIds && preferredProfessionIds.length > 0) {
      const validProfessions = await Profession.find({
        _id: { $in: preferredProfessionIds },
        isActive: true
      });
      
      if (validProfessions.length !== preferredProfessionIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more preferred profession IDs are invalid'
        });
      }
    }
    
    // Create employer document
    const employer = new Employer({
      identification,
      employerType,
      name,
      lastName,
      legalName,
      businessSector,
      email,
      phone,
      alternativePhone,
      canton,
      address,
      website,
      description,
      expectedHires,
      preferredProfessions: preferredProfessionIds || [],
      registrationNumber
    });
    
    await employer.save();
    
    // Populate profession data for response
    await employer.populate('preferredProfessions');
    
    res.status(201).json({
      success: true,
      message: 'Employer registered successfully',
      data: employer
    });
    
  } catch (error) {
    console.error('Error registering employer:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error registering employer',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/employers/:id
 * @desc    Update employer information
 * @access  Public
 */
router.put('/:id', validateEmployer, async (req, res) => {
  try {
    const employer = await Employer.findById(req.params.id);
    
    if (!employer) {
      return res.status(404).json({
        success: false,
        message: 'Employer not found'
      });
    }
    
    // Update fields
    const updatableFields = [
      'name', 'lastName', 'legalName', 'businessSector', 'email', 'phone', 
      'alternativePhone', 'canton', 'address', 'website', 'description',
      'expectedHires', 'registrationNumber'
    ];
    
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        employer[field] = req.body[field];
      }
    });
    
    // Handle preferred profession updates if provided
    if (req.body.preferredProfessionIds) {
      const validProfessions = await Profession.find({
        _id: { $in: req.body.preferredProfessionIds },
        isActive: true
      });
      
      if (validProfessions.length !== req.body.preferredProfessionIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more preferred profession IDs are invalid'
        });
      }
      
      employer.preferredProfessions = req.body.preferredProfessionIds;
    }
    
    await employer.save();
    await employer.populate('preferredProfessions');
    
    res.json({
      success: true,
      message: 'Employer updated successfully',
      data: employer
    });
    
  } catch (error) {
    console.error('Error updating employer:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating employer',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/employers/bulk-upload
 * @desc    Bulk upload employers from CSV or JSON file
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
    
    let employers = [];
    
    if (fileExtension === '.csv') {
      // Process CSV file
      employers = await processCsvFile(filePath);
    } else if (fileExtension === '.json') {
      // Process JSON file
      const fileContent = fs.readFileSync(filePath, 'utf8');
      employers = JSON.parse(fileContent);
    }
    
    // Validate and process each employer
    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };
    
    for (let i = 0; i < employers.length; i++) {
      try {
        const employerData = employers[i];
        
        // Validate required fields
        if (!employerData.identification || !employerData.employerType || 
            !employerData.name || !employerData.email) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            error: 'Missing required fields (identification, employerType, name, email)'
          });
          continue;
        }
        
        // Check if employer already exists
        const existing = await Employer.findOne({
          $or: [
            { identification: employerData.identification },
            { email: employerData.email }
          ]
        });
        
        if (existing) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            error: 'Employer already exists with this identification or email'
          });
          continue;
        }
        
        // Process preferred profession names/codes to IDs
        let preferredProfessionIds = [];
        if (employerData.preferredProfessions) {
          const professionNames = Array.isArray(employerData.preferredProfessions) 
            ? employerData.preferredProfessions 
            : employerData.preferredProfessions.split(',').map(p => p.trim());
          
          for (const profName of professionNames) {
            const profession = await Profession.findOne({
              $or: [
                { name: new RegExp(`^${profName}$`, 'i') },
                { code: profName.toUpperCase() }
              ],
              isActive: true
            });
            
            if (profession) {
              preferredProfessionIds.push(profession._id);
            }
          }
        }
        
        // Create employer
        const employer = new Employer({
          identification: employerData.identification,
          employerType: employerData.employerType,
          name: employerData.name,
          lastName: employerData.lastName,
          legalName: employerData.legalName,
          businessSector: employerData.businessSector,
          email: employerData.email,
          phone: employerData.phone,
          alternativePhone: employerData.alternativePhone,
          canton: employerData.canton,
          address: employerData.address,
          website: employerData.website,
          description: employerData.description,
          expectedHires: employerData.expectedHires,
          preferredProfessions: preferredProfessionIds,
          registrationNumber: employerData.registrationNumber
        });
        
        await employer.save();
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
 * @route   GET /api/employers/stats/overview
 * @desc    Get employers statistics overview
 * @access  Public
 */
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await Employer.getStats();
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Error getting employer stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting statistics',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/employers/by-type/:type
 * @desc    Get employers by type (fisica/juridica)
 * @access  Public
 */
router.get('/by-type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['fisica', 'juridica'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employer type. Must be "fisica" or "juridica"'
      });
    }
    
    const employers = await Employer.findByType(type);
    
    res.json({
      success: true,
      data: employers
    });
    
  } catch (error) {
    console.error('Error getting employers by type:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employers',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/employers/by-canton/:canton
 * @desc    Get employers by canton
 * @access  Public
 */
router.get('/by-canton/:canton', async (req, res) => {
  try {
    const employers = await Employer.findByCanton(req.params.canton);
    
    res.json({
      success: true,
      data: employers
    });
    
  } catch (error) {
    console.error('Error getting employers by canton:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employers',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/employers/verified
 * @desc    Get verified employers
 * @access  Public
 */
router.get('/verified', async (req, res) => {
  try {
    const employers = await Employer.findVerified();
    
    res.json({
      success: true,
      data: employers
    });
    
  } catch (error) {
    console.error('Error getting verified employers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching verified employers',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/employers/:id/verify
 * @desc    Verify an employer
 * @access  Public (should be protected in production)
 */
router.put('/:id/verify', async (req, res) => {
  try {
    const employer = await Employer.findById(req.params.id);
    
    if (!employer) {
      return res.status(404).json({
        success: false,
        message: 'Employer not found'
      });
    }
    
    await employer.verify();
    
    res.json({
      success: true,
      message: 'Employer verified successfully',
      data: employer
    });
    
  } catch (error) {
    console.error('Error verifying employer:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying employer',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/employers/:id/preferred-professions
 * @desc    Update employer's preferred professions
 * @access  Public
 */
router.put('/:id/preferred-professions', async (req, res) => {
  try {
    const { preferredProfessionIds } = req.body;
    
    if (!Array.isArray(preferredProfessionIds)) {
      return res.status(400).json({
        success: false,
        message: 'preferredProfessionIds must be an array'
      });
    }
    
    const employer = await Employer.findById(req.params.id);
    
    if (!employer) {
      return res.status(404).json({
        success: false,
        message: 'Employer not found'
      });
    }
    
    // Validate profession IDs
    const validProfessions = await Profession.find({
      _id: { $in: preferredProfessionIds },
      isActive: true
    });
    
    if (validProfessions.length !== preferredProfessionIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more profession IDs are invalid'
      });
    }
    
    employer.preferredProfessions = preferredProfessionIds;
    await employer.save();
    await employer.populate('preferredProfessions');
    
    res.json({
      success: true,
      message: 'Preferred professions updated successfully',
      data: employer
    });
    
  } catch (error) {
    console.error('Error updating preferred professions:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating preferred professions',
      error: error.message
    });
  }
});

/**
 * Helper function to process CSV file
 * @param {string} filePath - Path to the CSV file
 * @returns {Promise<Array>} Array of employer objects
 */
function processCsvFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // Convert CSV row to employer object
        const employer = {
          identification: row.identification || row.Identification,
          employerType: row.employerType || row.EmployerType || row.employer_type,
          name: row.name || row.Name,
          lastName: row.lastName || row.LastName || row.last_name,
          legalName: row.legalName || row.LegalName || row.legal_name,
          businessSector: row.businessSector || row.BusinessSector || row.business_sector,
          email: row.email || row.Email,
          phone: row.phone || row.Phone,
          alternativePhone: row.alternativePhone || row.AlternativePhone || row.alternative_phone,
          canton: row.canton || row.Canton,
          address: row.address || row.Address,
          website: row.website || row.Website,
          description: row.description || row.Description,
          expectedHires: parseInt(row.expectedHires || row.ExpectedHires || row.expected_hires) || null,
          preferredProfessions: row.preferredProfessions || row.PreferredProfessions || row.preferred_professions,
          registrationNumber: row.registrationNumber || row.RegistrationNumber || row.registration_number
        };
        
        results.push(employer);
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