/**
 * Curriculum Routes
 * ITI-821 Advanced Database Course
 * 
 * REST API routes for curriculum management (Digital Resume)
 * Works with Curriculum model for professional digital resumes
 */

const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const Curriculum = require('../models/Curriculum');
const Professional = require('../models/Professional');
const Profession = require('../models/Profession');
const { validateCurriculum, validateBulkUpload } = require('../middleware/validation');

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
 * @route   GET /api/curricula
 * @desc    Get all curricula with optional filtering
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { 
      profession, 
      educationLevel, 
      skillCategory, 
      isComplete, 
      isPublic = true,
      hasWorkExperience,
      minExperienceYears,
      maxExperienceYears,
      searchText,
      page = 1, 
      limit = 10 
    } = req.query;
    
    // Build filter object
    const filter = {};
    
    // Default to public curricula only
    if (isPublic !== undefined) filter.isPublic = isPublic === 'true';
    if (isComplete !== undefined) filter.isComplete = isComplete === 'true';
    
    // Filter by profession through professions array
    if (profession) {
      const professionDoc = await Profession.findOne({ 
        $or: [{ name: new RegExp(profession, 'i') }, { code: profession.toUpperCase() }]
      });
      
      if (professionDoc) {
        filter['professions.professionId'] = professionDoc._id;
      } else {
        // No profession found, return empty results
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
    
    // Filter by education level
    if (educationLevel) {
      filter['education.educationLevel'] = educationLevel;
    }
    
    // Filter by skill category
    if (skillCategory) {
      filter['skills.category'] = skillCategory;
    }
    
    // Filter by work experience existence
    if (hasWorkExperience !== undefined) {
      if (hasWorkExperience === 'true') {
        filter['workExperience.0'] = { $exists: true };
      } else {
        filter.workExperience = { $size: 0 };
      }
    }
    
    // Filter by experience years range
    if (minExperienceYears || maxExperienceYears) {
      const experienceQuery = {};
      if (minExperienceYears) {
        experienceQuery.$gte = parseInt(minExperienceYears);
      }
      if (maxExperienceYears) {
        experienceQuery.$lte = parseInt(maxExperienceYears);
      }
      filter['professions.experienceYears'] = experienceQuery;
    }
    
    // Text search across multiple fields
    if (searchText) {
      const searchRegex = new RegExp(searchText, 'i');
      filter.$or = [
        { summary: searchRegex },
        { objectives: searchRegex },
        { 'education.institution': searchRegex },
        { 'education.degree': searchRegex },
        { 'workExperience.company': searchRegex },
        { 'workExperience.position': searchRegex },
        { 'skills.name': searchRegex }
      ];
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const curricula = await Curriculum.find(filter)
      .populate('professionalId')
      .populate('professions.professionId')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await Curriculum.countDocuments(filter);
    
    res.json({
      success: true,
      data: curricula,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        hasNext: skip + curricula.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
    
  } catch (error) {
    console.error('Error fetching curricula:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching curricula',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/curricula/:id
 * @desc    Get curriculum by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const curriculum = await Curriculum.findById(req.params.id)
      .populate('professionalId')
      .populate('professions.professionId');
    
    if (!curriculum) {
      return res.status(404).json({
        success: false,
        message: 'Curriculum not found'
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
 * @route   GET /api/curricula/professional/:professionalId
 * @desc    Get curriculum by professional ID
 * @access  Public
 */
router.get('/professional/:professionalId', async (req, res) => {
  try {
    const curriculum = await Curriculum.findOne({ professionalId: req.params.professionalId })
      .populate('professionalId')
      .populate('professions.professionId');
    
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
    console.error('Error fetching curriculum by professional:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching curriculum',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/curricula
 * @desc    Create a new curriculum
 * @access  Public
 */
router.post('/', validateCurriculum, async (req, res) => {
  try {
    const { professionalId, professions, ...curriculumData } = req.body;
    
    // Check if professional exists
    const professional = await Professional.findById(professionalId);
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found'
      });
    }
    
    // Check if curriculum already exists for this professional
    const existingCurriculum = await Curriculum.findOne({ professionalId });
    if (existingCurriculum) {
      return res.status(400).json({
        success: false,
        message: 'Curriculum already exists for this professional'
      });
    }
    
    // Validate professions exist
    if (professions && professions.length > 0) {
      for (const prof of professions) {
        const professionExists = await Profession.findById(prof.professionId);
        if (!professionExists) {
          return res.status(400).json({
            success: false,
            message: `Profession with ID ${prof.professionId} not found`
          });
        }
      }
    }
    
    // Create curriculum document
    const curriculum = new Curriculum({
      professionalId,
      professions: professions || [],
      ...curriculumData
    });
    
    await curriculum.save();
    
    // Populate the saved curriculum
    const populatedCurriculum = await Curriculum.findById(curriculum._id)
      .populate('professionalId')
      .populate('professions.professionId');
    
    res.status(201).json({
      success: true,
      message: 'Curriculum created successfully',
      data: populatedCurriculum
    });
    
  } catch (error) {
    console.error('Error creating curriculum:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating curriculum',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/curricula/:id
 * @desc    Update curriculum information
 * @access  Public
 */
router.put('/:id', validateCurriculum, async (req, res) => {
  try {
    const curriculum = await Curriculum.findById(req.params.id);
    
    if (!curriculum) {
      return res.status(404).json({
        success: false,
        message: 'Curriculum not found'
      });
    }
    
    // Validate professions if updating them
    if (req.body.professions && req.body.professions.length > 0) {
      for (const prof of req.body.professions) {
        const professionExists = await Profession.findById(prof.professionId);
        if (!professionExists) {
          return res.status(400).json({
            success: false,
            message: `Profession with ID ${prof.professionId} not found`
          });
        }
      }
    }
    
    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined && key !== 'professionalId') {
        curriculum[key] = req.body[key];
      }
    });
    
    await curriculum.save();
    
    // Populate the updated curriculum
    const updatedCurriculum = await Curriculum.findById(curriculum._id)
      .populate('professionalId')
      .populate('professions.professionId');
    
    res.json({
      success: true,
      message: 'Curriculum updated successfully',
      data: updatedCurriculum
    });
    
  } catch (error) {
    console.error('Error updating curriculum:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating curriculum',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/curricula/:id
 * @desc    Soft delete curriculum (set isPublic to false)
 * @access  Public
 */
router.delete('/:id', async (req, res) => {
  try {
    const curriculum = await Curriculum.findByIdAndUpdate(
      req.params.id,
      { isPublic: false },
      { new: true }
    );
    
    if (!curriculum) {
      return res.status(404).json({
        success: false,
        message: 'Curriculum not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Curriculum deactivated successfully'
    });
    
  } catch (error) {
    console.error('Error deactivating curriculum:', error);
    res.status(500).json({
      success: false,
      message: 'Error deactivating curriculum',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/curricula/bulk-upload
 * @desc    Bulk upload curricula from CSV or JSON file
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
    
    let curriculaData = [];
    
    if (fileExtension === '.csv') {
      // Process CSV file
      curriculaData = await processCsvFile(filePath);
    } else if (fileExtension === '.json') {
      // Process JSON file
      const fileContent = fs.readFileSync(filePath, 'utf8');
      curriculaData = JSON.parse(fileContent);
    }
    
    // Validate and process each curriculum
    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };
    
    for (let i = 0; i < curriculaData.length; i++) {
      try {
        const curriculumData = curriculaData[i];
        
        // Validate required fields
        if (!curriculumData.professionalId) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            error: 'Missing required field: professionalId'
          });
          continue;
        }
        
        // Check if professional exists
        const professional = await Professional.findById(curriculumData.professionalId);
        if (!professional) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            error: 'Professional not found'
          });
          continue;
        }
        
        // Check if curriculum already exists
        const existing = await Curriculum.findOne({ professionalId: curriculumData.professionalId });
        if (existing) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            error: 'Curriculum already exists for this professional'
          });
          continue;
        }
        
        // Create curriculum
        const curriculum = new Curriculum(curriculumData);
        await curriculum.save();
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
 * @route   GET /api/curricula/by-profession/:professionId
 * @desc    Get curricula by profession
 * @access  Public
 */
router.get('/by-profession/:professionId', async (req, res) => {
  try {
    const curricula = await Curriculum.findByProfession(req.params.professionId);
    
    res.json({
      success: true,
      data: curricula
    });
    
  } catch (error) {
    console.error('Error getting curricula by profession:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching curricula',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/curricula/by-education/:educationLevel
 * @desc    Get curricula by education level
 * @access  Public
 */
router.get('/by-education/:educationLevel', async (req, res) => {
  try {
    const curricula = await Curriculum.findByEducationLevel(req.params.educationLevel);
    
    res.json({
      success: true,
      data: curricula
    });
    
  } catch (error) {
    console.error('Error getting curricula by education level:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching curricula',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/curricula/search/:searchText
 * @desc    Search curricula by text
 * @access  Public
 */
router.get('/search/:searchText', async (req, res) => {
  try {
    const searchText = req.params.searchText;
    const searchRegex = new RegExp(searchText, 'i');
    
    const curricula = await Curriculum.find({
      isPublic: true,
      isComplete: true,
      $or: [
        { summary: searchRegex },
        { objectives: searchRegex },
        { 'education.institution': searchRegex },
        { 'education.degree': searchRegex },
        { 'workExperience.company': searchRegex },
        { 'workExperience.position': searchRegex },
        { 'skills.name': searchRegex }
      ]
    })
    .populate('professionalId')
    .populate('professions.professionId')
    .sort({ updatedAt: -1 });
    
    res.json({
      success: true,
      data: curricula
    });
    
  } catch (error) {
    console.error('Error searching curricula:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching curricula',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/curricula/:id/mark-complete
 * @desc    Mark curriculum as complete
 * @access  Public
 */
router.put('/:id/mark-complete', async (req, res) => {
  try {
    const curriculum = await Curriculum.findById(req.params.id);
    
    if (!curriculum) {
      return res.status(404).json({
        success: false,
        message: 'Curriculum not found'
      });
    }
    
    const completedCurriculum = await curriculum.markAsComplete();
    
    // Populate the completed curriculum
    const populatedCurriculum = await Curriculum.findById(completedCurriculum._id)
      .populate('professionalId')
      .populate('professions.professionId');
    
    res.json({
      success: true,
      message: 'Curriculum marked as completed',
      data: populatedCurriculum
    });
    
  } catch (error) {
    console.error('Error marking curriculum as complete:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking curriculum as complete',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/curricula/:id/toggle-visibility
 * @desc    Toggle curriculum visibility (public/private)
 * @access  Public
 */
router.put('/:id/toggle-visibility', async (req, res) => {
  try {
    const curriculum = await Curriculum.findById(req.params.id);
    
    if (!curriculum) {
      return res.status(404).json({
        success: false,
        message: 'Curriculum not found'
      });
    }
    
    curriculum.isPublic = !curriculum.isPublic;
    await curriculum.save();
    
    // Populate the updated curriculum
    const updatedCurriculum = await Curriculum.findById(curriculum._id)
      .populate('professionalId')
      .populate('professions.professionId');
    
    res.json({
      success: true,
      message: `Curriculum visibility changed to ${curriculum.isPublic ? 'public' : 'private'}`,
      data: updatedCurriculum
    });
    
  } catch (error) {
    console.error('Error toggling curriculum visibility:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling curriculum visibility',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/curricula/:id/professions
 * @desc    Add profession to curriculum
 * @access  Public
 */
router.post('/:id/professions', async (req, res) => {
  try {
    const { professionId, experienceYears, proficiencyLevel } = req.body;
    
    if (!professionId) {
      return res.status(400).json({
        success: false,
        message: 'Profession ID is required'
      });
    }
    
    const curriculum = await Curriculum.findById(req.params.id);
    if (!curriculum) {
      return res.status(404).json({
        success: false,
        message: 'Curriculum not found'
      });
    }
    
    // Check if profession exists
    const profession = await Profession.findById(professionId);
    if (!profession) {
      return res.status(404).json({
        success: false,
        message: 'Profession not found'
      });
    }
    
    const options = {};
    if (experienceYears !== undefined) options.experienceYears = experienceYears;
    if (proficiencyLevel) options.proficiencyLevel = proficiencyLevel;
    
    const updatedCurriculum = await curriculum.addProfession(professionId, options);
    
    // Populate the updated curriculum
    const populatedCurriculum = await Curriculum.findById(updatedCurriculum._id)
      .populate('professionalId')
      .populate('professions.professionId');
    
    res.json({
      success: true,
      message: 'Profession added to curriculum successfully',
      data: populatedCurriculum
    });
    
  } catch (error) {
    console.error('Error adding profession to curriculum:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding profession to curriculum',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/curricula/:id/professions/:professionId
 * @desc    Remove profession from curriculum
 * @access  Public
 */
router.delete('/:id/professions/:professionId', async (req, res) => {
  try {
    const curriculum = await Curriculum.findById(req.params.id);
    if (!curriculum) {
      return res.status(404).json({
        success: false,
        message: 'Curriculum not found'
      });
    }
    
    const updatedCurriculum = await curriculum.removeProfession(req.params.professionId);
    
    // Populate the updated curriculum
    const populatedCurriculum = await Curriculum.findById(updatedCurriculum._id)
      .populate('professionalId')
      .populate('professions.professionId');
    
    res.json({
      success: true,
      message: 'Profession removed from curriculum successfully',
      data: populatedCurriculum
    });
    
  } catch (error) {
    console.error('Error removing profession from curriculum:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing profession from curriculum',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/curricula/stats/profession
 * @desc    Get curriculum statistics by profession
 * @access  Public
 */
router.get('/stats/profession', async (req, res) => {
  try {
    const stats = await Curriculum.getProfessionStats();
    
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
 * @route   GET /api/curricula/stats/education
 * @desc    Get curriculum statistics by education level
 * @access  Public
 */
router.get('/stats/education', async (req, res) => {
  try {
    const stats = await Curriculum.aggregate([
      { $match: { isComplete: true } },
      { $unwind: '$education' },
      {
        $group: {
          _id: '$education.educationLevel',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    const total = stats.reduce((sum, stat) => sum + stat.count, 0);
    
    const formattedStats = stats.map(stat => ({
      educationLevel: stat._id,
      count: stat.count,
      percentage: parseFloat(((stat.count / total) * 100).toFixed(2))
    }));
    
    res.json({
      success: true,
      data: formattedStats
    });
    
  } catch (error) {
    console.error('Error getting education stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting statistics',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/curricula/stats/skills
 * @desc    Get curriculum statistics by skill category
 * @access  Public
 */
router.get('/stats/skills', async (req, res) => {
  try {
    const stats = await Curriculum.aggregate([
      { $match: { isComplete: true } },
      { $unwind: '$skills' },
      {
        $group: {
          _id: '$skills.category',
          count: { $sum: 1 },
          avgYears: { $avg: '$skills.yearsOfExperience' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    const formattedStats = stats.map(stat => ({
      category: stat._id,
      count: stat.count,
      avgYears: parseFloat(stat.avgYears.toFixed(1))
    }));
    
    res.json({
      success: true,
      data: formattedStats
    });
    
  } catch (error) {
    console.error('Error getting skill stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting statistics',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/curricula/stats/general
 * @desc    Get general curriculum statistics
 * @access  Public
 */
router.get('/stats/general', async (req, res) => {
  try {
    const totalCurricula = await Curriculum.countDocuments();
    const completedCurricula = await Curriculum.countDocuments({ isComplete: true });
    const publicCurricula = await Curriculum.countDocuments({ isPublic: true });
    const recentlyUpdated = await Curriculum.countDocuments({
      updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    });
    
    const stats = {
      total: totalCurricula,
      completed: completedCurricula,
      public: publicCurricula,
      recentlyUpdated: recentlyUpdated,
      completionRate: totalCurricula > 0 ? parseFloat(((completedCurricula / totalCurricula) * 100).toFixed(2)) : 0
    };
    
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
 * Helper function to process CSV file
 * @param {string} filePath - Path to the CSV file
 * @returns {Promise<Array>} Array of curriculum objects
 */
function processCsvFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // Convert CSV row to curriculum object
        const curriculum = {
          professionalId: row.professionalId || row.ProfessionalId,
          summary: row.summary || row.Summary,
          objectives: row.objectives || row.Objectives,
          isPublic: row.isPublic ? row.isPublic.toLowerCase() === 'true' : true,
          // Add more fields as needed based on CSV structure
        };
        
        results.push(curriculum);
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