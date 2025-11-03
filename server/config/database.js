const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database.sqlite'),
  logging: false,
  define: {
    timestamps: true,
    underscored: true
  }
});

const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Import models
    require('../models/User');
    require('../models/Partner');
    require('../models/Component');
    require('../models/Brand');
    require('../models/ProcessTicket');
    require('../models/Comment');
    require('../models/Notification');
    require('../models/EmailTemplate');
    require('../models/Integration');
    
    // Sync database
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized successfully.');
    
    // Seed initial data
    await seedInitialData();
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

const seedInitialData = async () => {
  const { User, Partner, Component, Brand, EmailTemplate } = require('../models');
  
  try {
    // Check if data already exists
    const userCount = await User.count();
    if (userCount > 0) {
      console.log('✅ Database already seeded.');
      return;
    }

    // Create default admin user
    await User.create({
      email: 'admin@processmanagement.com',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin',
      isActive: true
    });

    // Create sample brands
    const brandA = await Brand.create({
      name: 'Brand_A',
      description: 'Brand A for Partner 1',
      isActive: true
    });

    const brandB = await Brand.create({
      name: 'Brand_B',
      description: 'Brand B for Partner 2',
      isActive: true
    });

    const brandC = await Brand.create({
      name: 'Brand_C',
      description: 'Brand C for Partner 1',
      isActive: true
    });

    // Create sample partners
    const partner1 = await Partner.create({
      name: 'Partner_1',
      email: 'partner1@example.com',
      contactPerson: 'John Doe',
      phone: '+1-555-0123',
      isActive: true
    });

    const partner2 = await Partner.create({
      name: 'Partner_2',
      email: 'partner2@example.com',
      contactPerson: 'Jane Smith',
      phone: '+1-555-0456',
      isActive: true
    });

    // Create sample components
    await Component.create({
      name: 'Partner_1_Billing',
      email: 'billing-team@partner1.com',
      description: 'Billing component for Partner 1',
      partnerId: partner1.id,
      isActive: true
    });

    await Component.create({
      name: 'Partner_2_Technical',
      email: 'tech-support-dl@partner2.com',
      description: 'Technical support component for Partner 2',
      partnerId: partner2.id,
      isActive: true
    });

    // Associate brands with partners
    await partner1.addBrands([brandA, brandC]);
    await partner2.addBrands([brandB]);

    // Create email templates
    await EmailTemplate.create({
      name: 'ticket_created',
      subject: 'New Process Update Created - {{ticketTitle}}',
      body: `
        <h2>New Process Update Created</h2>
        <p>A new process update has been created for your component.</p>
        <p><strong>Title:</strong> {{ticketTitle}}</p>
        <p><strong>Component:</strong> {{componentName}}</p>
        <p><strong>Created by:</strong> {{createdBy}}</p>
        <p><strong>Status:</strong> {{status}}</p>
        <p><a href="{{ticketUrl}}">View Details</a></p>
      `,
      isActive: true
    });

    await EmailTemplate.create({
      name: 'status_changed',
      subject: 'Process Update Status Changed - {{ticketTitle}}',
      body: `
        <h2>Process Update Status Changed</h2>
        <p>The status of a process update has been changed.</p>
        <p><strong>Title:</strong> {{ticketTitle}}</p>
        <p><strong>Component:</strong> {{componentName}}</p>
        <p><strong>Previous Status:</strong> {{previousStatus}}</p>
        <p><strong>New Status:</strong> {{newStatus}}</p>
        <p><strong>Changed by:</strong> {{changedBy}}</p>
        <p><a href="{{ticketUrl}}">View Details</a></p>
      `,
      isActive: true
    });

    console.log('✅ Initial data seeded successfully.');
  } catch (error) {
    console.error('❌ Error seeding initial data:', error);
  }
};

module.exports = {
  sequelize,
  initializeDatabase
};
