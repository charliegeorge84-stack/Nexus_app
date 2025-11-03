const express = require('express');
const { body, validationResult } = require('express-validator');
const { Partner, Component, Brand, User, EmailTemplate, Integration } = require('../models');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Partner Management
router.get('/partners', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const partners = await Partner.findAll({
      include: [
        { model: Brand, through: { attributes: [] } },
        { model: Component }
      ],
      order: [['name', 'ASC']]
    });
    res.json(partners);
  } catch (error) {
    console.error('Get partners error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/partners', [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('contactPerson').notEmpty(),
  body('phone').optional(),
  body('address').optional(),
  body('timezone').optional(),
  body('brandIds').optional().isArray()
], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, contactPerson, phone, address, timezone, brandIds } = req.body;

    const partner = await Partner.create({
      name,
      email,
      contactPerson,
      phone,
      address,
      timezone: timezone || 'UTC'
    });

    if (brandIds && brandIds.length > 0) {
      const brands = await Brand.findAll({ where: { id: brandIds } });
      await partner.addBrands(brands);
    }

    const partnerWithAssociations = await Partner.findByPk(partner.id, {
      include: [
        { model: Brand, through: { attributes: [] } },
        { model: Component }
      ]
    });

    res.status(201).json(partnerWithAssociations);
  } catch (error) {
    console.error('Create partner error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/partners/:id', [
  body('name').optional().notEmpty(),
  body('email').optional().isEmail(),
  body('contactPerson').optional().notEmpty(),
  body('phone').optional(),
  body('address').optional(),
  body('timezone').optional(),
  body('isActive').optional().isBoolean(),
  body('brandIds').optional().isArray()
], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const partner = await Partner.findByPk(id);

    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    const updateData = { ...req.body };
    delete updateData.brandIds;

    await partner.update(updateData);

    if (req.body.brandIds) {
      const brands = await Brand.findAll({ where: { id: req.body.brandIds } });
      await partner.setBrands(brands);
    }

    const updatedPartner = await Partner.findByPk(id, {
      include: [
        { model: Brand, through: { attributes: [] } },
        { model: Component }
      ]
    });

    res.json(updatedPartner);
  } catch (error) {
    console.error('Update partner error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Component Management
router.get('/components', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const components = await Component.findAll({
      include: [
        { model: Partner },
        { model: Brand, through: { attributes: [] } }
      ],
      order: [['name', 'ASC']]
    });
    res.json(components);
  } catch (error) {
    console.error('Get components error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/components', [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('description').optional(),
  body('partnerId').isInt(),
  body('languages').optional().isArray(),
  body('notificationSettings').optional().isObject(),
  body('escalationRules').optional().isObject()
], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const component = await Component.create(req.body);

    const componentWithAssociations = await Component.findByPk(component.id, {
      include: [
        { model: Partner },
        { model: Brand, through: { attributes: [] } }
      ]
    });

    res.status(201).json(componentWithAssociations);
  } catch (error) {
    console.error('Create component error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/components/:id', [
  body('name').optional().notEmpty(),
  body('email').optional().isEmail(),
  body('description').optional(),
  body('partnerId').optional().isInt(),
  body('languages').optional().isArray(),
  body('isActive').optional().isBoolean(),
  body('notificationSettings').optional().isObject(),
  body('escalationRules').optional().isObject()
], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const component = await Component.findByPk(id);

    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }

    await component.update(req.body);

    const updatedComponent = await Component.findByPk(id, {
      include: [
        { model: Partner },
        { model: Brand, through: { attributes: [] } }
      ]
    });

    res.json(updatedComponent);
  } catch (error) {
    console.error('Update component error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Brand Management
router.get('/brands', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const brands = await Brand.findAll({
      include: [
        { model: Partner, through: { attributes: [] } }
      ],
      order: [['name', 'ASC']]
    });
    res.json(brands);
  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/brands', [
  body('name').notEmpty(),
  body('description').optional(),
  body('logo').optional(),
  body('settings').optional().isObject()
], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const brand = await Brand.create(req.body);

    const brandWithAssociations = await Brand.findByPk(brand.id, {
      include: [
        { model: Partner, through: { attributes: [] } }
      ]
    });

    res.status(201).json(brandWithAssociations);
  } catch (error) {
    console.error('Create brand error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User Management
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['lastName', 'ASC'], ['firstName', 'ASC']]
    });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/users/:id', [
  body('firstName').optional().notEmpty(),
  body('lastName').optional().notEmpty(),
  body('role').optional().isIn(['admin', 'process_team', 'supervisor', 'support_ops', 'agent']),
  body('isActive').optional().isBoolean(),
  body('preferences').optional().isObject()
], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update(req.body);

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Email Template Management
router.get('/email-templates', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const templates = await EmailTemplate.findAll({
      order: [['name', 'ASC']]
    });
    res.json(templates);
  } catch (error) {
    console.error('Get email templates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/email-templates/:id', [
  body('subject').optional().notEmpty(),
  body('body').optional().notEmpty(),
  body('variables').optional().isArray(),
  body('isActive').optional().isBoolean(),
  body('description').optional()
], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const template = await EmailTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({ error: 'Email template not found' });
    }

    await template.update(req.body);
    res.json(template);
  } catch (error) {
    console.error('Update email template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Integration Management
router.get('/integrations', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const integrations = await Integration.findAll({
      order: [['name', 'ASC']]
    });
    res.json(integrations);
  } catch (error) {
    console.error('Get integrations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/integrations/:id', [
  body('isEnabled').optional().isBoolean(),
  body('config').optional().isObject()
], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const integration = await Integration.findByPk(id);

    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    await integration.update(req.body);
    res.json(integration);
  } catch (error) {
    console.error('Update integration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
