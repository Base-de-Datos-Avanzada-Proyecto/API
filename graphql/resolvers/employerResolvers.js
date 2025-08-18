/**
 * Employer GraphQL Resolvers
 * ITI-821 Advanced Database Course
 * 
 * Implements GraphQL resolvers for employer operations
 * Supports both individual persons (física) and legal entities (jurídica)
 */

const Employer = require('../../models/Employer');
const Profession = require('../../models/Profession');
const JobOffer = require('../../models/JobOffer');

const employerResolvers = {
  Query: {
    /**
     * Get all employers with optional filtering and sorting
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments
     * @returns {Promise<Array>} Array of employers
     */
    employers: async (parent, { filter, sort, limit, offset }) => {
      try {
        let query = {};
        
        // Apply filters
        if (filter) {
          if (filter.employerType) query.employerType = filter.employerType;
          if (filter.canton) query.canton = filter.canton;
          if (filter.isVerified !== undefined) query.isVerified = filter.isVerified;
          if (filter.isActive !== undefined) query.isActive = filter.isActive;
          if (filter.businessSector) {
            query.businessSector = new RegExp(filter.businessSector, 'i');
          }
          if (filter.searchText) {
            const searchRegex = new RegExp(filter.searchText, 'i');
            query.$or = [
              { name: searchRegex },
              { lastName: searchRegex },
              { legalName: searchRegex },
              { email: searchRegex },
              { identification: searchRegex },
              { businessSector: searchRegex }
            ];
          }
        }
        
        // Build query
        let employerQuery = Employer.find(query).populate('preferredProfessions');
        
        // Apply sorting
        if (sort) {
          const sortOrder = sort.order === 'DESC' ? -1 : 1;
          employerQuery = employerQuery.sort({ [sort.field]: sortOrder });
        } else {
          employerQuery = employerQuery.sort({ registrationDate: -1 });
        }
        
        // Apply pagination
        if (offset) employerQuery = employerQuery.skip(offset);
        if (limit) employerQuery = employerQuery.limit(limit);
        
        return await employerQuery.exec();
      } catch (error) {
        throw new Error(`Error fetching employers: ${error.message}`);
      }
    },

    /**
     * Get employer by ID
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with ID
     * @returns {Promise<Object>} Employer document
     */
    employer: async (parent, { id }) => {
      try {
        const employer = await Employer.findById(id).populate('preferredProfessions');
        if (!employer) {
          throw new Error('Employer not found');
        }
        return employer;
      } catch (error) {
        throw new Error(`Error fetching employer: ${error.message}`);
      }
    },

    /**
     * Get employer by identification
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with identification
     * @returns {Promise<Object>} Employer document
     */
    employerByIdentification: async (parent, { identification }) => {
      try {
        const employer = await Employer.findOne({ identification }).populate('preferredProfessions');
        if (!employer) {
          throw new Error('Employer not found');
        }
        return employer;
      } catch (error) {
        throw new Error(`Error fetching employer by identification: ${error.message}`);
      }
    },

    /**
     * Get employers by type
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with type
     * @returns {Promise<Array>} Array of employers
     */
    employersByType: async (parent, { type }) => {
      try {
        return await Employer.findByType(type);
      } catch (error) {
        throw new Error(`Error fetching employers by type: ${error.message}`);
      }
    },

    /**
     * Get employers by canton
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with canton
     * @returns {Promise<Array>} Array of employers
     */
    employersByCanton: async (parent, { canton }) => {
      try {
        return await Employer.findByCanton(canton);
      } catch (error) {
        throw new Error(`Error fetching employers by canton: ${error.message}`);
      }
    },

    /**
     * Get verified employers
     * @returns {Promise<Array>} Array of verified employers
     */
    verifiedEmployers: async () => {
      try {
        return await Employer.findVerified();
      } catch (error) {
        throw new Error(`Error fetching verified employers: ${error.message}`);
      }
    },

    /**
     * Get employer statistics
     * @returns {Promise<Object>} Statistics object
     */
    employerStats: async () => {
      try {
        return await Employer.getStats();
      } catch (error) {
        throw new Error(`Error fetching employer statistics: ${error.message}`);
      }
    },

    /**
     * Get total employers count
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with optional filter
     * @returns {Promise<Number>} Total count
     */
    employersCount: async (parent, { filter }) => {
      try {
        let query = {};
        
        if (filter) {
          if (filter.employerType) query.employerType = filter.employerType;
          if (filter.canton) query.canton = filter.canton;
          if (filter.isVerified !== undefined) query.isVerified = filter.isVerified;
          if (filter.isActive !== undefined) query.isActive = filter.isActive;
          if (filter.businessSector) {
            query.businessSector = new RegExp(filter.businessSector, 'i');
          }
          if (filter.searchText) {
            const searchRegex = new RegExp(filter.searchText, 'i');
            query.$or = [
              { name: searchRegex },
              { lastName: searchRegex },
              { legalName: searchRegex },
              { email: searchRegex },
              { identification: searchRegex }
            ];
          }
        }
        
        return await Employer.countDocuments(query);
      } catch (error) {
        throw new Error(`Error counting employers: ${error.message}`);
      }
    },

    /**
     * Get general employer information for reports
     * @returns {Promise<Array>} Array of employer info objects
     */
    employersGeneralInfo: async () => {
      try {
        const employers = await Employer.find({ isActive: true })
          .select('identification name lastName legalName employerType')
          .lean();
        
        const employerInfos = [];
        
        for (const employer of employers) {
          // Get job offers for this employer
          const jobOffers = await JobOffer.find({ employerId: employer._id, isActive: true })
            .select('title')
            .lean();
          
          employerInfos.push({
            cedula: employer.identification,
            name: employer.employerType === 'fisica' 
              ? `${employer.name} ${employer.lastName}`.trim()
              : employer.legalName || employer.name,
            jobOffers: jobOffers.map(job => job.title)
          });
        }
        
        return employerInfos;
      } catch (error) {
        throw new Error(`Error fetching employers general info: ${error.message}`);
      }
    },

    /**
     * Search employers by text
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with search text
     * @returns {Promise<Array>} Array of matching employers
     */
    searchEmployers: async (parent, { searchText }) => {
      try {
        const searchRegex = new RegExp(searchText, 'i');
        return await Employer.find({
          isActive: true,
          $or: [
            { name: searchRegex },
            { lastName: searchRegex },
            { legalName: searchRegex },
            { email: searchRegex },
            { identification: searchRegex },
            { businessSector: searchRegex },
            { description: searchRegex }
          ]
        })
        .populate('preferredProfessions')
        .sort({ name: 1 });
      } catch (error) {
        throw new Error(`Error searching employers: ${error.message}`);
      }
    }
  },

  Mutation: {
    /**
     * Create new employer
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with input data
     * @returns {Promise<Object>} Created employer document
     */
    createEmployer: async (parent, { input }) => {
      try {
        const employer = new Employer(input);
        const savedEmployer = await employer.save();
        return await Employer.findById(savedEmployer._id).populate('preferredProfessions');
      } catch (error) {
        if (error.code === 11000) {
          throw new Error('Employer with this identification or email already exists');
        }
        throw new Error(`Error creating employer: ${error.message}`);
      }
    },

    /**
     * Update employer
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with ID and input data
     * @returns {Promise<Object>} Updated employer document
     */
    updateEmployer: async (parent, { id, input }) => {
      try {
        const employer = await Employer.findByIdAndUpdate(
          id,
          { ...input, lastUpdated: new Date() },
          { new: true, runValidators: true }
        ).populate('preferredProfessions');
        
        if (!employer) {
          throw new Error('Employer not found');
        }
        
        return employer;
      } catch (error) {
        throw new Error(`Error updating employer: ${error.message}`);
      }
    },

    /**
     * Delete employer (soft delete)
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with ID
     * @returns {Promise<Boolean>} Success status
     */
    deleteEmployer: async (parent, { id }) => {
      try {
        const employer = await Employer.findByIdAndUpdate(
          id,
          { isActive: false, lastUpdated: new Date() },
          { new: true }
        );
        
        return !!employer;
      } catch (error) {
        throw new Error(`Error deleting employer: ${error.message}`);
      }
    },

    /**
     * Add preferred profession to employer
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with employer ID and profession ID
     * @returns {Promise<Object>} Updated employer document
     */
    addPreferredProfession: async (parent, { employerId, professionId }) => {
      try {
        const employer = await Employer.findById(employerId);
        if (!employer) {
          throw new Error('Employer not found');
        }
        
        const updatedEmployer = await employer.addPreferredProfession(professionId);
        return await Employer.findById(updatedEmployer._id).populate('preferredProfessions');
      } catch (error) {
        throw new Error(`Error adding preferred profession: ${error.message}`);
      }
    },

    /**
     * Remove preferred profession from employer
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with employer ID and profession ID
     * @returns {Promise<Object>} Updated employer document
     */
    removePreferredProfession: async (parent, { employerId, professionId }) => {
      try {
        const employer = await Employer.findById(employerId);
        if (!employer) {
          throw new Error('Employer not found');
        }
        
        const updatedEmployer = await employer.removePreferredProfession(professionId);
        return await Employer.findById(updatedEmployer._id).populate('preferredProfessions');
      } catch (error) {
        throw new Error(`Error removing preferred profession: ${error.message}`);
      }
    },

    /**
     * Verify employer account
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with ID
     * @returns {Promise<Object>} Updated employer document
     */
    verifyEmployer: async (parent, { id }) => {
      try {
        const employer = await Employer.findById(id);
        if (!employer) {
          throw new Error('Employer not found');
        }
        
        const verifiedEmployer = await employer.verify();
        return await Employer.findById(verifiedEmployer._id).populate('preferredProfessions');
      } catch (error) {
        throw new Error(`Error verifying employer: ${error.message}`);
      }
    },

    /**
     * Toggle employer active status
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with ID
     * @returns {Promise<Object>} Updated employer document
     */
    toggleEmployerStatus: async (parent, { id }) => {
      try {
        const employer = await Employer.findById(id);
        if (!employer) {
          throw new Error('Employer not found');
        }
        
        employer.isActive = !employer.isActive;
        employer.lastUpdated = new Date();
        
        const updatedEmployer = await employer.save();
        return await Employer.findById(updatedEmployer._id).populate('preferredProfessions');
      } catch (error) {
        throw new Error(`Error toggling employer status: ${error.message}`);
      }
    },

    /**
     * Bulk create employers
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with array of input data
     * @returns {Promise<Array>} Array of created employer documents
     */
    createEmployers: async (parent, { input }) => {
      try {
        const employers = [];
        const errors = [];
        
        for (const employerData of input) {
          try {
            const employer = new Employer(employerData);
            const savedEmployer = await employer.save();
            employers.push(await Employer.findById(savedEmployer._id).populate('preferredProfessions'));
          } catch (error) {
            errors.push({
              data: employerData,
              error: error.message
            });
          }
        }
        
        if (errors.length > 0) {
          console.log('Bulk creation completed with some errors:', errors);
        }
        
        return employers;
      } catch (error) {
        throw new Error(`Error bulk creating employers: ${error.message}`);
      }
    },

    /**
     * Update employer contact information
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with ID and contact data
     * @returns {Promise<Object>} Updated employer document
     */
    updateEmployerContact: async (parent, { id, email, phone, alternativePhone, address }) => {
      try {
        const updateData = { lastUpdated: new Date() };
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;
        if (alternativePhone) updateData.alternativePhone = alternativePhone;
        if (address) updateData.address = address;
        
        const employer = await Employer.findByIdAndUpdate(
          id,
          updateData,
          { new: true, runValidators: true }
        ).populate('preferredProfessions');
        
        if (!employer) {
          throw new Error('Employer not found');
        }
        
        return employer;
      } catch (error) {
        throw new Error(`Error updating employer contact: ${error.message}`);
      }
    }
  },

  // Field resolvers
  Employer: {
    /**
     * Get active job offers count for employer
     * @param {Object} parent - Employer document
     * @returns {Promise<Number>} Count of active job offers
     */
    activeJobOffersCount: async (parent) => {
      try {
        return await parent.getActiveJobOffersCount();
      } catch (error) {
        console.error('Error fetching active job offers count:', error);
        return 0;
      }
    },

    /**
     * Get job offers for employer
     * @param {Object} parent - Employer document
     * @returns {Promise<Array>} Array of job offers
     */
    jobOffers: async (parent) => {
      try {
        return await JobOffer.findByEmployer(parent._id);
      } catch (error) {
        console.error('Error fetching job offers:', error);
        return [];
      }
    },
  }
};

module.exports = employerResolvers;