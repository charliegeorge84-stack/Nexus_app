# Process Change Management Platform

A comprehensive Process Change Management Platform with admin controls, integration capabilities, and robust notification systems. Built with React, TypeScript, Node.js, and SQLite.

## 🚀 Features

### Core Functionality
- **JIRA-Style Workflow**: Complete ticket lifecycle management with status tracking
- **Role-Based Access Control**: Admin, Process Team, Supervisor, Support Ops, and Agent roles
- **Advanced Notifications**: Email notifications with customizable templates
- **Document360 Integration**: Knowledge base integration with side panel view
- **Real-time Dashboard**: Analytics and reporting for all user roles
- **Bulk Operations**: Handle multiple tickets simultaneously

### Admin Console
- **Partner Management**: Add/edit partners, assign brands, set permissions
- **Component Configuration**: Define components with email/DL mappings
- **Brand Management**: Control partner-brand relationships
- **Integration Toggle**: Enable/disable external integrations
- **Email Template Management**: Customize notification templates
- **User Role Assignment**: Manage access levels and permissions

### Workflow Statuses
- Draft → In Progress → Under Review → Approved → Scheduled → Live → On Hold → Closed
- Status-based permissions and audit trail
- Bulk status updates for supervisors

### Notification System
- Component-based alerts to configured DLs
- Comment notifications to original creators
- Status change alerts to stakeholders
- Scheduled reminders for upcoming deadlines
- Escalation rules for overdue approvals

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **SQLite** with Sequelize ORM
- **JWT** authentication
- **Nodemailer** for email notifications
- **Cron** for scheduled tasks

### Frontend
- **React 18** with TypeScript
- **React Router** for navigation
- **React Query** for data fetching
- **React Hook Form** for form management
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Hot Toast** for notifications

## 📦 Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd process-change-management
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file in server directory
   cd server
   cp .env.example .env
   ```

   Configure the following variables:
   ```env
   PORT=5000
   JWT_SECRET=your-secret-key
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=noreply@processmanagement.com
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start the development servers**
   ```bash
   # From the root directory
   npm run dev
   ```

   This will start:
   - Backend server on http://localhost:5000
   - Frontend development server on http://localhost:3000

5. **Access the application**
   - Open http://localhost:3000 in your browser
   - Login with default admin credentials:
     - Email: `admin@processmanagement.com`
     - Password: `password`

## 🏗️ Project Structure

```
process-change-management/
├── server/                 # Backend Node.js application
│   ├── config/            # Database and app configuration
│   ├── models/            # Sequelize data models
│   ├── routes/            # API route handlers
│   ├── middleware/        # Express middleware
│   ├── services/          # Business logic services
│   └── utils/             # Utility functions
├── client/                # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service functions
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom React hooks
│   │   ├── types/         # TypeScript type definitions
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
└── README.md
```

## 🔧 Configuration

### Database Setup
The application uses SQLite by default. The database file will be created automatically at `server/database.sqlite` when you first run the application.

### Email Configuration
Configure your SMTP settings in the `.env` file to enable email notifications:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@processmanagement.com
```

### Document360 Integration
To enable Document360 integration:

1. Add Document360 configuration to the database
2. Update the integration settings in the admin console
3. Configure API credentials in the integration settings

## 👥 User Roles & Permissions

### Admin
- Full system access
- User management
- Partner and component configuration
- System settings and integrations

### Process Team
- Create and manage process tickets
- Update ticket content and metadata
- View assigned tickets and components

### Supervisor
- Review and approve tickets
- Bulk status updates
- Override workflow restrictions
- Access to analytics and reporting

### Support Ops
- Monitor ticket status
- Handle escalations
- Access to support-specific dashboards
- Partner communication management

### Agent
- View live/completed updates
- Access to knowledge base
- Receive notifications about new updates

## 📊 Dashboard Features

### Process Team Dashboard
- Created tickets overview
- Pending approvals tracking
- Overdue items alerts
- Status breakdown charts

### Support Ops Dashboard
- Tickets by status
- Partner response times
- Upcoming deadlines
- Escalation management

### Admin Analytics
- System usage statistics
- Workflow bottlenecks
- Partner engagement metrics
- User activity tracking

## 🔔 Notification System

### Email Notifications
- **Ticket Created**: Component DLs get notification
- **Comment Added**: Original creator gets email
- **Status Changed**: Component partners get status update
- **Approaching Deadline**: Supervisors get reminder
- **Ticket Goes Live**: Agents get new update notification

### Notification Templates
Customizable email templates with variable substitution:
- `{{ticketTitle}}` - Process update title
- `{{componentName}}` - Component name
- `{{createdBy}}` - Creator name
- `{{status}}` - Current status
- `{{ticketUrl}}` - Direct link to ticket

## 🚀 Deployment

### Production Build
```bash
# Build the frontend
cd client
npm run build

# Start production server
cd ../server
npm start
```

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=your-production-secret-key
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation in the `/docs` folder

## 🔄 Updates and Maintenance

### Regular Maintenance Tasks
- Database backups
- Email template updates
- Integration health checks
- User permission reviews
- Performance monitoring

### Version Updates
- Check for security updates in dependencies
- Test integrations after updates
- Update documentation
- Notify users of changes

---

**Built with ❤️ for efficient process change management**
