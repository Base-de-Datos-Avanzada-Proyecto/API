/**
 * Employer Model
 * ITI-821 Advanced Database Course
 * 
 * Defines the schema for employers (both individuals and legal entities)
 * who can post job offers and hire professionals
 */

const mongoose = require('mongoose');

/**
 * Employer Schema Definition
 * Supports both individual persons (física) and legal entities (jurídica)
 */
const employerSchema = new mongoose.Schema({
  // Identification (for both physical and legal persons)
  identification: {
    type: String,
    required: [true, 'Identification is required'],
    unique: true,
    trim: true
  },
  
  // Type of employer
  employerType: {
    type: String,
    required: [true, 'Employer type is required'],
    enum: {
      values: ['fisica', 'juridica'],
      message: 'Employer type must be either "fisica" (individual) or "juridica" (legal entity)'
    }
  },
  
  // Name fields (different usage based on employer type)
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  
  // For individual employers (persona física)
  lastName: {
    type: String,
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters'],
    maxlength: [50, 'Last name cannot exceed 50 characters'],
    // Required only for individual employers
    validate: {
      validator: function(value) {
        if (this.employerType === 'fisica') {
          return value && value.length > 0;
        }
        return true;
      },
      message: 'Last name is required for individual employers'
    }
  },
  
  // For legal entities (persona jurídica)
  legalName: {
    type: String,
    trim: true,
    maxlength: [150, 'Legal name cannot exceed 150 characters'],
    // Required only for legal entities
    validate: {
      validator: function(value) {
        if (this.employerType === 'juridica') {
          return value && value.length > 0;
        }
        return true;
      },
      message: 'Legal name is required for legal entities'
    }
  },
  
  // Business sector (mainly for legal entities but can apply to individuals)
  businessSector: {
    type: String,
    trim: true,
    maxlength: [100, 'Business sector cannot exceed 100 characters']
  },
  
  // Contact information
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address']
  },
  
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^\d{4}-\d{4}$/, 'Phone must follow format: XXXX-XXXX']
  },
  
  alternativePhone: {
    type: String,
    trim: true,
    match: [/^\d{4}-\d{4}$/, 'Alternative phone must follow format: XXXX-XXXX']
  },
  
  // Address information
  canton: {
    type: String,
    required: [true, 'Canton is required'],
    enum: {
      values: ['Puntarenas', 'Esparza', 'MonteDeOro'],
      message: 'Canton must be one of: Puntarenas, Esparza, MonteDeOro'
    }
  },
  
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  },
  
  // Company/Employer specific information
  website: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/, 'Website must be a valid URL starting with http:// or https://']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Employment capacity and preferences
  expectedHires: {
    type: Number,
    min: [1, 'Expected hires must be at least 1'],
    max: [1000, 'Expected hires cannot exceed 1000']
  },
  
  preferredProfessions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profession'
  }],
  
  // Verification and status
  isVerified: {
    type: Boolean,
    default: false
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Registration metadata
  registrationDate: {
    type: Date,
    default: Date.now
  },
  
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  
  // Additional metadata for legal entities
  registrationNumber: {
    type: String,
    trim: true,
    // Required for legal entities
    validate: {
      validator: function(value) {
        if (this.employerType === 'juridica') {
          return value && value.length > 0;
        }
        return true;
      },
      message: 'Registration number is required for legal entities'
    }
  }
}, {
  // Schema options
  timestamps: true,
  collection: 'employers'
});

/**
 * Indexes for optimal query performance
 */
employerSchema.index({ identification: 1 }, { unique: true });
employerSchema.index({ email: 1 }, { unique: true });
employerSchema.index({ employerType: 1 });
employerSchema.index({ canton: 1 });
employerSchema.index({ isActive: 1 });
employerSchema.index({ isVerified: 1 });
employerSchema.index({ businessSector: 1 });

/**
 * Virtual properties
 */
employerSchema.virtual('displayName').get(function() {
  if (this.employerType === 'fisica') {
    return `${this.name} ${this.lastName}`.trim();
  } else {
    return this.legalName || this.name;
  }
});

employerSchema.virtual('formattedIdentification').get(function() {
  if (this.employerType === 'fisica') {
    // Format cédula: X-XXXX-XXXX
    return this.identification.replace(/^(\d{1})(\d{4})(\d{4})$/, '$1-$2-$3');
  } else {
    // Legal entities might have different formats
    return this.identification;
  }
});

/**
 * Instance methods
 */

/**
 * Add a preferred profession to the employer
 * @param {ObjectId} professionId - ID of the profession to add
 * @returns {Promise<Employer>} Updated employer document
 */
employerSchema.methods.addPreferredProfession = async function(professionId) {
  if (!this.preferredProfessions.includes(professionId)) {
    this.preferredProfessions.push(professionId);
    this.lastUpdated = new Date();
    return await this.save();
  }
  return this;
};

/**
 * Remove a preferred profession from the employer
 * @param {ObjectId} professionId - ID of the profession to remove
 * @returns {Promise<Employer>} Updated employer document
 */
employerSchema.methods.removePreferredProfession = async function(professionId) {
  this.preferredProfessions = this.preferredProfessions.filter(
    p => p.toString() !== professionId.toString()
  );
  this.lastUpdated = new Date();
  return await this.save();
};

/**
 * Get employer's job offers count
 * @returns {Promise<Number>} Number of active job offers
 */
employerSchema.methods.getActiveJobOffersCount = async function() {
  const JobOffer = mongoose.model('JobOffer');
  return await JobOffer.countDocuments({ 
    employerId: this._id, 
    isActive: true 
  });
};

/**
 * Verify employer account
 * @returns {Promise<Employer>} Updated employer document
 */
employerSchema.methods.verify = async function() {
  this.isVerified = true;
  this.lastUpdated = new Date();
  return await this.save();
};

/**
 * Static methods
 */

/**
 * Find employers by type
 * @param {string} type - 'fisica' or 'juridica'
 * @returns {Promise<Array>} Array of employers
 */
employerSchema.statics.findByType = function(type) {
  return this.find({ employerType: type, isActive: true })
    .populate('preferredProfessions')
    .sort({ registrationDate: -1 });
};

/**
 * Find employers by canton
 * @param {string} canton - Canton name
 * @returns {Promise<Array>} Array of employers in the canton
 */
employerSchema.statics.findByCanton = function(canton) {
  return this.find({ canton, isActive: true })
    .populate('preferredProfessions')
    .sort({ registrationDate: -1 });
};

/**
 * Find verified employers
 * @returns {Promise<Array>} Array of verified employers
 */
employerSchema.statics.findVerified = function() {
  return this.find({ isVerified: true, isActive: true })
    .populate('preferredProfessions')
    .sort({ registrationDate: -1 });
};

/**
 * Get employers statistics
 * @returns {Promise<Object>} Statistics object
 */
employerSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: ['$isActive', 1, 0] } },
        verified: { $sum: { $cond: ['$isVerified', 1, 0] } },
        fisica: { $sum: { $cond: [{ $eq: ['$employerType', 'fisica'] }, 1, 0] } },
        juridica: { $sum: { $cond: [{ $eq: ['$employerType', 'juridica'] }, 1, 0] } }
      }
    }
  ]);
  
  return stats[0] || {
    total: 0,
    active: 0,
    verified: 0,
    fisica: 0,
    juridica: 0
  };
};

/**
 * Pre-save middleware
 */
employerSchema.pre('save', function(next) {
  // Update lastUpdated timestamp
  if (this.isModified() && !this.isNew) {
    this.lastUpdated = new Date();
  }
  
  // Format identification for física persons
  if (this.employerType === 'fisica' && this.identification) {
    // Remove any existing formatting and reformat
    const cleanId = this.identification.replace(/[^0-9]/g, '');
    if (cleanId.length === 9) {
      this.identification = cleanId.replace(/^(\d{1})(\d{4})(\d{4})$/, '$1-$2-$3');
    }
  }
  
  next();
});

/**
 * Pre-validate middleware
 */
employerSchema.pre('validate', function(next) {
  // Validate identification format based on employer type
  if (this.employerType === 'fisica') {
    // Validate cédula format for individuals
    const cedulaRegex = /^\d{1}-?\d{4}-?\d{4}$/;
    if (!cedulaRegex.test(this.identification)) {
      this.invalidate('identification', 'Cédula must follow format: X-XXXX-XXXX');
    }
  } else if (this.employerType === 'juridica') {
    // Validate legal entity identification (cédula jurídica CR)
    const juridicaRegex = /^[2-8]-\d{3}-\d{6}$/;
    if (!juridicaRegex.test(this.identification)) {
      this.invalidate('identification', 'Legal entity identification must follow Costa Rican format: X-XXX-XXXXXX');
    }
  }

  
  next();
});

// Ensure virtual fields are serialized
employerSchema.set('toJSON', { virtuals: true });
employerSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Employer', employerSchema);