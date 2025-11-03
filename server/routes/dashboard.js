const express = require('express');
const { ProcessTicket, Component, User, Partner, Brand } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Get dashboard overview data
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Ticket statistics
    const totalTickets = await ProcessTicket.count({ where: { isActive: true } });
    const ticketsThisMonth = await ProcessTicket.count({
      where: {
        createdAt: { [Op.gte]: thirtyDaysAgo },
        isActive: true
      }
    });

    // Status breakdown
    const statusBreakdown = await ProcessTicket.findAll({
      where: { isActive: true },
      attributes: [
        'status',
        [Op.fn('COUNT', Op.col('id')), 'count']
      ],
      group: ['status']
    });

    // Component statistics
    const componentStats = await Component.findAll({
      include: [{
        model: ProcessTicket,
        where: { isActive: true },
        required: false
      }],
      attributes: [
        'id',
        'name',
        [Op.fn('COUNT', Op.col('ProcessTickets.id')), 'ticketCount']
      ],
      group: ['Component.id', 'Component.name']
    });

    // Recent activity
    const recentTickets = await ProcessTicket.findAll({
      where: { isActive: true },
      include: [
        { model: Component },
        { model: User, as: 'createdBy', attributes: ['firstName', 'lastName'] }
      ],
      order: [['updatedAt', 'DESC']],
      limit: 10
    });

    res.json({
      overview: {
        totalTickets,
        ticketsThisMonth,
        statusBreakdown,
        componentStats,
        recentTickets
      }
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get process team dashboard data
router.get('/process-team', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.query;
    const where = { isActive: true };

    if (userId) {
      where.createdBy = userId;
    }

    // Created tickets
    const createdTickets = await ProcessTicket.count({ where });

    // Pending approvals
    const pendingApprovals = await ProcessTicket.count({
      where: {
        ...where,
        status: 'under_review'
      }
    });

    // Overdue items
    const overdueItems = await ProcessTicket.count({
      where: {
        ...where,
        deadline: { [Op.lt]: new Date() },
        status: { [Op.notIn]: ['live', 'closed'] }
      }
    });

    // Tickets by status
    const ticketsByStatus = await ProcessTicket.findAll({
      where,
      attributes: [
        'status',
        [Op.fn('COUNT', Op.col('id')), 'count']
      ],
      group: ['status']
    });

    res.json({
      createdTickets,
      pendingApprovals,
      overdueItems,
      ticketsByStatus
    });
  } catch (error) {
    console.error('Process team dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get support ops dashboard data
router.get('/support-ops', authenticateToken, async (req, res) => {
  try {
    // Tickets by status
    const ticketsByStatus = await ProcessTicket.findAll({
      where: { isActive: true },
      attributes: [
        'status',
        [Op.fn('COUNT', Op.col('id')), 'count']
      ],
      group: ['status']
    });

    // Partner response times
    const partnerResponseTimes = await ProcessTicket.findAll({
      where: { isActive: true },
      include: [
        { model: Component, include: [{ model: Partner }] }
      ],
      attributes: [
        'Component.Partner.name',
        [Op.fn('AVG', Op.fn('EXTRACT', 'EPOCH', Op.fn('AGE', Op.col('updatedAt'), Op.col('createdAt')))), 'avgResponseTime']
      ],
      group: ['Component.Partner.name']
    });

    // Upcoming deadlines
    const upcomingDeadlines = await ProcessTicket.findAll({
      where: {
        isActive: true,
        deadline: { [Op.gte]: new Date() },
        status: { [Op.notIn]: ['live', 'closed'] }
      },
      include: [
        { model: Component },
        { model: User, as: 'assignedTo', attributes: ['firstName', 'lastName'] }
      ],
      order: [['deadline', 'ASC']],
      limit: 10
    });

    res.json({
      ticketsByStatus,
      partnerResponseTimes,
      upcomingDeadlines
    });
  } catch (error) {
    console.error('Support ops dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get admin analytics
router.get('/admin', authenticateToken, async (req, res) => {
  try {
    // System usage statistics
    const totalUsers = await User.count({ where: { isActive: true } });
    const totalPartners = await Partner.count({ where: { isActive: true } });
    const totalComponents = await Component.count({ where: { isActive: true } });
    const totalBrands = await Brand.count({ where: { isActive: true } });

    // Workflow bottlenecks
    const workflowBottlenecks = await ProcessTicket.findAll({
      where: { isActive: true },
      attributes: [
        'status',
        [Op.fn('COUNT', Op.col('id')), 'count'],
        [Op.fn('AVG', Op.fn('EXTRACT', 'EPOCH', Op.fn('AGE', 'now()', Op.col('createdAt')))), 'avgAge']
      ],
      group: ['status']
    });

    // Partner engagement
    const partnerEngagement = await ProcessTicket.findAll({
      where: { isActive: true },
      include: [
        { model: Component, include: [{ model: Partner }] }
      ],
      attributes: [
        'Component.Partner.name',
        [Op.fn('COUNT', Op.col('id')), 'ticketCount'],
        [Op.fn('COUNT', Op.fn('DISTINCT', Op.col('createdBy'))), 'uniqueUsers']
      ],
      group: ['Component.Partner.name']
    });

    res.json({
      systemUsage: {
        totalUsers,
        totalPartners,
        totalComponents,
        totalBrands
      },
      workflowBottlenecks,
      partnerEngagement
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get real-time status board
router.get('/status-board', authenticateToken, async (req, res) => {
  try {
    const activeTickets = await ProcessTicket.findAll({
      where: { isActive: true },
      include: [
        { model: Component, include: [{ model: Partner }] },
        { model: User, as: 'createdBy', attributes: ['firstName', 'lastName'] },
        { model: User, as: 'assignedTo', attributes: ['firstName', 'lastName'] }
      ],
      order: [['updatedAt', 'DESC']],
      limit: 50
    });

    res.json({ activeTickets });
  } catch (error) {
    console.error('Status board error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
