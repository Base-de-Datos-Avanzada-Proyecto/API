/**
 * Job Offer Routes
 * ITI-821 Advanced Database Course
 * 
 * REST API routes for job offer management and operations
 * Supports CRUD operations, filtering, and bulk uploads
 */

const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const JobOffer = require('../models/JobOffer');
const Employer = require('../models/Employer');
const Profession = require('../models/Profession');
const { validateJobOffer, validateBulkUpload } = require('../middleware/validation');

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
 * @route   GET /api/job-offers
 * @desc    Get all job offers with optional filtering
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { 
      canton, 
      workType, 
      workModality, 
      status,
      employerId,
      professionId,
      isActive,
      isFeatured,
      page = 1, 
      limit = 10 
    } = req.query;
    
    // Build filter object
    const filter = {};
    if (canton) filter['location.canton'] = canton;
    if (workType) filter.workType = workType;
    if (workModality) filter.workModality = workModality;
    if (status) filter.status = status;
    if (employerId) filter.employerId = employerId;
    if (professionId) filter.requiredProfessions = professionId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true';
    
    // Only show non-expired offers by default
    if (!req.query.includeExpired) {
      filter.applicationDeadline = { $gt: new Date() };
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with population
    const jobOffers = await JobOffer.find(filter)
      .populate('employerId', 'name legalName email canton businessSector')
      .populate('requiredProfessions', 'name code category description')
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await JobOffer.countDocuments(filter);
    
    res.json({
      success: true,
      data: jobOffers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        hasNext: skip + jobOffers.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
    
  } catch (error) {
    console.error('Error fetching job offers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job offers',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/job-offers/:id
 * @desc    Get job offer by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const jobOffer = await JobOffer.findById(req.params.id)
      .populate('employerId', 'name legalName email phone canton businessSector address website')
      .populate('requiredProfessions', 'name code category description skills requirements');
    
    if (!jobOffer) {
      return res.status(404).json({
        success: false,
        message: 'Job offer not found'
      });
    }
    
    // Increment view count
    await jobOffer.incrementViews();
    
    res.json({
      success: true,
      data: jobOffer
    });
    
  } catch (error) {
    console.error('Error fetching job offer:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job offer',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/job-offers
 * @desc    Create a new job offer
 * @access  Public
 */
router.post('/', validateJobOffer, async (req, res) => {
  try {
    const {
      title, description, employerId, requiredProfessionIds, workType, workModality,
      location, salary, requirements, preferredSkills, experienceRequired, educationLevel,
      applicationDeadline, maxApplications, contactEmail, contactPhone
    } = req.body;
    
    // Verify employer exists
    const employer = await Employer.findById(employerId);
    if (!employer) {
      return res.status(400).json({
        success: false,
        message: 'Employer not found'
      });
    }
    
    // Validate required profession IDs
    if (!requiredProfessionIds || requiredProfessionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one required profession must be specified'
      });
    }
    
    const validProfessions = await Profession.find({
      _id: { $in: requiredProfessionIds },
      isActive: true
    });
    
    if (validProfessions.length !== requiredProfessionIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more required profession IDs are invalid'
      });
    }
    
    // Use employer's contact info if not provided
    const finalContactEmail = contactEmail || employer.email;
    const finalContactPhone = contactPhone || employer.phone;
    
    // Create job offer document
    const jobOffer = new JobOffer({
      title,
      description,
      employerId,
      requiredProfessions: requiredProfessionIds,
      workType,
      workModality,
      location,
      salary,
      requirements,
      preferredSkills,
      experienceRequired,
      educationLevel,
      applicationDeadline,
      maxApplications,
      contactEmail: finalContactEmail,
      contactPhone: finalContactPhone
    });
    
    await jobOffer.save();
    
    // Populate data for response
    await jobOffer.populate([
      { path: 'employerId', select: 'name legalName email canton businessSector' },
      { path: 'requiredProfessions', select: 'name code category description' }
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Job offer created successfully',
      data: jobOffer
    });
    
  } catch (error) {
    console.error('Error creating job offer:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating job offer',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/job-offers/:id
 * @desc    Update job offer information
 * @access  Public
 */
router.put('/:id', validateJobOffer, async (req, res) => {
  try {
    const jobOffer = await JobOffer.findById(req.params.id);
    
    if (!jobOffer) {
      return res.status(404).json({
        success: false,
        message: 'Job offer not found'
      });
    }
    
    // Update fields
    const updatableFields = [
      'title', 'description', 'workType', 'workModality', 'location', 'salary',
      'requirements', 'preferredSkills', 'experienceRequired', 'educationLevel',
      'applicationDeadline', 'maxApplications', 'contactEmail', 'contactPhone'
    ];
    
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        jobOffer[field] = req.body[field];
      }
    });
    
    // Handle required profession updates if provided
    if (req.body.requiredProfessionIds) {
      const validProfessions = await Profession.find({
        _id: { $in: req.body.requiredProfessionIds },
        isActive: true
      });
      
      if (validProfessions.length !== req.body.requiredProfessionIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more required profession IDs are invalid'
        });
      }
      
      jobOffer.requiredProfessions = req.body.requiredProfessionIds;
    }
    
    await jobOffer.save();
    await jobOffer.populate([
      { path: 'employerId', select: 'name legalName email canton businessSector' },
      { path: 'requiredProfessions', select: 'name code category description' }
    ]);
    
    res.json({
      success: true,
      message: 'Job offer updated successfully',
      data: jobOffer
    });
    
  } catch (error) {
    console.error('Error updating job offer:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating job offer',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/job-offers/:id/publish
 * @desc    Publish a job offer
 * @access  Public
 */
router.put('/:id/publish', async (req, res) => {
  try {
    const jobOffer = await JobOffer.findById(req.params.id);
    
    if (!jobOffer) {
      return res.status(404).json({
        success: false,
        message: 'Job offer not found'
      });
    }
    
    await jobOffer.publish();
    await jobOffer.populate([
      { path: 'employerId', select: 'name legalName email canton businessSector' },
      { path: 'requiredProfessions', select: 'name code category description' }
    ]);
    
    res.json({
      success: true,
      message: 'Job offer published successfully',
      data: jobOffer
    });
    
  } catch (error) {
    console.error('Error publishing job offer:', error);
    res.status(500).json({
      success: false,
      message: 'Error publishing job offer',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/job-offers/:id/pause
 * @desc    Pause a job offer
 * @access  Public
 */
router.put('/:id/pause', async (req, res) => {
  try {
    const jobOffer = await JobOffer.findById(req.params.id);
    
    if (!jobOffer) {
      return res.status(404).json({
        success: false,
        message: 'Job offer not found'
      });
    }
    
    await jobOffer.pause();
    
    res.json({
      success: true,
      message: 'Job offer paused successfully',
      data: jobOffer
    });
    
  } catch (error) {
    console.error('Error pausing job offer:', error);
    res.status(500).json({
      success: false,
      message: 'Error pausing job offer',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/job-offers/:id/close
 * @desc    Close a job offer
 * @access  Public
 */
router.put('/:id/close', async (req, res) => {
  try {
    const { filled = false } = req.body;
    
    const jobOffer = await JobOffer.findById(req.params.id);
    
    if (!jobOffer) {
      return res.status(404).json({
        success: false,
        message: 'Job offer not found'
      });
    }
    
    await jobOffer.close(filled);
    
    res.json({
      success: true,
      message: `Job offer ${filled ? 'filled' : 'closed'} successfully`,
      data: jobOffer
    });
    
  } catch (error) {
    console.error('Error closing job offer:', error);
    res.status(500).json({
      success: false,
      message: 'Error closing job offer',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/job-offers/by-profession/:professionId
 * @desc    Get job offers by profession
 * @access  Public
 */
router.get('/by-profession/:professionId', async (req, res) => {
  try {
    const jobOffers = await JobOffer.findByProfession(req.params.professionId);
    
    res.json({
      success: true,
      data: jobOffers
    });
    
  } catch (error) {
    console.error('Error getting job offers by profession:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job offers',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/job-offers/by-employer/:employerId
 * @desc    Get job offers by employer
 * @access  Public
 */
router.get('/by-employer/:employerId', async (req, res) => {
  try {
    const jobOffers = await JobOffer.findByEmployer(req.params.employerId);
    
    res.json({
      success: true,
      data: jobOffers
    });
    
  } catch (error) {
    console.error('Error getting job offers by employer:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job offers',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/job-offers/by-canton/:canton
 * @desc    Get job offers by canton
 * @access  Public
 */
router.get('/by-canton/:canton', async (req, res) => {
  try {
    const jobOffers = await JobOffer.findByCanton(req.params.canton);
    
    res.json({
      success: true,
      data: jobOffers
    });
    
  } catch (error) {
    console.error('Error getting job offers by canton:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job offers',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/job-offers/stats/overview
 * @desc    Get job offers statistics overview
 * @access  Public
 */
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await JobOffer.getStats();
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Error getting job offer stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting statistics',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/job-offers/bulk-upload
 * @desc    Bulk upload job offers from CSV or JSON file
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
    
    let jobOffers = [];
    
    if (fileExtension === '.csv') {
      // Process CSV file
      jobOffers = await processCsvFile(filePath);
    } else if (fileExtension === '.json') {
      // Process JSON file
      const fileContent = fs.readFileSync(filePath, 'utf8');
      jobOffers = JSON.parse(fileContent);
    }
    
    // Validate and process each job offer
    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };
    
    for (let i = 0; i < jobOffers.length; i++) {
      try {
        const offerData = jobOffers[i];
        
        // Validate required fields
        if (!offerData.title || !offerData.description || !offerData.employerId || 
            !offerData.workType || !offerData.workModality || !offerData.applicationDeadline) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            error: 'Missing required fields'
          });
          continue;
        }
        
        // Verify employer exists
        const employer = await Employer.findOne({
          $or: [
            { _id: offerData.employerId },
            { identification: offerData.employerIdentification }
          ]
        });
        
        if (!employer) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            error: 'Employer not found'
          });
          continue;
        }
        
        // Process required profession names/codes to IDs
        let requiredProfessionIds = [];
        if (offerData.requiredProfessions) {
          const professionNames = Array.isArray(offerData.requiredProfessions) 
            ? offerData.requiredProfessions 
            : offerData.requiredProfessions.split(',').map(p => p.trim());
          
          for (const profName of professionNames) {
            const profession = await Profession.findOne({
              $or: [
                { name: new RegExp(`^${profName}$`, 'i') },
                { code: profName.toUpperCase() }
              ],
              isActive: true
            });
            
            if (profession) {
              requiredProfessionIds.push(profession._id);
            }
          }
        }
        
        if (requiredProfessionIds.length === 0) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            error: 'No valid required professions found'
          });
          continue;
        }
        
        // Create job offer
        const jobOffer = new JobOffer({
          title: offerData.title,
          description: offerData.description,
          employerId: employer._id,
          requiredProfessions: requiredProfessionIds,
          workType: offerData.workType,
          workModality: offerData.workModality,
          location: {
            canton: offerData.canton,
            specificLocation: offerData.specificLocation
          },
          salary: {
            min: offerData.salaryMin ? parseFloat(offerData.salaryMin) : undefined,
            max: offerData.salaryMax ? parseFloat(offerData.salaryMax) : undefined,
            currency: offerData.salaryCurrency || 'CRC',
            isNegotiable: offerData.salaryNegotiable === 'true'
          },
          requirements: offerData.requirements ? offerData.requirements.split(',').map(r => r.trim()) : [],
          preferredSkills: offerData.preferredSkills ? offerData.preferredSkills.split(',').map(s => s.trim()) : [],
          experienceRequired: offerData.experienceRequired ? parseInt(offerData.experienceRequired) : 0,
          educationLevel: offerData.educationLevel,
          applicationDeadline: new Date(offerData.applicationDeadline),
          maxApplications: offerData.maxApplications ? parseInt(offerData.maxApplications) : 50,
          contactEmail: offerData.contactEmail || employer.email,
          contactPhone: offerData.contactPhone || employer.phone
        });
        
        await jobOffer.save();
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
 * Helper function to process CSV file
 * @param {string} filePath - Path to the CSV file
 * @returns {Promise<Array>} Array of job offer objects
 */
function processCsvFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // Convert CSV row to job offer object
        const jobOffer = {
          title: row.title || row.Title,
          description: row.description || row.Description,
          employerId: row.employerId || row.EmployerId || row.employer_id,
          employerIdentification: row.employerIdentification || row.EmployerIdentification || row.employer_identification,
          requiredProfessions: row.requiredProfessions || row.RequiredProfessions || row.required_professions,
          workType: row.workType || row.WorkType || row.work_type,
          workModality: row.workModality || row.WorkModality || row.work_modality,
          canton: row.canton || row.Canton,
          specificLocation: row.specificLocation || row.SpecificLocation || row.specific_location,
          salaryMin: row.salaryMin || row.SalaryMin || row.salary_min,
          salaryMax: row.salaryMax || row.SalaryMax || row.salary_max,
          salaryCurrency: row.salaryCurrency || row.SalaryCurrency || row.salary_currency,
          salaryNegotiable: row.salaryNegotiable || row.SalaryNegotiable || row.salary_negotiable,
          requirements: row.requirements || row.Requirements,
          preferredSkills: row.preferredSkills || row.PreferredSkills || row.preferred_skills,
          experienceRequired: row.experienceRequired || row.ExperienceRequired || row.experience_required,
          educationLevel: row.educationLevel || row.EducationLevel || row.education_level,
          applicationDeadline: row.applicationDeadline || row.ApplicationDeadline || row.application_deadline,
          maxApplications: row.maxApplications || row.MaxApplications || row.max_applications,
          contactEmail: row.contactEmail || row.ContactEmail || row.contact_email,
          contactPhone: row.contactPhone || row.ContactPhone || row.contact_phone
        };
        
        results.push(jobOffer);
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