/**
 * Profession Routes
 * ITI-821 Advanced Database Course
 * 
 * REST API routes for profession catalog management
 * Handles the catalog of available professions for professionals and employers
 */

const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const Profession = require('../models/Profession');
const { validateProfession, validateBulkUpload } = require('../middleware/validation');

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
 * @route   GET /api/professions
 * @desc    Get all professions with optional filtering
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      subcategory,
      demandLevel, 
      isActive, 
      searchText,
      page = 1, 
      limit = 10 
    } = req.query;
    
    // Build filter object
    const filter = {};
    if (category) filter.category = category;
    if (subcategory) filter.subcategory = new RegExp(subcategory, 'i');
    if (demandLevel) filter.demandLevel = demandLevel;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    // Handle text search
    if (searchText) {
      const searchRegex = new RegExp(searchText, 'i');
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { skills: { $in: [searchRegex] } },
        { requirements: { $in: [searchRegex] } }
      ];
    } else {
      // Default to active professions only if no specific filter is provided
      if (isActive === undefined) filter.isActive = true;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const professions = await Profession.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await Profession.countDocuments(filter);
    
    res.json({
      success: true,
      data: professions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        hasNext: skip + professions.length < total,
        hasPrev: parseInt(page) > 1
      }
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
 * @route   GET /api/professions/:id
 * @desc    Get profession by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const profession = await Profession.findById(req.params.id);
    
    if (!profession) {
      return res.status(404).json({
        success: false,
        message: 'Profession not found'
      });
    }
    
    res.json({
      success: true,
      data: profession
    });
    
  } catch (error) {
    console.error('Error fetching profession:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profession',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/professions/code/:code
 * @desc    Get profession by code
 * @access  Public
 */
router.get('/code/:code', async (req, res) => {
  try {
    const profession = await Profession.findOne({ 
      code: req.params.code.toUpperCase(),
      isActive: true 
    });
    
    if (!profession) {
      return res.status(404).json({
        success: false,
        message: 'Profession not found with the provided code'
      });
    }
    
    res.json({
      success: true,
      data: profession
    });
    
  } catch (error) {
    console.error('Error fetching profession by code:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profession',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/professions
 * @desc    Create a new profession
 * @access  Public (should be protected in production)
 */
router.post('/', validateProfession, async (req, res) => {
  try {
    const {
      name, code, category, subcategory, description, requirements,
      skills, averageSalaryRange, demandLevel, createdBy
    } = req.body;
    
    // Check if profession already exists
    const existingProfession = await Profession.findOne({
      $or: [
        { name: new RegExp(`^${name}$`, 'i') },
        { code: code ? code.toUpperCase() : '' }
      ]
    });
    
    if (existingProfession) {
      return res.status(400).json({
        success: false,
        message: 'Profession already exists with this name or code'
      });
    }
    
    // Create profession document
    const profession = new Profession({
      name,
      code: code ? code.toUpperCase() : undefined,
      category,
      subcategory,
      description,
      requirements: requirements || [],
      skills: skills || [],
      averageSalaryRange,
      demandLevel,
      createdBy: createdBy || 'System'
    });
    
    await profession.save();
    
    res.status(201).json({
      success: true,
      message: 'Profession created successfully',
      data: profession
    });
    
  } catch (error) {
    console.error('Error creating profession:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating profession',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/professions/:id
 * @desc    Update profession information
 * @access  Public (should be protected in production)
 */
router.put('/:id', validateProfession, async (req, res) => {
  try {
    const profession = await Profession.findById(req.params.id);
    
    if (!profession) {
      return res.status(404).json({
        success: false,
        message: 'Profession not found'
      });
    }
    
    // Update fields
    const updatableFields = [
      'name', 'code', 'category', 'subcategory', 'description', 
      'requirements', 'skills', 'averageSalaryRange', 'demandLevel'
    ];
    
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'code' && req.body[field]) {
          profession[field] = req.body[field].toUpperCase();
        } else {
          profession[field] = req.body[field];
        }
      }
    });
    
    await profession.save();
    
    res.json({
      success: true,
      message: 'Profession updated successfully',
      data: profession
    });
    
  } catch (error) {
    console.error('Error updating profession:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating profession',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/professions/:id
 * @desc    Deactivate a profession (soft delete)
 * @access  Public (should be protected in production)
 */
router.delete('/:id', async (req, res) => {
  try {
    const profession = await Profession.findById(req.params.id);
    
    if (!profession) {
      return res.status(404).json({
        success: false,
        message: 'Profession not found'
      });
    }
    
    // Soft delete by setting isActive to false
    profession.isActive = false;
    await profession.save();
    
    res.json({
      success: true,
      message: 'Profession deactivated successfully'
    });
    
  } catch (error) {
    console.error('Error deactivating profession:', error);
    res.status(500).json({
      success: false,
      message: 'Error deactivating profession',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/professions/bulk-upload
 * @desc    Bulk upload professions from CSV or JSON file
 * @access  Public (should be protected in production)
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
    
    let professions = [];
    
    if (fileExtension === '.csv') {
      // Process CSV file
      professions = await processCsvFile(filePath);
    } else if (fileExtension === '.json') {
      // Process JSON file
      const fileContent = fs.readFileSync(filePath, 'utf8');
      professions = JSON.parse(fileContent);
    }
    
    // Validate and process each profession
    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };
    
    for (let i = 0; i < professions.length; i++) {
      try {
        const professionData = professions[i];
        
        // Validate required fields
        if (!professionData.name || !professionData.category || !professionData.description) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            error: 'Missing required fields (name, category, description)'
          });
          continue;
        }
        
        // Check if profession already exists
        const existing = await Profession.findOne({
          $or: [
            { name: new RegExp(`^${professionData.name}$`, 'i') },
            { code: professionData.code ? professionData.code.toUpperCase() : '' }
          ]
        });
        
        if (existing) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            error: 'Profession already exists with this name or code'
          });
          continue;
        }
        
        // Process arrays from string format if needed
        let requirements = [];
        if (professionData.requirements) {
          requirements = Array.isArray(professionData.requirements) 
            ? professionData.requirements 
            : professionData.requirements.split(',').map(r => r.trim());
        }
        
        let skills = [];
        if (professionData.skills) {
          skills = Array.isArray(professionData.skills) 
            ? professionData.skills 
            : professionData.skills.split(',').map(s => s.trim());
        }
        
        // Process salary range if provided
        let averageSalaryRange = null;
        if (professionData.salaryMin || professionData.salaryMax) {
          averageSalaryRange = {
            min: professionData.salaryMin ? parseInt(professionData.salaryMin) : null,
            max: professionData.salaryMax ? parseInt(professionData.salaryMax) : null,
            currency: professionData.salaryCurrency || 'CRC'
          };
        }
        
        // Create profession
        const profession = new Profession({
          name: professionData.name,
          code: professionData.code ? professionData.code.toUpperCase() : undefined,
          category: professionData.category,
          subcategory: professionData.subcategory,
          description: professionData.description,
          requirements,
          skills,
          averageSalaryRange,
          demandLevel: professionData.demandLevel || 'Medium',
          createdBy: professionData.createdBy || 'Bulk Upload'
        });
        
        await profession.save();
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
 * @route   GET /api/professions/category/:category
 * @desc    Get professions by category
 * @access  Public
 */
router.get('/category/:category', async (req, res) => {
  try {
    const professions = await Profession.findByCategory(req.params.category);
    
    res.json({
      success: true,
      data: professions
    });
    
  } catch (error) {
    console.error('Error getting professions by category:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching professions',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/professions/demand/:demandLevel
 * @desc    Get professions by demand level
 * @access  Public
 */
router.get('/demand/:demandLevel', async (req, res) => {
  try {
    const { demandLevel } = req.params;
    
    if (!['Low', 'Medium', 'High', 'Critical'].includes(demandLevel)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid demand level. Must be Low, Medium, High, or Critical'
      });
    }
    
    const professions = await Profession.findByDemand(demandLevel);
    
    res.json({
      success: true,
      data: professions
    });
    
  } catch (error) {
    console.error('Error getting professions by demand level:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching professions',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/professions/popular/:limit?
 * @desc    Get most popular professions
 * @access  Public
 */
router.get('/popular/:limit?', async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 10;
    const professions = await Profession.findPopular(limit);
    
    res.json({
      success: true,
      data: professions
    });
    
  } catch (error) {
    console.error('Error getting popular professions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching popular professions',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/professions/search/:searchText
 * @desc    Search professions by text
 * @access  Public
 */
router.get('/search/:searchText', async (req, res) => {
  try {
    const professions = await Profession.searchByText(req.params.searchText);
    
    res.json({
      success: true,
      data: professions
    });
    
  } catch (error) {
    console.error('Error searching professions:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching professions',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/professions/stats/overview
 * @desc    Get professions statistics overview
 * @access  Public
 */
router.get('/stats/overview', async (req, res) => {
  try {
    const [totalProfessions, activeProfessions, categoryStats, demandStats] = await Promise.all([
      Profession.countDocuments({}),
      Profession.countDocuments({ isActive: true }),
      Profession.getStatsByCategory(),
      Profession.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$demandLevel',
            count: { $sum: 1 },
            totalProfessionals: { $sum: '$registeredProfessionals' }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);
    
    const stats = {
      totalProfessions,
      activeProfessions,
      inactiveProfessions: totalProfessions - activeProfessions,
      byCategory: categoryStats,
      byDemandLevel: demandStats
    };
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Error getting profession stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting statistics',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/professions/:id/update-statistics
 * @desc    Update profession statistics (registered professionals, job offers)
 * @access  Public (should be protected in production)
 */
router.put('/:id/update-statistics', async (req, res) => {
  try {
    const profession = await Profession.findById(req.params.id);
    
    if (!profession) {
      return res.status(404).json({
        success: false,
        message: 'Profession not found'
      });
    }
    
    await profession.updateStatistics();
    
    res.json({
      success: true,
      message: 'Profession statistics updated successfully',
      data: profession
    });
    
  } catch (error) {
    console.error('Error updating profession statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating statistics',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/professions/:id/requirements
 * @desc    Add requirement to profession
 * @access  Public (should be protected in production)
 */
router.put('/:id/requirements', async (req, res) => {
  try {
    const { requirement } = req.body;
    
    if (!requirement || typeof requirement !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Requirement must be a non-empty string'
      });
    }
    
    const profession = await Profession.findById(req.params.id);
    
    if (!profession) {
      return res.status(404).json({
        success: false,
        message: 'Profession not found'
      });
    }
    
    await profession.addRequirement(requirement);
    
    res.json({
      success: true,
      message: 'Requirement added successfully',
      data: profession
    });
    
  } catch (error) {
    console.error('Error adding requirement:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding requirement',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/professions/:id/skills
 * @desc    Add skill to profession
 * @access  Public (should be protected in production)
 */
router.put('/:id/skills', async (req, res) => {
  try {
    const { skill } = req.body;
    
    if (!skill || typeof skill !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Skill must be a non-empty string'
      });
    }
    
    const profession = await Profession.findById(req.params.id);
    
    if (!profession) {
      return res.status(404).json({
        success: false,
        message: 'Profession not found'
      });
    }
    
    await profession.addSkill(skill);
    
    res.json({
      success: true,
      message: 'Skill added successfully',
      data: profession
    });
    
  } catch (error) {
    console.error('Error adding skill:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding skill',
      error: error.message
    });
  }
});

/**
 * Helper function to process CSV file
 * @param {string} filePath - Path to the CSV file
 * @returns {Promise<Array>} Array of profession objects
 */
function processCsvFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // Convert CSV row to profession object
        const profession = {
          name: row.name || row.Name,
          code: row.code || row.Code,
          category: row.category || row.Category,
          subcategory: row.subcategory || row.Subcategory || row.sub_category,
          description: row.description || row.Description,
          requirements: row.requirements || row.Requirements,
          skills: row.skills || row.Skills,
          demandLevel: row.demandLevel || row.DemandLevel || row.demand_level || 'Medium',
          salaryMin: row.salaryMin || row.SalaryMin || row.salary_min,
          salaryMax: row.salaryMax || row.SalaryMax || row.salary_max,
          salaryCurrency: row.salaryCurrency || row.SalaryCurrency || row.salary_currency || 'CRC',
          createdBy: row.createdBy || row.CreatedBy || row.created_by || 'Bulk Upload'
        };
        
        results.push(profession);
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