const express = require('express');
const { Integration, ProcessTicket } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get Document360 articles for a ticket
router.get('/document360/:ticketId', authenticateToken, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const integration = await Integration.findOne({ where: { name: 'Document360' } });

    if (!integration || !integration.isEnabled) {
      return res.status(404).json({ error: 'Document360 integration not enabled' });
    }

    const ticket = await ProcessTicket.findByPk(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Mock Document360 API call - replace with actual API integration
    const articles = await searchDocument360Articles(ticket.title, ticket.description, integration.config);

    res.json({ articles });
  } catch (error) {
    console.error('Document360 integration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search Document360 articles
router.post('/document360/search', authenticateToken, async (req, res) => {
  try {
    const { query, filters } = req.body;
    const integration = await Integration.findOne({ where: { name: 'Document360' } });

    if (!integration || !integration.isEnabled) {
      return res.status(404).json({ error: 'Document360 integration not enabled' });
    }

    // Mock Document360 search - replace with actual API integration
    const articles = await searchDocument360Articles(query, null, integration.config, filters);

    res.json({ articles });
  } catch (error) {
    console.error('Document360 search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get integration status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const integrations = await Integration.findAll({
      attributes: ['name', 'type', 'isEnabled', 'lastSync', 'syncStatus']
    });

    res.json({ integrations });
  } catch (error) {
    console.error('Get integration status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sync integration
router.post('/:integrationName/sync', authenticateToken, async (req, res) => {
  try {
    const { integrationName } = req.params;
    const integration = await Integration.findOne({ where: { name: integrationName } });

    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    if (!integration.isEnabled) {
      return res.status(400).json({ error: 'Integration is disabled' });
    }

    // Update sync status
    await integration.update({
      syncStatus: 'in_progress',
      lastSync: new Date()
    });

    // Perform sync based on integration type
    let syncResult;
    switch (integration.type) {
      case 'document360':
        syncResult = await syncDocument360(integration.config);
        break;
      case 'jira':
        syncResult = await syncJira(integration.config);
        break;
      default:
        syncResult = { success: false, error: 'Unknown integration type' };
    }

    // Update sync status based on result
    await integration.update({
      syncStatus: syncResult.success ? 'success' : 'failed',
      errorMessage: syncResult.error || null
    });

    res.json({ success: syncResult.success, message: syncResult.message });
  } catch (error) {
    console.error('Sync integration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mock functions for Document360 integration
async function searchDocument360Articles(query, description, config, filters = {}) {
  // This would be replaced with actual Document360 API calls
  return [
    {
      id: 'doc-001',
      title: 'Process Update Guidelines',
      content: 'Guidelines for creating and managing process updates...',
      url: 'https://docs.example.com/process-updates',
      category: 'Process Management',
      lastUpdated: new Date().toISOString(),
      relevance: 0.95
    },
    {
      id: 'doc-002',
      title: 'Change Management Workflow',
      content: 'Step-by-step workflow for managing changes...',
      url: 'https://docs.example.com/change-workflow',
      category: 'Workflow',
      lastUpdated: new Date().toISOString(),
      relevance: 0.87
    }
  ];
}

async function syncDocument360(config) {
  // Mock Document360 sync
  return { success: true, message: 'Document360 sync completed successfully' };
}

async function syncJira(config) {
  // Mock Jira sync
  return { success: true, message: 'Jira sync completed successfully' };
}

module.exports = router;
