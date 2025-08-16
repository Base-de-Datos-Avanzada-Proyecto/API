/**
 * Application REST Routes
 * ITI-821 Advanced Database Course
 * 
 * Implements REST API endpoints for job application operations
 */

const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Professional = require('../models/Professional');
const JobOffer = require('../models/JobOffer');
const Employer = require('../models/Employer');

/**
 * @route   GET /api/applications
 * @desc    Get all applications with optional filtering
 * @access  Public (in real app would be protected)
 */
router.get('/', async (req, res) => {
  try {
    const {
      status,
      priority,
      professionalId,
      jobOfferId,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'appliedAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (professionalId) filter.professionalId = professionalId;
    if (jobOfferId) filter.jobOfferId = jobOfferId;
    
    if (startDate || endDate) {
      filter.appliedAt = {};
      if (startDate) filter.appliedAt.$gte = new Date(startDate);
      if (endDate) filter.appliedAt.$lte = new Date(endDate);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const applications = await Application.find(filter)
      .populate('professionalId', 'firstName lastName email phone')
      .populate('jobOfferId', 'title description workType workModality')
      .populate('reviewedBy', 'companyName contactEmail')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const totalCount = await Application.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json({
      success: true,
      message: 'Applications retrieved successfully',
      data: {
        applications,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Error retrieving applications:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving applications',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/applications/:id
 * @desc    Get single application by ID
 * @access  Public (in real app would be protected)
 */
router.get('/:id', async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('professionalId')
      .populate('jobOfferId')
      .populate('reviewedBy');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Application retrieved successfully',
      data: application
    });

  } catch (error) {
    console.error('Error retrieving application:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving application',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/applications
 * @desc    Create new application
 * @access  Public (in real app would be protected)
 */
router.post('/', async (req, res) => {
  try {
    const applicationData = req.body;

    // Validate required fields
    if (!applicationData.professionalId || !applicationData.jobOfferId) {
      return res.status(400).json({
        success: false,
        message: 'Professional ID and Job Offer ID are required'
      });
    }

    // Check if professional can apply
    const canApply = await Application.canProfessionalApply(
      applicationData.professionalId,
      applicationData.jobOfferId
    );

    if (!canApply.canApply) {
      return res.status(400).json({
        success: false,
        message: canApply.reason
      });
    }

    // Verify that professional and job offer exist
    const professional = await Professional.findById(applicationData.professionalId);
    const jobOffer = await JobOffer.findById(applicationData.jobOfferId);

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Professional not found'
      });
    }

    if (!jobOffer) {
      return res.status(404).json({
        success: false,
        message: 'Job offer not found'
      });
    }

    // Check if job offer is still active and accepting applications
    if (!jobOffer.isActive || jobOffer.status !== 'Published') {
      return res.status(400).json({
        success: false,
        message: 'Job offer is not accepting applications'
      });
    }

    // Check application deadline
    if (new Date() > jobOffer.applicationDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Application deadline has passed'
      });
    }

    const application = new Application(applicationData);
    await application.save();

    // Populate references for response
    await application.populate('professionalId jobOfferId');

    res.status(201).json({
      success: true,
      message: 'Application created successfully',
      data: application
    });

  } catch (error) {
    console.error('Error creating application:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating application',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/applications/:id
 * @desc    Update application (only if pending)
 * @access  Public (in real app would be protected)
 */
router.put('/:id', async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Can only update pending applications
    if (application.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update reviewed application'
      });
    }

    Object.assign(application, req.body);
    await application.save();

    await application.populate('professionalId jobOfferId reviewedBy');

    res.status(200).json({
      success: true,
      message: 'Application updated successfully',
      data: application
    });

  } catch (error) {
    console.error('Error updating application:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating application',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/applications/:id
 * @desc    Delete application (soft delete, only if pending)
 * @access  Public (in real app would be protected)
 */
router.delete('/:id', async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Can only delete pending applications
    if (application.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete reviewed application'
      });
    }

    application.isActive = false;
    await application.save();

    res.status(200).json({
      success: true,
      message: 'Application deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting application',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/applications/professional/:professionalId
 * @desc    Get applications by professional
 * @access  Public (in real app would be protected)
 */
router.get('/professional/:professionalId', async (req, res) => {
  try {
    const { professionalId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const applications = await Application.findByProfessional(professionalId, status)
      .skip(skip)
      .limit(limitNum);

    const filter = { professionalId };
    if (status) filter.status = status;
    const totalCount = await Application.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json({
      success: true,
      message: 'Applications by professional retrieved successfully',
      data: {
        applications,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Error retrieving applications by professional:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving applications by professional',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/applications/job-offer/:jobOfferId
 * @desc    Get applications by job offer
 * @access  Public (in real app would be protected)
 */
router.get('/job-offer/:jobOfferId', async (req, res) => {
  try {
    const { jobOfferId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const applications = await Application.findByJobOffer(jobOfferId, status)
      .skip(skip)
      .limit(limitNum);

    const filter = { jobOfferId };
    if (status) filter.status = status;
    const totalCount = await Application.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json({
      success: true,
      message: 'Applications by job offer retrieved successfully',
      data: {
        applications,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Error retrieving applications by job offer:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving applications by job offer',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/applications/:id/review
 * @desc    Review application (accept/reject)
 * @access  Public (in real app would be protected)
 */
router.post('/:id/review', async (req, res) => {
  try {
    const { status, notes, reviewerId } = req.body;

    if (!status || !['Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status (Accepted or Rejected) is required'
      });
    }

    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    application.status = status;
    application.reviewedAt = new Date();
    if (notes) application.notes = notes;
    if (reviewerId) application.reviewedBy = reviewerId;

    await application.save();
    await application.populate('professionalId jobOfferId reviewedBy');

    res.status(200).json({
      success: true,
      message: `Application ${status.toLowerCase()} successfully`,
      data: application
    });

  } catch (error) {
    console.error('Error reviewing application:', error);
    res.status(500).json({
      success: false,
      message: 'Error reviewing application',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/applications/:id/priority
 * @desc    Set application priority
 * @access  Public (in real app would be protected)
 */
router.post('/:id/priority', async (req, res) => {
  try {
    const { priority } = req.body;

    if (!priority || !['Low', 'Medium', 'High'].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Valid priority (Low, Medium, or High) is required'
      });
    }

    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    await application.setPriority(priority);
    await application.populate('professionalId jobOfferId reviewedBy');

    res.status(200).json({
      success: true,
      message: 'Application priority updated successfully',
      data: application
    });

  } catch (error) {
    console.error('Error updating application priority:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating application priority',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/applications/check-eligibility/:professionalId/:jobOfferId
 * @desc    Check if professional can apply to job offer
 * @access  Public (in real app would be protected)
 */
router.get('/check-eligibility/:professionalId/:jobOfferId', async (req, res) => {
  try {
    const { professionalId, jobOfferId } = req.params;

    const result = await Application.canProfessionalApply(professionalId, jobOfferId);
    const monthlyCount = await Application.getMonthlyCount(professionalId);

    res.status(200).json({
      success: true,
      message: 'Eligibility check completed',
      data: {
        canApply: result.canApply,
        reason: result.reason,
        monthlyApplicationsCount: monthlyCount,
        monthlyLimit: 3
      }
    });

  } catch (error) {
    console.error('Error checking application eligibility:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking application eligibility',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/applications/stats
 * @desc    Get application statistics
 * @access  Public (in real app would be protected)
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await Application.getStats();

    res.status(200).json({
      success: true,
      message: 'Application statistics retrieved successfully',
      data: stats
    });

  } catch (error) {
    console.error('Error retrieving application statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving application statistics',
      error: error.message
    });
  }
});

module.exports = router;