/**
 * Job Offer Model
 * ITI-821 Advanced Database Course
 * 
 * Defines the schema for job offers posted by employers
 * This model is prepared for future curriculum and application modules
 */

const mongoose = require('mongoose');

/**
 * Job Offer Schema Definition
 * Stores information about available positions posted by employers
 */
const jobOfferSchema = new mongoose.Schema({
  // Basic job information
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    minlength: [5, 'Job title must be at least 5 characters'],
    maxlength: [100, 'Job title cannot exceed 100 characters']
  },
  
  description: {
    type: String,
    required: [true, 'Job description is required'],
    trim: true,
    minlength: [20, 'Job description must be at least 20 characters'],
    maxlength: [2000, 'Job description cannot exceed 2000 characters']
  },
  
  // Employer reference
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employer',
    required: [true, 'Employer ID is required']
  },
  
  // Required professions (multiple professions can be accepted)
  requiredProfessions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profession',
    required: true
  }],
  
  // Job details
  workType: {
    type: String,
    required: [true, 'Work type is required'],
    enum: {
      values: ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'],
      message: 'Work type must be one of: Full-time, Part-time, Contract, Temporary, Internship'
    }
  },
  
  workModality: {
    type: String,
    required: [true, 'Work modality is required'],
    enum: {
      values: ['On-site', 'Remote', 'Hybrid'],
      message: 'Work modality must be: On-site, Remote, or Hybrid'
    }
  },
  
  location: {
    canton: {
      type: String,
      required: [true, 'Canton is required'],
      enum: {
        values: ['Puntarenas', 'Esparza', 'MonteDeOro'],
        message: 'Canton must be one of: Puntarenas, Esparza, MonteDeOro'
      }
    },
    specificLocation: {
      type: String,
      trim: true,
      maxlength: [200, 'Specific location cannot exceed 200 characters']
    }
  },
  
  // Salary information
  salary: {
    min: {
      type: Number,
      min: [0, 'Minimum salary cannot be negative']
    },
    max: {
      type: Number,
      min: [0, 'Maximum salary cannot be negative'],
      validate: {
        validator: function(value) {
          return !this.salary.min || value >= this.salary.min;
        },
        message: 'Maximum salary must be greater than or equal to minimum salary'
      }
    },
    currency: {
      type: String,
      default: 'CRC',
      enum: ['CRC', 'USD']
    },
    isNegotiable: {
      type: Boolean,
      default: false
    }
  },
  
  // Requirements and qualifications
  requirements: [{
    type: String,
    trim: true,
    maxlength: [200, 'Each requirement cannot exceed 200 characters']
  }],
  
  preferredSkills: [{
    type: String,
    trim: true,
    maxlength: [50, 'Each skill cannot exceed 50 characters']
  }],
  
  experienceRequired: {
    type: Number,
    default: 0,
    min: [0, 'Experience required cannot be negative'],
    max: [50, 'Experience required cannot exceed 50 years']
  },
  
  educationLevel: {
    type: String,
    enum: {
      values: ['None', 'High School', 'Technical', 'Bachelor', 'Master', 'PhD'],
      message: 'Education level must be one of the specified values'
    }
  },
  
  // Application information
  applicationDeadline: {
    type: Date,
    required: [true, 'Application deadline is required'],
    validate: {
      validator: function(date) {
        return date > new Date();
      },
      message: 'Application deadline must be in the future'
    }
  },
  
  maxApplications: {
    type: Number,
    default: 50,
    min: [1, 'Maximum applications must be at least 1'],
    max: [1000, 'Maximum applications cannot exceed 1000']
  },
  
  // Job status and metadata
  isActive: {
    type: Boolean,
    default: true
  },
  
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  status: {
    type: String,
    enum: {
      values: ['Draft', 'Published', 'Paused', 'Closed', 'Filled'],
      message: 'Status must be: Draft, Published, Paused, Closed, or Filled'
    },
    default: 'Draft'
  },
  
  // Contact information for applications
  contactEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid contact email address']
  },
  
  contactPhone: {
    type: String,
    trim: true,
    match: [/^\d{4}-\d{4}$/, 'Contact phone must follow format: XXXX-XXXX']
  },
  
  // Statistics (updated by applications)
  viewCount: {
    type: Number,
    default: 0,
    min: [0, 'View count cannot be negative']
  },
  
  applicationCount: {
    type: Number,
    default: 0,
    min: [0, 'Application count cannot be negative']
  },
  
  // Timestamps
  publishedAt: {
    type: Date
  },
  
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  // Schema options
  timestamps: true,
  collection: 'job_offers'
});

/**
 * Indexes for optimal query performance
 */
jobOfferSchema.index({ employerId: 1 });
jobOfferSchema.index({ requiredProfessions: 1 });
jobOfferSchema.index({ isActive: 1 });
jobOfferSchema.index({ status: 1 });
jobOfferSchema.index({ 'location.canton': 1 });
jobOfferSchema.index({ workType: 1 });
jobOfferSchema.index({ workModality: 1 });
jobOfferSchema.index({ applicationDeadline: 1 });
jobOfferSchema.index({ publishedAt: -1 });
jobOfferSchema.index({ viewCount: -1 });

/**
 * Virtual properties
 */
jobOfferSchema.virtual('isExpired').get(function() {
  return new Date() > this.applicationDeadline;
});

jobOfferSchema.virtual('daysUntilDeadline').get(function() {
  const today = new Date();
  const deadline = new Date(this.applicationDeadline);
  const diffTime = deadline - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

jobOfferSchema.virtual('salaryRange').get(function() {
  if (this.salary.min && this.salary.max) {
    return `${this.salary.min} - ${this.salary.max} ${this.salary.currency}`;
  } else if (this.salary.min) {
    return `From ${this.salary.min} ${this.salary.currency}`;
  } else if (this.salary.max) {
    return `Up to ${this.salary.max} ${this.salary.currency}`;
  }
  return 'Salary not specified';
});

/**
 * Instance methods
 */

/**
 * Publish the job offer
 * @returns {Promise<JobOffer>} Updated job offer document
 */
jobOfferSchema.methods.publish = async function() {
  this.status = 'Published';
  this.isActive = true;
  this.publishedAt = new Date();
  this.lastUpdated = new Date();
  return await this.save();
};

/**
 * Pause the job offer
 * @returns {Promise<JobOffer>} Updated job offer document
 */
jobOfferSchema.methods.pause = async function() {
  this.status = 'Paused';
  this.lastUpdated = new Date();
  return await this.save();
};

/**
 * Close the job offer
 * @param {boolean} filled - Whether the position was filled
 * @returns {Promise<JobOffer>} Updated job offer document
 */
jobOfferSchema.methods.close = async function(filled = false) {
  this.status = filled ? 'Filled' : 'Closed';
  this.isActive = false;
  this.lastUpdated = new Date();
  return await this.save();
};

/**
 * Increment view count
 * @returns {Promise<JobOffer>} Updated job offer document
 */
jobOfferSchema.methods.incrementViews = async function() {
  this.viewCount += 1;
  return await this.save({ validateBeforeSave: false });
};

/**
 * Static methods
 */

/**
 * Find active job offers by profession
 * @param {ObjectId} professionId - Profession ID
 * @returns {Promise<Array>} Array of job offers
 */
jobOfferSchema.statics.findByProfession = function(professionId) {
  return this.find({
    requiredProfessions: professionId,
    isActive: true,
    status: 'Published',
    applicationDeadline: { $gt: new Date() }
  })
  .populate('employerId')
  .populate('requiredProfessions')
  .sort({ publishedAt: -1 });
};

/**
 * Find job offers by employer
 * @param {ObjectId} employerId - Employer ID
 * @returns {Promise<Array>} Array of job offers
 */
jobOfferSchema.statics.findByEmployer = function(employerId) {
  return this.find({ employerId })
    .populate('requiredProfessions')
    .sort({ createdAt: -1 });
};

/**
 * Find job offers by canton
 * @param {string} canton - Canton name
 * @returns {Promise<Array>} Array of job offers
 */
jobOfferSchema.statics.findByCanton = function(canton) {
  return this.find({
    'location.canton': canton,
    isActive: true,
    status: 'Published',
    applicationDeadline: { $gt: new Date() }
  })
  .populate('employerId')
  .populate('requiredProfessions')
  .sort({ publishedAt: -1 });
};

/**
 * Get job offers statistics
 * @returns {Promise<Object>} Statistics object
 */
jobOfferSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: ['$isActive', 1, 0] } },
        published: { $sum: { $cond: [{ $eq: ['$status', 'Published'] }, 1, 0] } },
        expired: { 
          $sum: { 
            $cond: [{ $lt: ['$applicationDeadline', new Date()] }, 1, 0] 
          } 
        }
      }
    }
  ]);
  
  return stats[0] || {
    total: 0,
    active: 0,
    published: 0,
    expired: 0
  };
};

/**
 * Pre-save middleware
 */
jobOfferSchema.pre('save', function(next) {
  // Update lastUpdated timestamp
  if (this.isModified() && !this.isNew) {
    this.lastUpdated = new Date();
  }
  
  // Set publishedAt when status changes to Published
  if (this.isModified('status') && this.status === 'Published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Use employer's contact info if not provided
  if (!this.contactEmail && this.employerId) {
    // Note: This would require populating employer data
    // Implementation would be handled in the route/resolver
  }
  
  next();
});

/**
 * Pre-validate middleware
 */
jobOfferSchema.pre('validate', function(next) {
  // Ensure at least one profession is required
  if (!this.requiredProfessions || this.requiredProfessions.length === 0) {
    this.invalidate('requiredProfessions', 'At least one required profession must be specified');
  }
  
  // Ensure requirements array doesn't exceed reasonable size
  if (this.requirements && this.requirements.length > 50) {
    this.invalidate('requirements', 'Cannot have more than 50 requirements');
  }
  
  next();
});

// Ensure virtual fields are serialized
jobOfferSchema.set('toJSON', { virtuals: true });
jobOfferSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('JobOffer', jobOfferSchema);