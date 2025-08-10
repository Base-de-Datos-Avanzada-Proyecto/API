/**
 * Professional Model
 * ITI-821 Advanced Database Course
 * 
 * Defines the schema for professional users who register
 * to offer their services in different areas
 */

const mongoose = require('mongoose');

/**
 * Professional Schema Definition
 * Stores personal information and professional areas of interest
 */
const professionalSchema = new mongoose.Schema({
  // Personal identification
  cedula: {
    type: String,
    required: [true, 'Cedula is required'],
    unique: true,
    trim: true,
    match: [/^\d{1}-\d{4}-\d{4}$/, 'Cedula must follow format: X-XXXX-XXXX']
  },
  
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    minlength: [2, 'First name must be at least 2 characters'],
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters'],
    maxlength: [50, 'Last name cannot exceed 50 characters']
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
  
  // Personal information
  birthDate: {
    type: Date,
    required: [true, 'Birth date is required'],
    validate: {
      validator: function(date) {
        const today = new Date();
        const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
        return date <= eighteenYearsAgo;
      },
      message: 'Professional must be at least 18 years old'
    }
  },
  
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: {
      values: ['Male', 'Female', 'Other'],
      message: 'Gender must be Male, Female, or Other'
    }
  },
  
  // Professional areas (multiple professions allowed)
  professions: [{
    professionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profession',
      required: true
    },
    registrationDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Registration metadata
  isActive: {
    type: Boolean,
    default: true
  },
  
  registrationDate: {
    type: Date,
    default: Date.now
  },
  
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  // Schema options
  timestamps: true, // Automatically add createdAt and updatedAt
  collection: 'professionals'
});

/**
 * Indexes for optimal query performance
 */
professionalSchema.index({ cedula: 1 }, { unique: true });
professionalSchema.index({ email: 1 }, { unique: true });
professionalSchema.index({ canton: 1 });
professionalSchema.index({ gender: 1 });
professionalSchema.index({ 'professions.professionId': 1 });
professionalSchema.index({ isActive: 1 });

/**
 * Virtual properties
 */
professionalSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

professionalSchema.virtual('age').get(function() {
  if (!this.birthDate) return null;
  const today = new Date();
  const birthDate = new Date(this.birthDate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

/**
 * Instance methods
 */

/**
 * Add a profession to the professional's areas
 * @param {ObjectId} professionId - ID of the profession to add
 * @returns {Promise<Professional>} Updated professional document
 */
professionalSchema.methods.addProfession = async function(professionId) {
  // Check if profession already exists
  const exists = this.professions.some(p => p.professionId.toString() === professionId.toString());
  
  if (!exists) {
    this.professions.push({
      professionId: professionId,
      registrationDate: new Date()
    });
    this.lastUpdated = new Date();
    return await this.save();
  }
  
  return this;
};

/**
 * Remove a profession from the professional's areas
 * @param {ObjectId} professionId - ID of the profession to remove
 * @returns {Promise<Professional>} Updated professional document
 */
professionalSchema.methods.removeProfession = async function(professionId) {
  this.professions = this.professions.filter(p => p.professionId.toString() !== professionId.toString());
  this.lastUpdated = new Date();
  return await this.save();
};

/**
 * Get professional's active professions with populated data
 * @returns {Promise<Array>} Array of populated professions
 */
professionalSchema.methods.getActiveProfessions = async function() {
  await this.populate('professions.professionId');
  return this.professions.map(p => p.professionId);
};

/**
 * Static methods
 */

/**
 * Find professionals by canton
 * @param {string} canton - Canton name
 * @returns {Promise<Array>} Array of professionals in the canton
 */
professionalSchema.statics.findByCanton = function(canton) {
  return this.find({ canton, isActive: true })
    .populate('professions.professionId')
    .sort({ registrationDate: -1 });
};

/**
 * Find professionals by profession
 * @param {ObjectId} professionId - Profession ID
 * @returns {Promise<Array>} Array of professionals in that profession
 */
professionalSchema.statics.findByProfession = function(professionId) {
  return this.find({ 
    'professions.professionId': professionId,
    isActive: true 
  })
  .populate('professions.professionId')
  .sort({ registrationDate: -1 });
};

/**
 * Get professionals count by gender
 * @returns {Promise<Array>} Aggregation result with counts by gender
 */
professionalSchema.statics.getGenderStats = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    { $group: { 
      _id: '$gender', 
      count: { $sum: 1 } 
    }},
    { $sort: { _id: 1 } }
  ]);
};

/**
 * Pre-save middleware to update lastUpdated timestamp
 */
professionalSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastUpdated = new Date();
  }
  next();
});

/**
 * Pre-validate middleware for additional custom validations
 */
professionalSchema.pre('validate', function(next) {
  // Ensure at least one profession is selected
  if (this.professions && this.professions.length === 0) {
    this.invalidate('professions', 'At least one profession must be selected');
  }
  
  next();
});

// Ensure virtual fields are serialized
professionalSchema.set('toJSON', { virtuals: true });
professionalSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Professional', professionalSchema);