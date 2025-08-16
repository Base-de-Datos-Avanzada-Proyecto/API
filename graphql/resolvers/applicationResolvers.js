/**
 * Application GraphQL Resolvers
 * ITI-821 Advanced Database Course
 * 
 * Implements GraphQL resolvers for job application operations
 */

const Application = require('../../models/Application');
const Professional = require('../../models/Professional');
const JobOffer = require('../../models/JobOffer');
const Employer = require('../../models/Employer');

const applicationResolvers = {
  Query: {
    /**
     * Get single application by ID
     */
    application: async (_, { id }) => {
      try {
        const application = await Application.findById(id)
          .populate('professionalId')
          .populate('jobOfferId')
          .populate('reviewedBy');

        if (!application) {
          return {
            success: false,
            message: 'Application not found',
            application: null,
            errors: ['Application with specified ID does not exist']
          };
        }

        return {
          success: true,
          message: 'Application retrieved successfully',
          application,
          errors: []
        };
      } catch (error) {
        return {
          success: false,
          message: 'Error retrieving application',
          application: null,
          errors: [error.message]
        };
      }
    },

    /**
     * Get applications with filters and pagination
     */
    applications: async (_, { filters = {}, limit = 10, offset = 0, sortBy = 'appliedAt', sortOrder = 'desc' }) => {
      try {
        // Build query filter
        const query = {};
        if (filters.status) query.status = filters.status;
        if (filters.priority) query.priority = filters.priority;
        if (filters.professionalId) query.professionalId = filters.professionalId;
        if (filters.jobOfferId) query.jobOfferId = filters.jobOfferId;
        if (filters.startDate || filters.endDate) {
          query.appliedAt = {};
          if (filters.startDate) query.appliedAt.$gte = new Date(filters.startDate);
          if (filters.endDate) query.appliedAt.$lte = new Date(filters.endDate);
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const applications = await Application.find(query)
          .populate('professionalId')
          .populate('jobOfferId')
          .populate('reviewedBy')
          .sort(sort)
          .skip(offset)
          .limit(limit);

        const totalCount = await Application.countDocuments(query);

        return {
          success: true,
          message: 'Applications retrieved successfully',
          applications,
          totalCount,
          errors: []
        };
      } catch (error) {
        return {
          success: false,
          message: 'Error retrieving applications',
          applications: [],
          totalCount: 0,
          errors: [error.message]
        };
      }
    },

    /**
     * Get applications by professional
     */
    applicationsByProfessional: async (_, { professionalId, status, limit = 10, offset = 0 }) => {
      try {
        const applications = await Application.findByProfessional(professionalId, status)
          .skip(offset)
          .limit(limit);

        const query = { professionalId };
        if (status) query.status = status;
        const totalCount = await Application.countDocuments(query);

        return {
          success: true,
          message: 'Applications by professional retrieved successfully',
          applications,
          totalCount,
          errors: []
        };
      } catch (error) {
        return {
          success: false,
          message: 'Error retrieving applications by professional',
          applications: [],
          totalCount: 0,
          errors: [error.message]
        };
      }
    },

    /**
     * Get applications by job offer
     */
    applicationsByJobOffer: async (_, { jobOfferId, status, limit = 10, offset = 0 }) => {
      try {
        const applications = await Application.findByJobOffer(jobOfferId, status)
          .skip(offset)
          .limit(limit);

        const query = { jobOfferId };
        if (status) query.status = status;
        const totalCount = await Application.countDocuments(query);

        return {
          success: true,
          message: 'Applications by job offer retrieved successfully',
          applications,
          totalCount,
          errors: []
        };
      } catch (error) {
        return {
          success: false,
          message: 'Error retrieving applications by job offer',
          applications: [],
          totalCount: 0,
          errors: [error.message]
        };
      }
    },

    /**
     * Check if professional can apply to job
     */
    canProfessionalApply: async (_, { professionalId, jobOfferId }) => {
      try {
        const result = await Application.canProfessionalApply(professionalId, jobOfferId);
        const monthlyCount = await Application.getMonthlyCount(professionalId);

        return {
          canApply: result.canApply,
          reason: result.reason,
          monthlyCount
        };
      } catch (error) {
        return {
          canApply: false,
          reason: `Error checking application eligibility: ${error.message}`,
          monthlyCount: 0
        };
      }
    },

    /**
     * Get application statistics
     */
    applicationStats: async () => {
      try {
        return await Application.getStats();
      } catch (error) {
        return {
          total: 0,
          pending: 0,
          accepted: 0,
          rejected: 0,
          avgDaysToReview: 0
        };
      }
    },

    /**
     * Get monthly application count for professional
     */
    monthlyApplicationCount: async (_, { professionalId }) => {
      try {
        return await Application.getMonthlyCount(professionalId);
      } catch (error) {
        return 0;
      }
    }
  },

  Mutation: {
    /**
     * Create new application
     */
    createApplication: async (_, { input }) => {
      try {
        // Check if professional can apply
        const canApply = await Application.canProfessionalApply(
          input.professionalId,
          input.jobOfferId
        );

        if (!canApply.canApply) {
          return {
            success: false,
            message: canApply.reason,
            application: null,
            errors: [canApply.reason]
          };
        }

        // Verify that professional and job offer exist
        const professional = await Professional.findById(input.professionalId);
        const jobOffer = await JobOffer.findById(input.jobOfferId);

        if (!professional) {
          return {
            success: false,
            message: 'Professional not found',
            application: null,
            errors: ['Professional with specified ID does not exist']
          };
        }

        if (!jobOffer) {
          return {
            success: false,
            message: 'Job offer not found',
            application: null,
            errors: ['Job offer with specified ID does not exist']
          };
        }

        // Check if job offer is still active and accepting applications
        if (!jobOffer.isActive || jobOffer.status !== 'Published') {
          return {
            success: false,
            message: 'Job offer is not accepting applications',
            application: null,
            errors: ['Job offer is no longer active or published']
          };
        }

        // Check application deadline
        if (new Date() > jobOffer.applicationDeadline) {
          return {
            success: false,
            message: 'Application deadline has passed',
            application: null,
            errors: ['The application deadline for this job offer has passed']
          };
        }

        const application = new Application(input);
        await application.save();

        // Populate references
        await application.populate('professionalId jobOfferId');

        return {
          success: true,
          message: 'Application created successfully',
          application,
          errors: []
        };
      } catch (error) {
        return {
          success: false,
          message: 'Error creating application',
          application: null,
          errors: [error.message]
        };
      }
    },

    /**
     * Update application (only by professional, before review)
     */
    updateApplication: async (_, { id, input }) => {
      try {
        const application = await Application.findById(id);

        if (!application) {
          return {
            success: false,
            message: 'Application not found',
            application: null,
            errors: ['Application with specified ID does not exist']
          };
        }

        // Can only update pending applications
        if (application.status !== 'Pending') {
          return {
            success: false,
            message: 'Cannot update reviewed application',
            application: null,
            errors: ['Application has already been reviewed and cannot be modified']
          };
        }

        Object.assign(application, input);
        await application.save();

        await application.populate('professionalId jobOfferId reviewedBy');

        return {
          success: true,
          message: 'Application updated successfully',
          application,
          errors: []
        };
      } catch (error) {
        return {
          success: false,
          message: 'Error updating application',
          application: null,
          errors: [error.message]
        };
      }
    },

    /**
     * Review application (by employer)
     */
    reviewApplication: async (_, { id, input }) => {
      try {
        const application = await Application.findById(id);

        if (!application) {
          return {
            success: false,
            message: 'Application not found',
            application: null,
            errors: ['Application with specified ID does not exist']
          };
        }

        application.status = input.status;
        application.reviewedAt = new Date();
        if (input.notes) application.notes = input.notes;
        if (input.reviewerId) application.reviewedBy = input.reviewerId;

        await application.save();
        await application.populate('professionalId jobOfferId reviewedBy');

        return {
          success: true,
          message: `Application ${input.status.toLowerCase()} successfully`,
          application,
          errors: []
        };
      } catch (error) {
        return {
          success: false,
          message: 'Error reviewing application',
          application: null,
          errors: [error.message]
        };
      }
    },

    /**
     * Accept application (by employer)
     */
    acceptApplication: async (_, { id, reviewerId, notes }) => {
      try {
        const application = await Application.findById(id);

        if (!application) {
          return {
            success: false,
            message: 'Application not found',
            application: null,
            errors: ['Application with specified ID does not exist']
          };
        }

        await application.accept(reviewerId);
        if (notes) application.notes = notes;
        await application.save();

        await application.populate('professionalId jobOfferId reviewedBy');

        return {
          success: true,
          message: 'Application accepted successfully',
          application,
          errors: []
        };
      } catch (error) {
        return {
          success: false,
          message: 'Error accepting application',
          application: null,
          errors: [error.message]
        };
      }
    },

    /**
     * Reject application (by employer)
     */
    rejectApplication: async (_, { id, reviewerId, reason }) => {
      try {
        const application = await Application.findById(id);

        if (!application) {
          return {
            success: false,
            message: 'Application not found',
            application: null,
            errors: ['Application with specified ID does not exist']
          };
        }

        await application.reject(reviewerId, reason);
        await application.populate('professionalId jobOfferId reviewedBy');

        return {
          success: true,
          message: 'Application rejected successfully',
          application,
          errors: []
        };
      } catch (error) {
        return {
          success: false,
          message: 'Error rejecting application',
          application: null,
          errors: [error.message]
        };
      }
    },

    /**
     * Set application priority (by employer)
     */
    setApplicationPriority: async (_, { id, priority }) => {
      try {
        const application = await Application.findById(id);

        if (!application) {
          return {
            success: false,
            message: 'Application not found',
            application: null,
            errors: ['Application with specified ID does not exist']
          };
        }

        await application.setPriority(priority);
        await application.populate('professionalId jobOfferId reviewedBy');

        return {
          success: true,
          message: 'Application priority updated successfully',
          application,
          errors: []
        };
      } catch (error) {
        return {
          success: false,
          message: 'Error updating application priority',
          application: null,
          errors: [error.message]
        };
      }
    },

    /**
     * Delete application (soft delete)
     */
    deleteApplication: async (_, { id }) => {
      try {
        const application = await Application.findById(id);

        if (!application) {
          return {
            success: false,
            message: 'Application not found',
            application: null,
            errors: ['Application with specified ID does not exist']
          };
        }

        // Can only delete pending applications
        if (application.status !== 'Pending') {
          return {
            success: false,
            message: 'Cannot delete reviewed application',
            application: null,
            errors: ['Application has already been reviewed and cannot be deleted']
          };
        }

        application.isActive = false;
        await application.save();

        await application.populate('professionalId jobOfferId reviewedBy');

        return {
          success: true,
          message: 'Application deleted successfully',
          application,
          errors: []
        };
      } catch (error) {
        return {
          success: false,
          message: 'Error deleting application',
          application: null,
          errors: [error.message]
        };
      }
    }
  },

  // Field resolvers for Application type
  Application: {
    /**
     * Resolve professional reference
     */
    professional: async (parent) => {
      if (parent.professionalId && typeof parent.professionalId === 'object') {
        return parent.professionalId; // Already populated
      }
      return await Professional.findById(parent.professionalId);
    },

    /**
     * Resolve job offer reference
     */
    jobOffer: async (parent) => {
      if (parent.jobOfferId && typeof parent.jobOfferId === 'object') {
        return parent.jobOfferId; // Already populated
      }
      return await JobOffer.findById(parent.jobOfferId);
    },

    /**
     * Resolve reviewer reference
     */
    reviewer: async (parent) => {
      if (!parent.reviewedBy) return null;
      if (typeof parent.reviewedBy === 'object') {
        return parent.reviewedBy; // Already populated
      }
      return await Employer.findById(parent.reviewedBy);
    },

    /**
     * Format dates as ISO strings
     */
    appliedAt: (parent) => parent.appliedAt ? parent.appliedAt.toISOString() : null,
    reviewedAt: (parent) => parent.reviewedAt ? parent.reviewedAt.toISOString() : null,
    availabilityDate: (parent) => parent.availabilityDate ? parent.availabilityDate.toISOString() : null,
    createdAt: (parent) => parent.createdAt ? parent.createdAt.toISOString() : null,
    updatedAt: (parent) => parent.updatedAt ? parent.updatedAt.toISOString() : null
  }
};

module.exports = applicationResolvers;