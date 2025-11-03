const User = require('./User');
const Partner = require('./Partner');
const Component = require('./Component');
const Brand = require('./Brand');
const ProcessTicket = require('./ProcessTicket');
const Comment = require('./Comment');
const Notification = require('./Notification');
const EmailTemplate = require('./EmailTemplate');
const Integration = require('./Integration');

// Partner associations
Partner.hasMany(Component);
Component.belongsTo(Partner);

// Brand associations (Many-to-Many with Partner)
Partner.belongsToMany(Brand, { through: 'PartnerBrands' });
Brand.belongsToMany(Partner, { through: 'PartnerBrands' });

// ProcessTicket associations
ProcessTicket.belongsTo(User, { as: 'createdBy' });
ProcessTicket.belongsTo(User, { as: 'assignedTo' });
ProcessTicket.belongsTo(Component);
ProcessTicket.belongsToMany(Brand, { through: 'TicketBrands' });
Brand.belongsToMany(ProcessTicket, { through: 'TicketBrands' });

// Comment associations
Comment.belongsTo(User, { as: 'author' });
Comment.belongsTo(ProcessTicket);
ProcessTicket.hasMany(Comment);

// Notification associations
Notification.belongsTo(User, { as: 'recipientUser' });
Notification.belongsTo(ProcessTicket);

// Status history tracking
const StatusHistory = require('./StatusHistory');
ProcessTicket.hasMany(StatusHistory, { as: 'statusHistory' });
StatusHistory.belongsTo(User, { as: 'changedBy' });

module.exports = {
  User,
  Partner,
  Component,
  Brand,
  ProcessTicket,
  Comment,
  Notification,
  EmailTemplate,
  Integration,
  StatusHistory
};
