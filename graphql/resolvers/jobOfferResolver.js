/**
 * Job Offer GraphQL Resolvers
 * ITI-821 Advanced Database Course
 * 
 * Implements GraphQL resolvers for job offer operations (vacant positions)
 */

const JobOffer = require('../../models/JobOffer');
const Employer = require('../../models/Employer');
const Profession = require('../../models/Profession');

const jobOfferResolvers = {
  Query: {
    /**
     * Get all job offers with optional filtering and sorting
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments
     * @returns {Promise<Array>} Array of job offers
     */
    jobOffers: async (parent, { filter, sort, limit, offset }) => {
      try {
        let query = {};
        
        // Apply filters
        if (filter) {
          if (filter.employerId) query.employerId = filter.employerId;
          if (filter.requiredProfessions && filter.requiredProfessions.length > 0) {
            query.requiredProfessions = { $in: filter.requiredProfessions };
          }
          if (filter.workType) query.workType = filter.workType;
          if (filter.workModality) query.workModality = filter.workModality;
          if (filter.canton) query['location.canton'] = filter.canton;
          if (filter.isActive !== undefined) query.isActive = filter.isActive;
          if (filter.status) query.status = filter.status;
          if (filter.isFeatured !== undefined) query.isFeatured = filter.isFeatured;
          
          // Salary range filtering
          if (filter.salaryMin || filter.salaryMax) {
            const salaryQuery = {};
            if (filter.salaryMin) {
              salaryQuery['salary.min'] = { $gte: filter.salaryMin };
            }
            if (filter.salaryMax) {
              salaryQuery['salary.max'] = { $lte: filter.salaryMax };
            }
            Object.assign(query, salaryQuery);
          }
          
          // Experience filtering
          if (filter.experienceMax !== undefined) {
            query.experienceRequired = { $lte: filter.experienceMax };
          }
          
          // Education level filtering
          if (filter.educationLevel) {
            query.educationLevel = filter.educationLevel;
          }
          
          // Expired jobs filtering
          if (filter.isExpired !== undefined) {
            const currentDate = new Date();
            if (filter.isExpired) {
              query.applicationDeadline = { $lte: currentDate };
            } else {
              query.applicationDeadline = { $gt: currentDate };
            }
          }
          
          // Text search
          if (filter.searchText) {
            const searchRegex = new RegExp(filter.searchText, 'i');
            query.$or = [
              { title: searchRegex },
              { description: searchRegex },
              { requirements: { $in: [searchRegex] } },
              { preferredSkills: { $in: [searchRegex] } }
            ];
          }
        }
        
        // Build query with population
        let jobOfferQuery = JobOffer.find(query)
          .populate('employerId')
          .populate('requiredProfessions');
        
        // Apply sorting
        if (sort) {
          const sortOrder = sort.order === 'DESC' ? -1 : 1;
          let sortField = sort.field;
          
          // Handle nested field sorting
          if (sortField === 'salary') {
            sortField = 'salary.min';
          }
          
          jobOfferQuery = jobOfferQuery.sort({ [sortField]: sortOrder });
        } else {
          jobOfferQuery = jobOfferQuery.sort({ publishedAt: -1, createdAt: -1 });
        }
        
        // Apply pagination
        if (offset) jobOfferQuery = jobOfferQuery.skip(offset);
        if (limit) jobOfferQuery = jobOfferQuery.limit(limit);
        
        return await jobOfferQuery.exec();
      } catch (error) {
        throw new Error(`Error fetching job offers: ${error.message}`);
      }
    },

    /**
     * Get job offer by ID
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with ID
     * @returns {Promise<Object>} Job offer document
     */
    jobOffer: async (parent, { id }) => {
      try {
        const jobOffer = await JobOffer.findById(id)
          .populate('employerId')
          .populate('requiredProfessions');
          
        if (!jobOffer) {
          throw new Error('Job offer not found');
        }
        
        return jobOffer;
      } catch (error) {
        throw new Error(`Error fetching job offer: ${error.message}`);
      }
    },

    /**
     * Get job offers by employer
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with employer ID
     * @returns {Promise<Array>} Array of job offers
     */
    jobOffersByEmployer: async (parent, { employerId }) => {
      try {
        return await JobOffer.findByEmployer(employerId);
      } catch (error) {
        throw new Error(`Error fetching job offers by employer: ${error.message}`);
      }
    },

    /**
     * Get job offers by profession
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with profession ID
     * @returns {Promise<Array>} Array of job offers
     */
    jobOffersByProfession: async (parent, { professionId }) => {
      try {
        return await JobOffer.findByProfession(professionId);
      } catch (error) {
        throw new Error(`Error fetching job offers by profession: ${error.message}`);
      }
    },

    /**
     * Get job offers by canton
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with canton
     * @returns {Promise<Array>} Array of job offers
     */
    jobOffersByCanton: async (parent, { canton }) => {
      try {
        return await JobOffer.findByCanton(canton);
      } catch (error) {
        throw new Error(`Error fetching job offers by canton: ${error.message}`);
      }
    },

    /**
     * Get active job offers
     * @returns {Promise<Array>} Array of active job offers
     */
    activeJobOffers: async () => {
      try {
        return await JobOffer.find({
          isActive: true,
          status: 'Published',
          applicationDeadline: { $gt: new Date() }
        })
        .populate('employerId')
        .populate('requiredProfessions')
        .sort({ publishedAt: -1 });
      } catch (error) {
        throw new Error(`Error fetching active job offers: ${error.message}`);
      }
    },

    /**
     * Get featured job offers
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with limit
     * @returns {Promise<Array>} Array of featured job offers
     */
    featuredJobOffers: async (parent, { limit = 10 }) => {
      try {
        return await JobOffer.find({
          isFeatured: true,
          isActive: true,
          status: 'Published',
          applicationDeadline: { $gt: new Date() }
        })
        .populate('employerId')
        .populate('requiredProfessions')
        .sort({ publishedAt: -1 })
        .limit(limit);
      } catch (error) {
        throw new Error(`Error fetching featured job offers: ${error.message}`);
      }
    },

    /**
     * Get job offer statistics
     * @returns {Promise<Object>} Statistics object
     */
    jobOfferStats: async () => {
      try {
        return await JobOffer.getStats();
      } catch (error) {
        throw new Error(`Error fetching job offer statistics: ${error.message}`);
      }
    },

    /**
     * Get vacant positions inventory (simplified view for reports)
     * @returns {Promise<Array>} Array of vacant position objects
     */
    vacantPositions: async () => {
      try {
        const jobOffers = await JobOffer.find({
          isActive: true,
          status: 'Published',
          applicationDeadline: { $gt: new Date() }
        })
        .populate('employerId', 'name legalName employerType')
        .select('title location.canton workType applicationDeadline status')
        .sort({ publishedAt: -1 });

        return jobOffers.map(offer => ({
          id: offer._id,
          title: offer.title,
          employer: offer.employerId.employerType === 'fisica' 
            ? offer.employerId.name 
            : (offer.employerId.legalName || offer.employerId.name),
          canton: offer.location.canton,
          workType: offer.workType,
          applicationDeadline: offer.applicationDeadline.toISOString(),
          status: offer.status
        }));
      } catch (error) {
        throw new Error(`Error fetching vacant positions: ${error.message}`);
      }
    },

    /**
     * Get total job offers count
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with optional filter
     * @returns {Promise<Number>} Total count
     */
    jobOffersCount: async (parent, { filter }) => {
      try {
        let query = {};
        
        if (filter) {
          if (filter.employerId) query.employerId = filter.employerId;
          if (filter.requiredProfessions && filter.requiredProfessions.length > 0) {
            query.requiredProfessions = { $in: filter.requiredProfessions };
          }
          if (filter.workType) query.workType = filter.workType;
          if (filter.workModality) query.workModality = filter.workModality;
          if (filter.canton) query['location.canton'] = filter.canton;
          if (filter.isActive !== undefined) query.isActive = filter.isActive;
          if (filter.status) query.status = filter.status;
          if (filter.isFeatured !== undefined) query.isFeatured = filter.isFeatured;
        }
        
        return await JobOffer.countDocuments(query);
      } catch (error) {
        throw new Error(`Error counting job offers: ${error.message}`);
      }
    },

    /**
     * Search job offers by text
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with search text
     * @returns {Promise<Array>} Array of matching job offers
     */
    searchJobOffers: async (parent, { searchText }) => {
      try {
        const searchRegex = new RegExp(searchText, 'i');
        return await JobOffer.find({
          isActive: true,
          status: 'Published',
          applicationDeadline: { $gt: new Date() },
          $or: [
            { title: searchRegex },
            { description: searchRegex },
            { requirements: { $in: [searchRegex] } },
            { preferredSkills: { $in: [searchRegex] } }
          ]
        })
        .populate('employerId')
        .populate('requiredProfessions')
        .sort({ publishedAt: -1 });
      } catch (error) {
        throw new Error(`Error searching job offers: ${error.message}`);
      }
    },

    /**
     * Get expiring job offers (deadline within X days)
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with days
     * @returns {Promise<Array>} Array of expiring job offers
     */
    expiringJobOffers: async (parent, { days = 7 }) => {
      try {
        const currentDate = new Date();
        const expirationDate = new Date(currentDate.getTime() + (days * 24 * 60 * 60 * 1000));
        
        return await JobOffer.find({
          isActive: true,
          status: 'Published',
          applicationDeadline: {
            $gt: currentDate,
            $lte: expirationDate
          }
        })
        .populate('employerId')
        .populate('requiredProfessions')
        .sort({ applicationDeadline: 1 });
      } catch (error) {
        throw new Error(`Error fetching expiring job offers: ${error.message}`);
      }
    },

    /**
     * Get most viewed job offers
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Query arguments with limit
     * @returns {Promise<Array>} Array of most viewed job offers
     */
    mostViewedJobOffers: async (parent, { limit = 10 }) => {
      try {
        return await JobOffer.find({
          isActive: true,
          status: 'Published',
          applicationDeadline: { $gt: new Date() }
        })
        .populate('employerId')
        .populate('requiredProfessions')
        .sort({ viewCount: -1 })
        .limit(limit);
      } catch (error) {
        throw new Error(`Error fetching most viewed job offers: ${error.message}`);
      }
    }
  },

  Mutation: {
    /**
     * Create new job offer
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with input data
     * @returns {Promise<Object>} Created job offer document
     */
    createJobOffer: async (parent, { input }) => {
      try {
        // Verify employer exists
        const employer = await Employer.findById(input.employerId);
        if (!employer) {
          throw new Error('Employer not found');
        }

        // Verify all required professions exist
        const professions = await Profession.find({ 
          _id: { $in: input.requiredProfessions },
          isActive: true 
        });
        
        if (professions.length !== input.requiredProfessions.length) {
          throw new Error('One or more required professions not found or inactive');
        }

        // Use employer contact info if not provided
        if (!input.contactEmail && employer.email) {
          input.contactEmail = employer.email;
        }
        if (!input.contactPhone && employer.phone) {
          input.contactPhone = employer.phone;
        }

        const jobOffer = new JobOffer(input);
        const savedJobOffer = await jobOffer.save();
        
        return await JobOffer.findById(savedJobOffer._id)
          .populate('employerId')
          .populate('requiredProfessions');
      } catch (error) {
        throw new Error(`Error creating job offer: ${error.message}`);
      }
    },

    /**
     * Update job offer
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with ID and input data
     * @returns {Promise<Object>} Updated job offer document
     */
    updateJobOffer: async (parent, { id, input }) => {
      try {
        const jobOffer = await JobOffer.findByIdAndUpdate(
          id,
          { ...input, lastUpdated: new Date() },
          { new: true, runValidators: true }
        )
        .populate('employerId')
        .populate('requiredProfessions');
        
        if (!jobOffer) {
          throw new Error('Job offer not found');
        }
        
        return jobOffer;
      } catch (error) {
        throw new Error(`Error updating job offer: ${error.message}`);
      }
    },

    /**
     * Delete job offer (soft delete)
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with ID
     * @returns {Promise<Boolean>} Success status
     */
    deleteJobOffer: async (parent, { id }) => {
      try {
        const jobOffer = await JobOffer.findByIdAndUpdate(
          id,
          { 
            isActive: false, 
            status: 'Closed', 
            lastUpdated: new Date() 
          },
          { new: true }
        );
        
        return !!jobOffer;
      } catch (error) {
        throw new Error(`Error deleting job offer: ${error.message}`);
      }
    },

    /**
     * Publish job offer
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with ID
     * @returns {Promise<Object>} Updated job offer document
     */
    publishJobOffer: async (parent, { id }) => {
      try {
        const jobOffer = await JobOffer.findById(id);
        if (!jobOffer) {
          throw new Error('Job offer not found');
        }
        
        const publishedJobOffer = await jobOffer.publish();
        return await JobOffer.findById(publishedJobOffer._id)
          .populate('employerId')
          .populate('requiredProfessions');
      } catch (error) {
        throw new Error(`Error publishing job offer: ${error.message}`);
      }
    },

    /**
     * Pause job offer
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with ID
     * @returns {Promise<Object>} Updated job offer document
     */
    pauseJobOffer: async (parent, { id }) => {
      try {
        const jobOffer = await JobOffer.findById(id);
        if (!jobOffer) {
          throw new Error('Job offer not found');
        }
        
        const pausedJobOffer = await jobOffer.pause();
        return await JobOffer.findById(pausedJobOffer._id)
          .populate('employerId')
          .populate('requiredProfessions');
      } catch (error) {
        throw new Error(`Error pausing job offer: ${error.message}`);
      }
    },

    /**
     * Close job offer
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with ID and filled status
     * @returns {Promise<Object>} Updated job offer document
     */
    closeJobOffer: async (parent, { id, filled = false }) => {
      try {
        const jobOffer = await JobOffer.findById(id);
        if (!jobOffer) {
          throw new Error('Job offer not found');
        }
        
        const closedJobOffer = await jobOffer.close(filled);
        return await JobOffer.findById(closedJobOffer._id)
          .populate('employerId')
          .populate('requiredProfessions');
      } catch (error) {
        throw new Error(`Error closing job offer: ${error.message}`);
      }
    },

    /**
     * Reopen job offer
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with ID
     * @returns {Promise<Object>} Updated job offer document
     */
    reopenJobOffer: async (parent, { id }) => {
      try {
        const jobOffer = await JobOffer.findById(id);
        if (!jobOffer) {
          throw new Error('Job offer not found');
        }

        // Verify deadline is still valid
        if (new Date() > jobOffer.applicationDeadline) {
          throw new Error('Cannot reopen job offer with past application deadline');
        }
        
        jobOffer.status = 'Published';
        jobOffer.isActive = true;
        jobOffer.lastUpdated = new Date();
        
        const reopenedJobOffer = await jobOffer.save();
        return await JobOffer.findById(reopenedJobOffer._id)
          .populate('employerId')
          .populate('requiredProfessions');
      } catch (error) {
        throw new Error(`Error reopening job offer: ${error.message}`);
      }
    },

    /**
     * Toggle job offer featured status
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with ID
     * @returns {Promise<Object>} Updated job offer document
     */
    toggleJobOfferFeatured: async (parent, { id }) => {
      try {
        const jobOffer = await JobOffer.findById(id);
        if (!jobOffer) {
          throw new Error('Job offer not found');
        }
        
        jobOffer.isFeatured = !jobOffer.isFeatured;
        jobOffer.lastUpdated = new Date();
        
        const updatedJobOffer = await jobOffer.save();
        return await JobOffer.findById(updatedJobOffer._id)
          .populate('employerId')
          .populate('requiredProfessions');
      } catch (error) {
        throw new Error(`Error toggling job offer featured status: ${error.message}`);
      }
    },

    /**
     * Increment job offer view count
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with ID
     * @returns {Promise<Object>} Updated job offer document
     */
    incrementJobOfferViews: async (parent, { id }) => {
      try {
        const jobOffer = await JobOffer.findById(id);
        if (!jobOffer) {
          throw new Error('Job offer not found');
        }
        
        const updatedJobOffer = await jobOffer.incrementViews();
        return await JobOffer.findById(updatedJobOffer._id)
          .populate('employerId')
          .populate('requiredProfessions');
      } catch (error) {
        throw new Error(`Error incrementing job offer views: ${error.message}`);
      }
    },

    /**
     * Bulk create job offers
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with array of input data
     * @returns {Promise<Array>} Array of created job offer documents
     */
    createJobOffers: async (parent, { input }) => {
      try {
        const jobOffers = [];
        const errors = [];
        
        for (const jobOfferData of input) {
          try {
            // Verify employer exists
            const employer = await Employer.findById(jobOfferData.employerId);
            if (!employer) {
              throw new Error('Employer not found');
            }

            // Use employer contact info if not provided
            if (!jobOfferData.contactEmail && employer.email) {
              jobOfferData.contactEmail = employer.email;
            }
            if (!jobOfferData.contactPhone && employer.phone) {
              jobOfferData.contactPhone = employer.phone;
            }

            const jobOffer = new JobOffer(jobOfferData);
            const savedJobOffer = await jobOffer.save();
            jobOffers.push(await JobOffer.findById(savedJobOffer._id)
              .populate('employerId')
              .populate('requiredProfessions'));
          } catch (error) {
            errors.push({
              data: jobOfferData,
              error: error.message
            });
          }
        }
        
        if (errors.length > 0) {
          console.log('Bulk job offers creation completed with some errors:', errors);
        }
        
        return jobOffers;
      } catch (error) {
        throw new Error(`Error bulk creating job offers: ${error.message}`);
      }
    },

    /**
     * Extend application deadline
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with ID and new deadline
     * @returns {Promise<Object>} Updated job offer document
     */
    extendApplicationDeadline: async (parent, { id, newDeadline }) => {
      try {
        const jobOffer = await JobOffer.findById(id);
        if (!jobOffer) {
          throw new Error('Job offer not found');
        }

        const newDate = new Date(newDeadline);
        if (newDate <= new Date()) {
          throw new Error('New deadline must be in the future');
        }

        if (newDate <= jobOffer.applicationDeadline) {
          throw new Error('New deadline must be later than current deadline');
        }
        
        jobOffer.applicationDeadline = newDate;
        jobOffer.lastUpdated = new Date();
        
        const updatedJobOffer = await jobOffer.save();
        return await JobOffer.findById(updatedJobOffer._id)
          .populate('employerId')
          .populate('requiredProfessions');
      } catch (error) {
        throw new Error(`Error extending application deadline: ${error.message}`);
      }
    },

    /**
     * Update job offer requirements
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with ID, requirements and skills
     * @returns {Promise<Object>} Updated job offer document
     */
    updateJobOfferRequirements: async (parent, { id, requirements, preferredSkills }) => {
      try {
        const jobOffer = await JobOffer.findByIdAndUpdate(
          id,
          {
            requirements,
            preferredSkills,
            lastUpdated: new Date()
          },
          { new: true, runValidators: true }
        )
        .populate('employerId')
        .populate('requiredProfessions');
        
        if (!jobOffer) {
          throw new Error('Job offer not found');
        }
        
        return jobOffer;
      } catch (error) {
        throw new Error(`Error updating job offer requirements: ${error.message}`);
      }
    },

    /**
     * Clone job offer
     * @param {Object} parent - Parent resolver
     * @param {Object} args - Mutation arguments with ID and new title
     * @returns {Promise<Object>} Cloned job offer document
     */
    cloneJobOffer: async (parent, { id, title }) => {
      try {
        const originalJobOffer = await JobOffer.findById(id);
        if (!originalJobOffer) {
          throw new Error('Job offer not found');
        }

        // Create clone with new title and reset specific fields
        const cloneData = {
          ...originalJobOffer.toObject(),
          _id: undefined,
          title,
          status: 'Draft',
          isActive: true,
          publishedAt: undefined,
          viewCount: 0,
          applicationCount: 0,
          createdAt: undefined,
          updatedAt: undefined,
          lastUpdated: new Date()
        };

        const clonedJobOffer = new JobOffer(cloneData);
        const savedClone = await clonedJobOffer.save();
        
        return await JobOffer.findById(savedClone._id)
          .populate('employerId')
          .populate('requiredProfessions');
      } catch (error) {
        throw new Error(`Error cloning job offer: ${error.message}`);
      }
    }
  },

  // Field resolvers
  JobOffer: {
    /**
     * Get employer reference
     * @param {Object} parent - Job offer document
     * @returns {Object} Employer document
     */
    employer: (parent) => {
      return parent.employerId;
    },

    /**
     * Get applications for the job offer
     * @param {Object} parent - Job offer document
     * @returns {Promise<Array>} Array of job applications
     */
    applications: async (parent) => {
      try {
        // TODO: Implement when JobApplication model is ready
        // const JobApplication = require('../models/JobApplication');
        // return await JobApplication.find({ jobOfferId: parent._id })
        //   .populate('professionalId')
        //   .sort({ applicationDate: -1 });
        return [];
      } catch (error) {
        console.error('Error fetching job applications:', error);
        return [];
      }
    }
  }
};

module.exports = jobOfferResolvers;