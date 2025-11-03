const nodemailer = require('nodemailer');
const { Notification, EmailTemplate, ProcessTicket, Component, User } = require('../models');

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Notification types and their handlers
const notificationHandlers = {
  ticket_created: async (data) => {
    const { ticketId, componentId, createdBy } = data;
    
    const ticket = await ProcessTicket.findByPk(ticketId, {
      include: [
        { model: Component, include: [{ model: require('../models/Partner') }] },
        { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    if (!ticket) return;

    const component = ticket.Component;
    const template = await EmailTemplate.findOne({ where: { name: 'ticket_created' } });

    if (!template || !template.isActive) return;

    // Send to component email/DL
    await sendEmail({
      to: component.email,
      subject: processTemplate(template.subject, {
        ticketTitle: ticket.title,
        componentName: component.name,
        createdBy: `${ticket.createdBy.firstName} ${ticket.createdBy.lastName}`,
        status: ticket.status,
        ticketUrl: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
      }),
      html: processTemplate(template.body, {
        ticketTitle: ticket.title,
        componentName: component.name,
        createdBy: `${ticket.createdBy.firstName} ${ticket.createdBy.lastName}`,
        status: ticket.status,
        ticketUrl: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
      })
    });

    // Create notification record
    await Notification.create({
      type: 'email',
      recipient: component.email,
      subject: template.subject,
      content: template.body,
      status: 'sent',
      sentAt: new Date(),
      metadata: { ticketId, componentId, notificationType: 'ticket_created' }
    });
  },

  status_changed: async (data) => {
    const { ticketId, componentId, previousStatus, newStatus, changedBy } = data;
    
    const ticket = await ProcessTicket.findByPk(ticketId, {
      include: [
        { model: Component, include: [{ model: require('../models/Partner') }] },
        { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    if (!ticket) return;

    const component = ticket.Component;
    const template = await EmailTemplate.findOne({ where: { name: 'status_changed' } });

    if (!template || !template.isActive) return;

    // Check if component wants status change notifications
    if (!component.notificationSettings?.statusChanged) return;

    const changedByUser = await User.findByPk(changedBy);

    await sendEmail({
      to: component.email,
      subject: processTemplate(template.subject, {
        ticketTitle: ticket.title,
        componentName: component.name,
        previousStatus,
        newStatus,
        changedBy: `${changedByUser.firstName} ${changedByUser.lastName}`,
        ticketUrl: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
      }),
      html: processTemplate(template.body, {
        ticketTitle: ticket.title,
        componentName: component.name,
        previousStatus,
        newStatus,
        changedBy: `${changedByUser.firstName} ${changedByUser.lastName}`,
        ticketUrl: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
      })
    });

    await Notification.create({
      type: 'email',
      recipient: component.email,
      subject: template.subject,
      content: template.body,
      status: 'sent',
      sentAt: new Date(),
      metadata: { ticketId, componentId, notificationType: 'status_changed' }
    });
  },

  comment_added: async (data) => {
    const { ticketId, commentId, authorId, recipientId } = data;
    
    const ticket = await ProcessTicket.findByPk(ticketId, {
      include: [
        { model: Component },
        { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ]
    });

    if (!ticket) return;

    const comment = await require('../models/Comment').findByPk(commentId, {
      include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName'] }]
    });

    if (!comment || comment.isInternal) return;

    const template = await EmailTemplate.findOne({ where: { name: 'comment_added' } });
    if (!template || !template.isActive) return;

    await sendEmail({
      to: ticket.createdBy.email,
      subject: processTemplate(template.subject, {
        ticketTitle: ticket.title,
        authorName: `${comment.author.firstName} ${comment.author.lastName}`,
        ticketUrl: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
      }),
      html: processTemplate(template.body, {
        ticketTitle: ticket.title,
        authorName: `${comment.author.firstName} ${comment.author.lastName}`,
        commentContent: comment.content,
        ticketUrl: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
      })
    });

    await Notification.create({
      type: 'email',
      recipient: ticket.createdBy.email,
      subject: template.subject,
      content: template.body,
      status: 'sent',
      sentAt: new Date(),
      metadata: { ticketId, commentId, notificationType: 'comment_added' }
    });
  },

  approaching_deadline: async (data) => {
    const { ticketId } = data;
    
    const ticket = await ProcessTicket.findByPk(ticketId, {
      include: [
        { model: Component },
        { model: User, as: 'assignedTo', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ]
    });

    if (!ticket || !ticket.deadline || !ticket.assignedTo) return;

    const template = await EmailTemplate.findOne({ where: { name: 'approaching_deadline' } });
    if (!template || !template.isActive) return;

    await sendEmail({
      to: ticket.assignedTo.email,
      subject: processTemplate(template.subject, {
        ticketTitle: ticket.title,
        deadline: ticket.deadline.toLocaleDateString(),
        ticketUrl: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
      }),
      html: processTemplate(template.body, {
        ticketTitle: ticket.title,
        deadline: ticket.deadline.toLocaleDateString(),
        ticketUrl: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
      })
    });

    await Notification.create({
      type: 'email',
      recipient: ticket.assignedTo.email,
      subject: template.subject,
      content: template.body,
      status: 'sent',
      sentAt: new Date(),
      metadata: { ticketId, notificationType: 'approaching_deadline' }
    });
  },

  ticket_live: async (data) => {
    const { ticketId } = data;
    
    const ticket = await ProcessTicket.findByPk(ticketId, {
      include: [
        { model: Component },
        { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ]
    });

    if (!ticket) return;

    const template = await EmailTemplate.findOne({ where: { name: 'ticket_live' } });
    if (!template || !template.isActive) return;

    // Send to all users with agent role
    const agents = await User.findAll({
      where: { role: 'agent', isActive: true },
      attributes: ['id', 'firstName', 'lastName', 'email']
    });

    for (const agent of agents) {
      await sendEmail({
        to: agent.email,
        subject: processTemplate(template.subject, {
          ticketTitle: ticket.title,
          componentName: ticket.Component.name,
          ticketUrl: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
        }),
        html: processTemplate(template.body, {
          ticketTitle: ticket.title,
          componentName: ticket.Component.name,
          ticketUrl: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
        })
      });

      await Notification.create({
        type: 'email',
        recipient: agent.email,
        subject: template.subject,
        content: template.body,
        status: 'sent',
        sentAt: new Date(),
        metadata: { ticketId, notificationType: 'ticket_live' }
      });
    }
  }
};

// Main notification function
async function sendNotification(type, data) {
  try {
    const handler = notificationHandlers[type];
    if (handler) {
      await handler(data);
    }
  } catch (error) {
    console.error(`Error sending ${type} notification:`, error);
    
    // Create failed notification record
    await Notification.create({
      type: 'email',
      recipient: data.recipient || 'unknown',
      subject: 'Notification Failed',
      content: `Failed to send ${type} notification`,
      status: 'failed',
      errorMessage: error.message,
      metadata: { ...data, notificationType: type }
    });
  }
}

// Email sending function
async function sendEmail({ to, subject, html, text }) {
  if (!transporter) {
    console.warn('Email transporter not configured');
    return;
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@processmanagement.com',
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, '')
  };

  const result = await transporter.sendMail(mailOptions);
  console.log(`Email sent to ${to}: ${result.messageId}`);
  return result;
}

// Template processing function
function processTemplate(template, variables) {
  let processed = template;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    processed = processed.replace(new RegExp(placeholder, 'g'), value);
  }
  return processed;
}

// Scheduled notification functions
async function checkApproachingDeadlines() {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const tickets = await ProcessTicket.findAll({
    where: {
      deadline: {
        [require('sequelize').Op.between]: [now, tomorrow]
      },
      status: {
        [require('sequelize').Op.notIn]: ['live', 'closed']
      }
    },
    include: [{ model: Component }]
  });

  for (const ticket of tickets) {
    await sendNotification('approaching_deadline', { ticketId: ticket.id });
  }
}

// Export functions
module.exports = {
  sendNotification,
  sendEmail,
  processTemplate,
  checkApproachingDeadlines
};
