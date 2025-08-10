/**
 * Profession Model
 * ITI-821 Advanced Database Course
 * 
 * Defines the catalog of available professions that professionals
 * can register for and employers can request
 */

const mongoose = require('mongoose');

/**
 * Profession Schema Definition
 * Maintains a catalog of available professions/areas
 */
const professionSchema = new mongoose.Schema({
  // Basic profession information
  name: {
    type: String,
    required: [true, 'Profession name is required'],
    unique: true,
    trim: true,
    minlength: [2, 'Profession name must be at least 2 characters'],
    maxlength: [100, 'Profession name cannot exceed 100 characters']
  },
  
  code: {
    type: String,
    required: [true, 'Profession code is required'],
    unique: true,
    trim: true,
    uppercase: true,
    minlength: [2, 'Profession code must be at least 2 characters'],
    maxlength: [10, 'Profession code cannot exceed 10 characters'],
    match: [/^[A-Z0-9]+$/, 'Profession code must contain only uppercase letters and numbers']
  },
  
  // Categorization
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    enum: {
      values: [
        'Technology',
        'Healthcare',
        'Education',
        'Engineering',
        'Business',
        'Arts',
        'Services',
        'Construction',
        'Agriculture',
        'Transportation',
        'Other'
      ],
      message: 'Category must be one of the predefined values'
    }
  },
  
  subcategory: {
    type: String,
    trim: true,
    maxlength: [50, 'Subcategory cannot exceed 50 characters']
  },
  
  // Description and requirements
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  requirements: [{
    type: String,
    trim: true,
    maxlength: [200, 'Each requirement cannot exceed 200 characters']
  }],
  
  // Skills associated with this profession
  skills: [{
    type: String,
    trim: true,
    maxlength: [50, 'Each skill cannot exceed 50 characters']
  }],
  
  // Salary information (optional)
  averageSalaryRange: {
    min: {
      type: Number,
      min: [0, 'Minimum salary cannot be negative']
    },
    max: {
      type: Number,
      min: [0, 'Maximum salary cannot be negative'],
      validate: {
        validator: function(value) {
          return !this.averageSalaryRange.min || value >= this.averageSalaryRange.min;
        },
        message: 'Maximum salary must be greater than or equal to minimum salary'
      }
    },
    currency: {
      type: String,
      default: 'CRC',
      enum: ['CRC', 'USD']
    }
  },
  
  // Profession status and metadata
  isActive: {
    type: Boolean,
    default: true
  },
  
  demandLevel: {
    type: String,
    enum: {
      values: ['Low', 'Medium', 'High', 'Critical'],
      message: 'Demand level must be Low, Medium, High, or Critical'
    },
    default: 'Medium'
  },
  
  // Statistics (to be updated periodically)
  registeredProfessionals: {
    type: Number,
    default: 0,
    min: [0, 'Registered professionals count cannot be negative']
  },
  
  activeJobOffers: {
    type: Number,
    default: 0,
    min: [0, 'Active job offers count cannot be negative']
  },
  
  // Administrative information
  createdBy: {
    type: String,
    default: 'System',
    trim: true
  },
  
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  // Schema options
  timestamps: true,
  collection: 'professions'
});

/**
 * Indexes for optimal query performance
 */
professionSchema.index({ name: 1 }, { unique: true });
professionSchema.index({ code: 1 }, { unique: true });
professionSchema.index({ category: 1 });
professionSchema.index({ isActive: 1 });
professionSchema.index({ demandLevel: 1 });
professionSchema.index({ registeredProfessionals: -1 });

/**
 * Virtual properties
 */
professionSchema.virtual('professionalCount').get(function() {
  return this.registeredProfessionals || 0;
});

professionSchema.virtual('jobOfferCount').get(function() {
  return this.activeJobOffers || 0;
});

professionSchema.virtual('popularity').get(function() {
  // Calculate popularity based on registered professionals and job offers
  const professionalsWeight = this.registeredProfessionals * 0.7;
  const jobOffersWeight = this.activeJobOffers * 0.3;
  return Math.round(professionalsWeight + jobOffersWeight);
});

/**
 * Instance methods
 */

/**
 * Update profession statistics
 * @returns {Promise<Profession>} Updated profession document
 */
professionSchema.methods.updateStatistics = async function() {
  const Professional = mongoose.model('Professional');
  const JobOffer = mongoose.model('JobOffer');
  
  try {
    // Count registered professionals in this profession
    this.registeredProfessionals = await Professional.countDocuments({
      'professions.professionId': this._id,
      isActive: true
    });
    
    // Count active job offers requiring this profession
    this.activeJobOffers = await JobOffer.countDocuments({
      requiredProfessions: this._id,
      isActive: true
    });
    
    this.lastUpdated = new Date();
    return await this.save();
  } catch (error) {
    console.error('Error updating profession statistics:', error);
    throw error;
  }
};

/**
 * Add a requirement to the profession
 * @param {string} requirement - New requirement to add
 * @returns {Promise<Profession>} Updated profession document
 */
professionSchema.methods.addRequirement = async function(requirement) {
  if (requirement && !this.requirements.includes(requirement)) {
    this.requirements.push(requirement);
    this.lastUpdated = new Date();
    return await this.save();
  }
  return this;
};

/**
 * Add a skill to the profession
 * @param {string} skill - New skill to add
 * @returns {Promise<Profession>} Updated profession document
 */
professionSchema.methods.addSkill = async function(skill) {
  if (skill && !this.skills.includes(skill)) {
    this.skills.push(skill);
    this.lastUpdated = new Date();
    return await this.save();
  }
  return this;
};

/**
 * Static methods
 */

/**
 * Find professions by category
 * @param {string} category - Category name
 * @returns {Promise<Array>} Array of professions in the category
 */
professionSchema.statics.findByCategory = function(category) {
  return this.find({ category, isActive: true })
    .sort({ name: 1 });
};

/**
 * Find most popular professions
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array>} Array of popular professions
 */
professionSchema.statics.findPopular = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ registeredProfessionals: -1, activeJobOffers: -1 })
    .limit(limit);
};

/**
 * Find professions by demand level
 * @param {string} demandLevel - Demand level
 * @returns {Promise<Array>} Array of professions with specified demand level
 */
professionSchema.statics.findByDemand = function(demandLevel) {
  return this.find({ demandLevel, isActive: true })
    .sort({ name: 1 });
};

/**
 * Get profession statistics by category
 * @returns {Promise<Array>} Aggregation result with statistics by category
 */
professionSchema.statics.getStatsByCategory = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalProfessionals: { $sum: '$registeredProfessionals' },
        totalJobOffers: { $sum: '$activeJobOffers' },
        averageSalaryMin: { $avg: '$averageSalaryRange.min' },
        averageSalaryMax: { $avg: '$averageSalaryRange.max' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

/**
 * Search professions by text
 * @param {string} searchText - Text to search for
 * @returns {Promise<Array>} Array of matching professions
 */
professionSchema.statics.searchByText = function(searchText) {
  const searchRegex = new RegExp(searchText, 'i');
  return this.find({
    isActive: true,
    $or: [
      { name: searchRegex },
      { description: searchRegex },
      { skills: { $in: [searchRegex] } },
      { requirements: { $in: [searchRegex] } }
    ]
  }).sort({ name: 1 });
};

/**
 * Pre-save middleware
 */
professionSchema.pre('save', function(next) {
  // Update lastUpdated timestamp
  if (this.isModified() && !this.isNew) {
    this.lastUpdated = new Date();
  }
  
  // Auto-generate code if not provided
  if (!this.code && this.name) {
    this.code = this.name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 10);
  }
  
  next();
});

/**
 * Pre-validate middleware
 */
professionSchema.pre('validate', function(next) {
  // Ensure requirements array doesn't exceed reasonable size
  if (this.requirements && this.requirements.length > 20) {
    this.invalidate('requirements', 'Cannot have more than 20 requirements');
  }
  
  // Ensure skills array doesn't exceed reasonable size
  if (this.skills && this.skills.length > 30) {
    this.invalidate('skills', 'Cannot have more than 30 skills');
  }
  
  next();
});

// Ensure virtual fields are serialized
professionSchema.set('toJSON', { virtuals: true });
professionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Profession', professionSchema);