/**
 * Application Model
 * ITI-821 Advanced Database Course
 * 
 * Defines the schema for job applications submitted by professionals
 * Handles the relationship between professionals and job offers
 */

const mongoose = require('mongoose');

/**
 * Application Schema Definition
 * Stores information about job applications from professionals to employers
 */
const applicationSchema = new mongoose.Schema({
  // References to related entities
  professionalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professional',
    required: [true, 'Professional ID is required']
  },
  
  jobOfferId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobOffer',
    required: [true, 'Job Offer ID is required']
  },
  
  // Application status
  status: {
    type: String,
    enum: {
      values: ['Pending', 'Accepted', 'Rejected'],
      message: 'Status must be: Pending, Accepted, or Rejected'
    },
    default: 'Pending'
  },
  
  // Application content
  coverLetter: {
    type: String,
    trim: true,
    maxlength: [1000, 'Cover letter cannot exceed 1000 characters']
  },
  
  motivation: {
    type: String,
    trim: true,
    maxlength: [500, 'Motivation cannot exceed 500 characters']
  },
  
  // Additional information
  expectedSalary: {
    amount: {
      type: Number,
      min: [0, 'Expected salary cannot be negative']
    },
    currency: {
      type: String,
      default: 'CRC',
      enum: ['CRC', 'USD']
    },
    isNegotiable: {
      type: Boolean,
      default: true
    }
  },
  
  availabilityDate: {
    type: Date,
    validate: {
      validator: function(date) {
        return !date || date >= new Date();
      },
      message: 'Availability date cannot be in the past'
    }
  },
  
  // Professional's additional skills for this application
  additionalSkills: [{
    type: String,
    trim: true,
    maxlength: [50, 'Each skill cannot exceed 50 characters']
  }],
  
  // Application metadata
  appliedAt: {
    type: Date,
    default: Date.now
  },
  
  reviewedAt: {
    type: Date
  },
  
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employer'
  },
  
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  
  // Application priority (can be set by employer)
  priority: {
    type: String,
    enum: {
      values: ['Low', 'Medium', 'High'],
      message: 'Priority must be: Low, Medium, or High'
    },
    default: 'Medium'
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'applications'
});

/**
 * Indexes for optimal query performance
 */
applicationSchema.index({ professionalId: 1 });
applicationSchema.index({ jobOfferId: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ appliedAt: -1 });
applicationSchema.index({ reviewedAt: -1 });
applicationSchema.index({ priority: 1 });

// Compound indexes for complex queries
applicationSchema.index({ professionalId: 1, jobOfferId: 1 }, { unique: true });
applicationSchema.index({ professionalId: 1, appliedAt: -1 });
applicationSchema.index({ jobOfferId: 1, status: 1 });
applicationSchema.index({ professionalId: 1, status: 1 });

/**
 * Virtual properties
 */
applicationSchema.virtual('isReviewed').get(function() {
  return this.status !== 'Pending';
});

applicationSchema.virtual('daysSinceApplication').get(function() {
  const today = new Date();
  const appliedDate = new Date(this.appliedAt);
  const diffTime = today - appliedDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

applicationSchema.virtual('expectedSalaryFormatted').get(function() {
  if (this.expectedSalary && this.expectedSalary.amount) {
    const negotiable = this.expectedSalary.isNegotiable ? ' (Negotiable)' : '';
    return `${this.expectedSalary.amount} ${this.expectedSalary.currency}${negotiable}`;
  }
  return 'Not specified';
});

/**
 * Instance methods
 */

/**
 * Accept the application
 * @param {ObjectId} reviewerId - ID of the employer reviewing
 * @returns {Promise<Application>} Updated application document
 */
applicationSchema.methods.accept = async function(reviewerId) {
  this.status = 'Accepted';
  this.reviewedAt = new Date();
  if (reviewerId) this.reviewedBy = reviewerId;
  return await this.save();
};

/**
 * Reject the application
 * @param {ObjectId} reviewerId - ID of the employer reviewing
 * @param {string} reason - Reason for rejection
 * @returns {Promise<Application>} Updated application document
 */
applicationSchema.methods.reject = async function(reviewerId, reason) {
  this.status = 'Rejected';
  this.reviewedAt = new Date();
  if (reviewerId) this.reviewedBy = reviewerId;
  if (reason) this.notes = reason;
  return await this.save();
};

/**
 * Update application priority
 * @param {string} priority - New priority level
 * @returns {Promise<Application>} Updated application document
 */
applicationSchema.methods.setPriority = async function(priority) {
  this.priority = priority;
  return await this.save();
};

/**
 * Static methods
 */

/**
 * Check if professional can apply to job offer
 * @param {ObjectId} professionalId - Professional ID
 * @param {ObjectId} jobOfferId - Job Offer ID
 * @returns {Promise<Object>} Object with canApply boolean and reason
 */
applicationSchema.statics.canProfessionalApply = async function(professionalId, jobOfferId) {
  // Check if already applied to this job
  const existingApplication = await this.findOne({
    professionalId,
    jobOfferId
  });
  
  if (existingApplication) {
    return {
      canApply: false,
      reason: 'Already applied to this job offer'
    };
  }
  
  // Check monthly application limit (3 per month)
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const endOfMonth = new Date(startOfMonth);
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  
  const monthlyApplications = await this.countDocuments({
    professionalId,
    appliedAt: {
      $gte: startOfMonth,
      $lt: endOfMonth
    }
  });
  
  if (monthlyApplications >= 3) {
    return {
      canApply: false,
      reason: 'Monthly application limit reached (3 applications per month)'
    };
  }
  
  return {
    canApply: true,
    reason: 'Can apply'
  };
};

/**
 * Find applications by professional
 * @param {ObjectId} professionalId - Professional ID
 * @param {string} status - Optional status filter
 * @returns {Promise<Array>} Array of applications
 */
applicationSchema.statics.findByProfessional = function(professionalId, status = null) {
  const filter = { professionalId };
  if (status) filter.status = status;
  
  return this.find(filter)
    .populate('jobOfferId')
    .populate('reviewedBy')
    .sort({ appliedAt: -1 });
};

/**
 * Find applications by job offer
 * @param {ObjectId} jobOfferId - Job Offer ID
 * @param {string} status - Optional status filter
 * @returns {Promise<Array>} Array of applications
 */
applicationSchema.statics.findByJobOffer = function(jobOfferId, status = null) {
  const filter = { jobOfferId };
  if (status) filter.status = status;
  
  return this.find(filter)
    .populate('professionalId')
    .populate('reviewedBy')
    .sort({ appliedAt: -1 });
};

/**
 * Get applications statistics
 * @returns {Promise<Object>} Statistics object
 */
applicationSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
        accepted: { $sum: { $cond: [{ $eq: ['$status', 'Accepted'] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] } },
        avgDaysToReview: {
          $avg: {
            $cond: [
              { $ne: ['$reviewedAt', null] },
              { $divide: [{ $subtract: ['$reviewedAt', '$appliedAt'] }, 86400000] },
              null
            ]
          }
        }
      }
    }
  ]);
  
  return stats[0] || {
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    avgDaysToReview: 0
  };
};

/**
 * Get monthly application count for professional
 * @param {ObjectId} professionalId - Professional ID
 * @returns {Promise<number>} Count of applications this month
 */
applicationSchema.statics.getMonthlyCount = async function(professionalId) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const endOfMonth = new Date(startOfMonth);
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  
  return await this.countDocuments({
    professionalId,
    appliedAt: {
      $gte: startOfMonth,
      $lt: endOfMonth
    }
  });
};

/**
 * Pre-save middleware
 */
applicationSchema.pre('save', async function(next) {
  // Validate application rules before saving
  if (this.isNew) {
    const canApply = await this.constructor.canProfessionalApply(
      this.professionalId, 
      this.jobOfferId
    );
    
    if (!canApply.canApply) {
      throw new Error(canApply.reason);
    }
  }
  
  // Set reviewedAt when status changes from Pending
  if (this.isModified('status') && this.status !== 'Pending' && !this.reviewedAt) {
    this.reviewedAt = new Date();
  }
  
  next();
});

/**
 * Post-save middleware to update job offer statistics
 */
applicationSchema.post('save', async function(doc) {
  try {
    const JobOffer = mongoose.model('JobOffer');
    const jobOffer = await JobOffer.findById(doc.jobOfferId);
    
    if (jobOffer) {
      jobOffer.applicationCount = await this.constructor.countDocuments({
        jobOfferId: doc.jobOfferId
      });
      await jobOffer.save({ validateBeforeSave: false });
    }
  } catch (error) {
    console.error('Error updating job offer statistics:', error);
  }
});

// Ensure virtual fields are serialized
applicationSchema.set('toJSON', { virtuals: true });
applicationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Application', applicationSchema);