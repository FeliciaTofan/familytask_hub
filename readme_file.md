# 🏠 FamilyTask Hub

**Smart family task management system with gamification elements**

FamilyTask Hub is a web application that helps families organize household tasks, distribute responsibilities fairly, and track completion progress. Built with modern web technologies and designed for ease of use.

## ✨ Features

### 🔐 **User Management**
- Secure registration and authentication
- Password hashing with SHA-256
- Session-based user management

### 👨‍👩‍👧‍👦 **Family Groups**
- Create family groups with unique invite codes
- Join existing families using invite codes
- Multiple families support per user

### 📋 **Task Management**
- **70+ Pre-built Tasks**: Organized by categories (Kitchen, Bathroom, Outdoor, etc.)
- **Custom Tasks**: Create your own tasks with descriptions
- **Difficulty System**: 1-5 star rating system
- **Smart Assignment**: Random distribution based on task difficulty
- **Deadline Tracking**: Automatic deadline calculation and monitoring

### 🎮 **Gamification**
- Task completion statistics for each family member
- Progress tracking (active vs completed tasks)
- Friendly competition between family members

### 🎨 **Modern UI/UX**
- Clean, minimalist design with warm colors
- Responsive design (mobile-friendly)
- Intuitive task management interface
- Real-time updates

## 🛠️ Technology Stack

### **Backend**
- **Python 3.8+** - Core programming language
- **Flask** - Web framework for API and routing
- **PostgreSQL** - Relational database for data persistence
- **psycopg2** - PostgreSQL adapter for Python
- **Flask-CORS** - Cross-origin resource sharing

### **Frontend**
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with flexbox/grid
- **Vanilla JavaScript** - Interactive functionality
- **Fetch API** - Asynchronous HTTP requests

### **Security**
- Password hashing (SHA-256)
- Session management
- SQL injection prevention
- Family-based access control

### **Database Design**
- **Users table**: Authentication and user data
- **Families table**: Family groups with invite codes
- **Family_members table**: Many-to-many relationship
- **Tasks table**: Task data with assignments
- **Task_templates table**: Pre-built task library

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- PostgreSQL 12 or higher
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/FeliciaTofan/familytask_hub.git
cd familytask-hub
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Set up PostgreSQL database**
```sql
CREATE DATABASE familytask_db;
CREATE USER familytask_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE familytask_db TO familytask_user;
```

5. **Run database schema**
```bash
psql -h localhost -U familytask_user -d familytask_db -f database_schema.sql
```

6. **Configure database connection**
Edit `app.py` with your database credentials:
```python
DB_CONFIG = {
    'host': 'localhost',
    'database': 'familytask_db',
    'user': 'familytask_user',
    'password': 'your_password'
}
```

7. **Run the application**
```bash
python app.py
```

8. **Open in browser**
Navigate to `http://localhost:5000`

## 📱 How to Use

### Getting Started
1. **Register** a new account or **Login** with existing credentials
2. **Create a family** or **join existing family** using invite code
3. **Add tasks** from the pre-built library or create custom ones
4. **Assign tasks** to family members or use random assignment
5. **Track progress** and mark tasks as completed

### Family Management
- **Create Family**: Generate unique invite code to share
- **Join Family**: Enter invite code to join existing family
- **View Members**: See all family members and their task statistics

### Task Features
- **Smart Distribution**: Random assignment considers task difficulty
- **Deadline Management**: Automatic calculation of due dates
- **Progress Tracking**: Visual indication of days remaining
- **Completion**: One-click task completion for assigned users

## 🎯 Project Architecture

### **MVC Pattern Implementation**
- **Model**: PostgreSQL database with normalized tables
- **View**: HTML templates with dynamic JavaScript rendering
- **Controller**: Flask routes handling business logic

### **API Design**
RESTful API endpoints for:
- User authentication (`/api/login`, `/api/register`)
- Family management (`/api/families`, `/api/create-family`)
- Task operations (`/api/family/{id}/tasks`)
- Assignment logic (`/api/tasks/{id}/assign`)

### **Security Implementation**
- Server-side session management
- Access control based on family membership
- Input validation and sanitization
- Protected routes with authentication decorators

### **Database Optimization**
- Indexed foreign keys for performance
- Normalized schema to prevent data duplication
- Efficient queries with JOINs for related data

## 📊 Key Technical Decisions

### **Why These Technologies?**
- **Flask**: Lightweight, flexible, perfect for prototyping
- **PostgreSQL**: ACID compliance, excellent for relational data
- **Vanilla JS**: No framework overhead, better performance
- **Session-based auth**: Simple, secure for family applications

### **Performance Considerations**
- Database indexing on frequently queried columns
- Minimal HTTP requests with bulk data loading
- Client-side state management to reduce server calls
- Optimized SQL queries with proper JOINs

### **Scalability Features**
- Stateless API design
- Normalized database schema
- Modular code structure
- Environment-based configuration

## 🧪 Demo Data

The application includes **70+ pre-built tasks** across categories:
- **Kitchen**: Wash dishes, cook dinner, clean refrigerator
- **Bathroom**: Clean toilet, mop floor, organize medicine cabinet
- **Living Areas**: Vacuum, dust furniture, clean windows
- **Outdoor**: Mow lawn, water plants, wash car
- **Maintenance**: Replace bulbs, check smoke detectors
- **And many more...**

## 🚀 Deployment

### Environment Variables
```bash
export DB_HOST=your_db_host
export DB_NAME=your_db_name
export DB_USER=your_db_user
export DB_PASSWORD=your_db_password
export SECRET_KEY=your_secret_key
```

### Production Considerations
- Use environment variables for sensitive data
- Enable SSL for database connections
- Implement proper logging
- Set up monitoring and error tracking

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 👥 Authors

- [Felicia Tofan](https://www.linkedin.com/in/felicia-tofan-b7175683/)

## 🙏 Acknowledgments

- Inspired by the need for better family task organization
- Built as a learning project to demonstrate full-stack development skills
- Thanks to the Flask and PostgreSQL communities for excellent documentation

---

**Made with ❤️ for families everywhere**