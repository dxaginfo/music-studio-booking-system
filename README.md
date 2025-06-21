# Music Studio Booking System

A comprehensive web application for managing recording studio bookings, resources, and client relationships.

## Overview

The Music Studio Booking System helps recording studios efficiently manage their operations, including:

- Room and equipment scheduling
- Engineer assignment
- Client self-booking portal
- File management for session recordings
- Financial tracking and reporting
- Dynamic pricing rules

## Features

### For Studio Managers

- **Resource Management:** Track and allocate studios, equipment, and engineers
- **Session Templates:** Create templates for different session types (recording, mixing, mastering)
- **Analytics Dashboard:** View occupancy rates, revenue metrics, and client retention
- **Financial Tools:** Process payments, generate invoices, and track revenue

### For Clients

- **Self-Service Booking:** Browse availability and book sessions online
- **Session Management:** View upcoming and past sessions
- **File Access:** Download and upload session files
- **Communication:** Receive automated reminders and updates

## Technology Stack

- **Frontend:** React.js, TypeScript, Redux Toolkit, Material-UI
- **Backend:** Node.js, Express.js, JWT authentication
- **Database:** PostgreSQL with Prisma ORM
- **Storage:** AWS S3 for session files
- **Notifications:** Email (SendGrid) and SMS (Twilio)
- **DevOps:** Docker, GitHub Actions, AWS deployment

## Getting Started

### Prerequisites

- Node.js (v16+)
- PostgreSQL (v13+)
- Redis
- AWS Account for S3 storage
- Docker (optional for containerization)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/dxaginfo/music-studio-booking-system.git
   cd music-studio-booking-system
   ```

2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. Set up environment variables:
   ```bash
   # Copy the example env file
   cp .env.example .env
   
   # Edit the .env file with your configuration
   ```

4. Initialize the database:
   ```bash
   cd backend
   npx prisma migrate dev
   ```

5. Start the development servers:
   ```bash
   # Start backend server
   cd backend
   npm run dev
   
   # Start frontend server
   cd frontend
   npm start
   ```

## Project Structure

```
music-studio-booking-system/
├── backend/                   # Backend API server
│   ├── prisma/                # Database schema and migrations
│   ├── src/
│   │   ├── controllers/       # API endpoint handlers
│   │   ├── middlewares/       # Express middlewares
│   │   ├── models/            # Data models
│   │   ├── routes/            # API route definitions
│   │   ├── services/          # Business logic
│   │   ├── utils/             # Helper functions
│   │   └── app.js             # Express application setup
│   └── package.json
│
├── frontend/                  # React frontend application
│   ├── public/                # Static files
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── features/          # Feature-specific components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── pages/             # Page components
│   │   ├── services/          # API service integrations
│   │   ├── store/             # Redux store setup
│   │   ├── utils/             # Helper functions
│   │   ├── App.tsx            # Root component
│   │   └── index.tsx          # Entry point
│   └── package.json
│
├── docker/                    # Docker configuration
├── docs/                      # Documentation
└── README.md
```

## API Documentation

The API follows RESTful principles with the following main endpoints:

- `/api/auth` - Authentication endpoints
- `/api/users` - User management
- `/api/studios` - Studio room management
- `/api/equipment` - Equipment management
- `/api/engineers` - Engineer profiles and assignments
- `/api/bookings` - Booking creation and management
- `/api/payments` - Payment processing and tracking
- `/api/files` - File upload and management

For detailed API documentation, please refer to the [API Docs](docs/api.md).

## Deployment

### Using Docker

1. Build the Docker images:
   ```bash
   docker-compose build
   ```

2. Start the containers:
   ```bash
   docker-compose up -d
   ```

### Manual Deployment

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Set up the production database:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

3. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

## Security Considerations

- All API endpoints are protected with JWT authentication
- Role-based access control implemented for different user types
- HTTPS required for all communications
- Data encrypted at rest and in transit
- Regular security audits and dependency updates

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [FullCalendar.js](https://fullcalendar.io/) for the calendar interface
- [Material-UI](https://mui.com/) for the UI components
- [Prisma](https://www.prisma.io/) for the database ORM
- [AWS](https://aws.amazon.com/) for cloud infrastructure