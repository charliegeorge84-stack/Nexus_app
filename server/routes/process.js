const express = require('express');
const { body, validationResult } = require('express-validator');
const { ProcessTicket, Component, User, Comment, StatusHistory, Brand } = require('../models');
const { authenticateToken, requireProcessTeam, requireSupervisor } = require('../middleware/auth');
const { sendNotification } = require('../services/notificationService');

const router = express.Router();

// Get all tickets with filtering and pagination
router.get('/tickets', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      componentId,
      assignedTo,
      createdBy,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = { isActive: true };

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (componentId) where.componentId = componentId;
    if (assignedTo) where.assignedTo = assignedTo;
    if (createdBy) where.createdBy = createdBy;
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const tickets = await ProcessTicket.findAndCountAll({
      where,
      include: [
        { model: Component, include: [{ model: require('../models/Partner') }] },
        { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'assignedTo', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Brand, through: { attributes: [] } },
        { model: Comment, include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName'] }] }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      tickets: tickets.rows,
      total: tickets.count,
      page: parseInt(page),
      totalPages: Math.ceil(tickets.count / limit)
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single ticket
router.get('/tickets/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await ProcessTicket.findByPk(id, {
      include: [
        { model: Component, include: [{ model: require('../models/Partner') }] },
        { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'assignedTo', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Brand, through: { attributes: [] } },
        { model: Comment, include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName'] }] },
        { model: StatusHistory, include: [{ model: User, as: 'changedBy', attributes: ['id', 'firstName', 'lastName'] }] }
      ]
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new ticket
router.post('/tickets', [
  body('title').notEmpty(),
  body('description').notEmpty(),
  body('componentId').isInt(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('scheduledDate').optional().isISO8601(),
  body('deadline').optional().isISO8601(),
  body('tags').optional().isArray(),
  body('brandIds').optional().isArray(),
  body('assignedTo').optional().isInt()
], authenticateToken, requireProcessTeam, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const ticketData = {
      ...req.body,
      createdBy: req.user.id,
      status: 'draft'
    };

    const ticket = await ProcessTicket.create(ticketData);

    // Associate brands if provided
    if (req.body.brandIds && req.body.brandIds.length > 0) {
      const brands = await Brand.findAll({ where: { id: req.body.brandIds } });
      await ticket.addBrands(brands);
    }

    // Create initial status history
    await StatusHistory.create({
      processTicketId: ticket.id,
      newStatus: 'draft',
      changedBy: req.user.id,
      reason: 'Ticket created'
    });

    // Send notifications
    await sendNotification('ticket_created', {
      ticketId: ticket.id,
      componentId: ticket.componentId,
      createdBy: req.user.id
    });

    const createdTicket = await ProcessTicket.findByPk(ticket.id, {
      include: [
        { model: Component, include: [{ model: require('../models/Partner') }] },
        { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'assignedTo', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Brand, through: { attributes: [] } }
      ]
    });

    res.status(201).json(createdTicket);
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update ticket
router.put('/tickets/:id', [
  body('title').optional().notEmpty(),
  body('description').optional().notEmpty(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('scheduledDate').optional().isISO8601(),
  body('deadline').optional().isISO8601(),
  body('tags').optional().isArray(),
  body('brandIds').optional().isArray(),
  body('assignedTo').optional().isInt()
], authenticateToken, requireProcessTeam, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const ticket = await ProcessTicket.findByPk(id);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check permissions based on ticket status
    if (!canEditTicket(ticket, req.user)) {
      return res.status(403).json({ error: 'Cannot edit ticket in current status' });
    }

    await ticket.update(req.body);

    // Update brand associations if provided
    if (req.body.brandIds) {
      const brands = await Brand.findAll({ where: { id: req.body.brandIds } });
      await ticket.setBrands(brands);
    }

    const updatedTicket = await ProcessTicket.findByPk(id, {
      include: [
        { model: Component, include: [{ model: require('../models/Partner') }] },
        { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'assignedTo', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Brand, through: { attributes: [] } }
      ]
    });

    res.json(updatedTicket);
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change ticket status
router.put('/tickets/:id/status', [
  body('status').isIn(['draft', 'in_progress', 'under_review', 'approved', 'scheduled', 'live', 'on_hold', 'closed']),
  body('reason').optional().notEmpty(),
  body('assignedTo').optional().isInt()
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status, reason, assignedTo } = req.body;

    const ticket = await ProcessTicket.findByPk(id, {
      include: [{ model: Component }]
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check if status change is allowed
    if (!canChangeStatus(ticket.status, status, req.user)) {
      return res.status(403).json({ error: 'Status change not allowed' });
    }

    const previousStatus = ticket.status;

    // Update ticket
    const updateData = { status };
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (status === 'live') updateData.publishedDate = new Date();

    await ticket.update(updateData);

    // Create status history
    await StatusHistory.create({
      processTicketId: ticket.id,
      previousStatus,
      newStatus: status,
      changedBy: req.user.id,
      reason: reason || `Status changed from ${previousStatus} to ${status}`
    });

    // Send notifications
    await sendNotification('status_changed', {
      ticketId: ticket.id,
      componentId: ticket.componentId,
      previousStatus,
      newStatus: status,
      changedBy: req.user.id
    });

    const updatedTicket = await ProcessTicket.findByPk(id, {
      include: [
        { model: Component, include: [{ model: require('../models/Partner') }] },
        { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'assignedTo', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Brand, through: { attributes: [] } }
      ]
    });

    res.json(updatedTicket);
  } catch (error) {
    console.error('Change status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk status update
router.put('/tickets/bulk-status', [
  body('ticketIds').isArray({ min: 1 }),
  body('status').isIn(['draft', 'in_progress', 'under_review', 'approved', 'scheduled', 'live', 'on_hold', 'closed']),
  body('reason').optional().notEmpty()
], authenticateToken, requireSupervisor, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { ticketIds, status, reason } = req.body;
    const results = [];

    for (const ticketId of ticketIds) {
      try {
        const ticket = await ProcessTicket.findByPk(ticketId);
        if (!ticket) {
          results.push({ ticketId, success: false, error: 'Ticket not found' });
          continue;
        }

        if (!canChangeStatus(ticket.status, status, req.user)) {
          results.push({ ticketId, success: false, error: 'Status change not allowed' });
          continue;
        }

        const previousStatus = ticket.status;
        await ticket.update({ status });

        // Create status history
        await StatusHistory.create({
          processTicketId: ticket.id,
          previousStatus,
          newStatus: status,
          changedBy: req.user.id,
          reason: reason || `Bulk status change from ${previousStatus} to ${status}`
        });

        // Send notifications
        await sendNotification('status_changed', {
          ticketId: ticket.id,
          componentId: ticket.componentId,
          previousStatus,
          newStatus: status,
          changedBy: req.user.id
        });

        results.push({ ticketId, success: true });
      } catch (error) {
        results.push({ ticketId, success: false, error: error.message });
      }
    }

    res.json({ results });
  } catch (error) {
    console.error('Bulk status update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add comment
router.post('/tickets/:id/comments', [
  body('content').notEmpty(),
  body('isInternal').optional().isBoolean()
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { content, isInternal = false } = req.body;

    const ticket = await ProcessTicket.findByPk(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const comment = await Comment.create({
      content,
      isInternal,
      authorId: req.user.id,
      processTicketId: id
    });

    // Send notification to original creator
    if (!isInternal && ticket.createdBy !== req.user.id) {
      await sendNotification('comment_added', {
        ticketId: ticket.id,
        commentId: comment.id,
        authorId: req.user.id,
        recipientId: ticket.createdBy
      });
    }

    const commentWithAuthor = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName'] }]
    });

    res.status(201).json(commentWithAuthor);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper functions
function canEditTicket(ticket, user) {
  const editableStatuses = ['draft', 'in_progress'];
  return editableStatuses.includes(ticket.status) || 
         ticket.createdBy === user.id || 
         user.role === 'admin';
}

function canChangeStatus(currentStatus, newStatus, user) {
  const statusTransitions = {
    draft: ['in_progress', 'on_hold'],
    in_progress: ['under_review', 'on_hold'],
    under_review: ['approved', 'in_progress', 'on_hold'],
    approved: ['scheduled', 'under_review'],
    scheduled: ['live', 'approved'],
    live: ['closed'],
    on_hold: ['draft', 'in_progress', 'under_review'],
    closed: []
  };

  const allowedTransitions = statusTransitions[currentStatus] || [];
  
  // Admins can make any status change
  if (user.role === 'admin') return true;
  
  // Supervisors can make most status changes
  if (user.role === 'supervisor' && newStatus !== 'closed') return true;
  
  // Process team can make standard workflow transitions
  if (user.role === 'process_team') return allowedTransitions.includes(newStatus);
  
  return false;
}

module.exports = router;
