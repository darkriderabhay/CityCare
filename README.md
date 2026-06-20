# 🏙️ CityCare - Online Civic Issue Reporting and Resolution System

## 📋 Project Overview

**CityCare** is a comprehensive web-based civic issue reporting and resolution system . It enables citizens to report civic problems like potholes, water supply issues, garbage collection, electricity problems, and street light malfunctions directly to concerned government departments.
 
**Category:** Smart Cities / E-Governance  
**Academic Level:** Final Year BBACA  
**Developer:** Abhay Vishwakarma

---

## ✨ Key Features

### For Citizens:
- 📝 **User Registration & Login** - Secure authentication with JWT
- 📢 **Submit Complaints** - Report issues with photos and detailed descriptions
- 📍 **Location Tagging** - Specify exact location of the problem
- 📊 **Real-time Tracking** - Monitor complaint status throughout resolution process
- ✏️ **Edit/Delete** - Modify or remove pending complaints
- 🖨️ **Print Receipts** - Download complaint receipts as PDF
- 💬 **AI Chatbot** - Get instant help and answers 24/7

### For Admins:
- 👥 **View All Complaints** - Comprehensive dashboard with all citizen complaints
- 🏛️ **Department Assignment** - Route complaints to appropriate departments
- 🔄 **Status Management** - Update complaint status (Pending → Assigned → In Progress → Resolved)
- 📈 **Analytics Dashboard** - Visual charts and statistics
- 🔍 **Advanced Filtering** - Filter by status, department, priority
- 🗑️ **Delete Complaints** - Remove invalid or duplicate complaints
- 📊 **Reports & Insights** - Track department performance

### System Features:
- 🔒 **Secure Authentication** - Password hashing with bcrypt, JWT tokens
- 📸 **Image Upload** - Upload photos of civic issues
- 🎨 **Responsive Design** - Works on desktop, tablet, and mobile
- 📱 **Real-time Updates** - Live status tracking
- 🤖 **AI-Powered Chatbot** - Groq AI integration for user assistance
- 📄 **PDF Generation** - Download complaint receipts
- 📊 **Data Visualization** - Charts using Chart.js

---

## 🛠️ Technology Stack

### Frontend:
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with gradients and animations
- **JavaScript (ES6+)** - Vanilla JS for interactivity
- **Chart.js** - Data visualization
- **html2pdf.js** - PDF generation

### Backend:
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **Multer** - File upload handling
- **MySQL2** - Database driver

### Database:
- **MySQL 8.0** - Relational database

### AI Integration:
- **Groq API** - AI chatbot using Llama 3.3 model

### Tools:
- **Git & GitHub** - Version control
- **VS Code** - IDE
- **Nodemon** - Development server


---

## 📁 Project Structure
```
CityCare/
│
├── backend/
│   ├── config/
│   │   └── db.js                    # Database connection
│   ├── controllers/
│   │   ├── authController.js        # Authentication logic
│   │   └── complaintController.js   # Complaint management
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT verification
│   │   └── uploadMiddleware.js      # File upload handling
│   ├── routes/
│   │   ├── authRoutes.js            # Auth endpoints
│   │   └── complaintRoutes.js       # Complaint endpoints
│   └── server.js                    # Main server file
│
├── frontend/
│   ├── css/
│   │   └── style.css                # Global styles
│   ├── js/
│   │   ├── home.js                  # Homepage logic
│   │   ├── login.js                 # Login functionality
│   │   ├── register.js              # Registration logic
│   │   ├── dashboard.js             # Citizen dashboard
│   │   ├── submit-complaint.js      # Complaint submission
│   │   ├── edit-complaint.js        # Edit complaint
│   │   ├── admin-dashboard.js       # Admin panel
│   │   └── chatbot.js               # AI chatbot
│   ├── uploads/                     # Uploaded images (gitignored)
│   ├── index.html                   # Landing page
│   ├── login.html                   # Login page
│   ├── register.html                # Registration page
│   ├── dashboard.html               # Citizen dashboard
│   ├── submit-complaint.html        # Complaint form
│   ├── edit-complaint.html          # Edit complaint page
│   └── admin-dashboard.html         # Admin panel
│
├── database/
│   └── citycare_db.sql              # Database schema
│
├── .env                             # Environment variables (gitignored)
├── .gitignore                       # Git ignore rules
├── package.json                     # Dependencies
├── package-lock.json                # Dependency tree
└── README.md                        # Documentation
```

---

## 🚀 Installation & Setup

### Prerequisites:
- Node.js (v20.x or higher) - [Download](https://nodejs.org/)
- MySQL (v8.0 or higher) - [Download](https://dev.mysql.com/downloads/)
- Git - [Download](https://git-scm.com/)

### Step 1: Clone Repository
```bash
git clone https://github.com/darkriderabhay/CityCare.git
cd CityCare
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Database
1. Open **MySQL Command Line Client**
2. Login with your password
3. Run the database script:
```sql
SOURCE /path/to/CityCare/database/citycare_db.sql
```

### Step 4: Configure Environment Variables
Create a `.env` file in the root directory:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=citycare_db

# JWT Configuration
JWT_SECRET=citycare_secret_key_of_project
JWT_EXPIRE=7d

# Groq AI Chatbot (Optional)
GROQ_API_KEY=your_groq_api_key_here
```

### Step 5: Run the Application
```bash
npm run dev
```

Application will run on: `http://localhost:5000`

---

## 📊 Database Schema

### Tables:

**1. users**
- Stores citizen and admin information
- Fields: user_id, full_name, email, password, phone, address, role, created_at

**2. departments**
- Government departments handling civic issues
- Fields: dept_id, dept_name, dept_email, dept_phone, created_at

**3. complaints**
- All civic complaints submitted by citizens
- Fields: complaint_id, user_id, dept_id, title, description, location, image_path, status, priority, created_at, updated_at

**4. complaint_status_logs**
- Tracks all status changes for complaints
- Fields: log_id, complaint_id, old_status, new_status, remarks, changed_by, changed_at

---


## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)

### Complaints
- `POST /api/complaints/submit` - Submit new complaint (protected)
- `GET /api/complaints` - Get all complaints (protected, role-based)
- `GET /api/complaints/:id` - Get complaint by ID (protected)
- `PUT /api/complaints/:id` - Update complaint (protected)
- `DELETE /api/complaints/:id` - Delete complaint (protected)
- `PUT /api/complaints/:id/status` - Update status (admin only)
- `PUT /api/complaints/:id/assign` - Assign to department (admin only)

### Departments
- `GET /api/departments` - Get all departments

### Chatbot
- `POST /api/chatbot` - AI chatbot interaction

---

## 🎨 Features Walkthrough

### 1. User Registration & Login
- Secure password hashing with bcrypt (10 salt rounds)
- JWT token generation for authentication
- Role-based access (citizen/admin)

### 2. Complaint Submission
- Upload images (max 5MB, formats: JPG, PNG, GIF)
- Select department and priority level
- Real-time validation

### 3. Dashboard
- View personal complaints (citizens)
- View all complaints (admins)
- Statistics cards showing counts
- Filter and search functionality

### 4. Status Tracking
- Pending → Assigned → In Progress → Resolved/Rejected
- Status logs maintain complete history
- Email notifications on status change (optional)

### 5. Admin Features
- Visual analytics with charts
- Department-wise complaint distribution
- Status-wise filtering
- Bulk actions

---


## 🔮 Future Enhancements

- 📧 Email notifications using Nodemailer
- 📱 Progressive Web App (PWA)
- 🗺️ Google Maps integration for location
- 📞 SMS alerts via Twilio
- 🌐 Multi-language support (Hindi, English)
- 📊 Advanced analytics and reporting
- 🔔 Push notifications
- 🎨 Dark mode
- 📈 Citizen engagement metrics

---

## 🐛 Known Issues

- None reported yet

---

## 🤝 Contributing

This is an academic project developed by Abhay Vishwakarma. Contributions, suggestions, and feedback are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is developed for academic purposes.

---

## 👨‍💻 Developer

**Abhay Vishwakarma**  
Final Year BBACA Student  

- GitHub: [@darkriderabhay](https://github.com/darkriderabhay)
- Email: vishwakarmaabhay640@gmail.com

---

## 🙏 Acknowledgments

- College faculty and mentors
- Open-source community
- Chart.js, Groq AI, and other libraries used

---

## 📞 Support

For queries or support, please contact:
- Email: vishwakarmaabhay640@gmail.com

---


**Made with ❤️ for Smart Cities Initiative**
