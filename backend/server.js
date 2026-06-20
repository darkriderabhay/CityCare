// Import required packages
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import database connection
const db = require('./config/db');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const path = require('path');

// Serve static files (for frontend)
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../frontend/uploads')));

// Serve index.html at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Serve index.html at root
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: './frontend' });
});

// Test Route
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'CityCare API is working!',
        timestamp: new Date()
    });
});

// Test Database Route
app.get('/api/test-db', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT COUNT(*) as total FROM users');
        res.json({
            success: true,
            message: 'Database connection successful!',
            totalUsers: rows[0].total
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Database connection failed',
            error: error.message
        });
    }
});

// Import Routes
const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);

// Get all departments
app.get('/api/departments', async (req, res) => {
    try {
        const [departments] = await db.query('SELECT * FROM departments ORDER BY dept_name');
        res.json({
            success: true,
            data: departments
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching departments',
            error: error.message
        });
    }
});

// Chatbot endpoint - Groq AI
app.post('/api/chatbot', async (req, res) => {
    try {
        const { message } = req.body;
        
        console.log('📩 Chatbot request:', message);
        console.log('🔑 API Key exists:', !!process.env.GROQ_API_KEY);
        
        // If no API key, use simple fallback
        if (!process.env.GROQ_API_KEY) {
            console.log('⚠️ No API key found, using fallback');
            return simpleRuleBasedChat(message, res);
        }

        const groqRequest = {
            model: 'llama-3.3-70b-versatile',
            messages: [{
                role: 'system',
                content: `You are CityCare Assistant, a friendly and helpful AI chatbot for a civic complaint reporting system called CityCare.

About CityCare:
- Citizens can report civic issues: potholes, water supply problems, garbage collection, electricity issues, broken street lights, and park maintenance
- Available departments: Roads & Transport, Water Supply, Electricity, Sanitation, Street Lights, Parks & Gardens
- Features: User registration, complaint submission with photo upload, real-time status tracking, edit/delete pending complaints, print receipts, analytics dashboard
- Citizens can track their complaints through status stages: Pending → Assigned → In Progress → Resolved/Rejected
- Admins can view all complaints, assign to departments, update status, and view analytics

Your personality:
- Friendly and conversational
- Helpful and patient
- Concise but informative (2-4 sentences per response)
- Use emojis occasionally to be friendly 😊

Answer questions about CityCare naturally. If asked about features, explain them clearly. If the user greets you or makes small talk, respond warmly before offering help with CityCare.`
            }, {
                role: 'user',
                content: message
            }],
            temperature: 0.8,
            max_tokens: 250,
            top_p: 0.9
        };

        console.log('🚀 Calling Groq API...');
        
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: JSON.stringify(groqRequest)
        });

        const data = await response.json();
        console.log('📊 Groq API status:', response.status);

        if (response.ok && data.choices && data.choices[0]) {
            const reply = data.choices[0].message.content;
            console.log('✅ AI Response received');
            res.json({ success: true, reply });
        } else {
            console.error('❌ Groq API error:', data.error || data);
            
            // If API fails, use fallback
            console.log('🔄 Falling back to rule-based chat');
            simpleRuleBasedChat(message, res);
        }
    } catch (error) {
        console.error('❌ Chatbot error:', error.message);
        
        // Fallback to rule-based
        simpleRuleBasedChat(req.body.message, res);
    }
});

// Fallback: Simple Rule-Based Chatbot
function simpleRuleBasedChat(message, res) {
    const lowerMessage = message.toLowerCase().trim();
    let reply = '';
    
    // Greetings
    if (lowerMessage.match(/^(hi|hello|hey|good morning|good evening|namaste)/)) {
        reply = "Hello! 👋 I'm CityCare Assistant. I can help you with complaint submission, tracking, departments, and features. What would you like to know?";
    }
    // How are you
    else if (lowerMessage.includes('how are you')) {
        reply = "I'm doing great, thank you for asking! 😊 I'm here to help you with CityCare. Do you have any questions about submitting or tracking civic complaints?";
    }
    // Submit complaint
    else if (lowerMessage.includes('submit') || lowerMessage.includes('file complaint') || lowerMessage.includes('report')) {
        reply = "To submit a complaint:\n1. Register/Login to CityCare\n2. Click 'Submit Complaint'\n3. Fill in title, description, location\n4. Upload a photo (optional)\n5. Select department and priority\n6. Click Submit!\n\nYou'll receive a complaint ID to track your issue.";
    }
    // Departments
    else if (lowerMessage.includes('department')) {
        reply = "We have 6 departments:\n🛣️ Roads & Transport\n💧 Water Supply\n⚡ Electricity\n🗑️ Sanitation\n💡 Street Lights\n🌳 Parks & Gardens\n\nSelect the appropriate one when submitting your complaint.";
    }
    // Track complaint
    else if (lowerMessage.includes('track') || lowerMessage.includes('status')) {
        reply = "To track your complaint:\n1. Login to your account\n2. Go to Dashboard\n3. View all your complaints with current status\n\nStatus types: Pending → Assigned → In Progress → Resolved/Rejected";
    }
    // Register
    else if (lowerMessage.includes('register') || lowerMessage.includes('sign up')) {
        reply = "To register:\n1. Click 'Register' on homepage\n2. Enter name, email, password\n3. Add phone and address (optional)\n4. Click 'Register'\n\nYou'll be redirected to your dashboard immediately!";
    }
    // Login
    else if (lowerMessage.includes('login')) {
        reply = "To login:\n1. Click 'Login' on homepage\n2. Enter email and password\n3. Click 'Login'\n\nDemo accounts:\n👤 Citizen: abhay.v@example.com / mypass123\n🔐 Admin: admin@citycare.com / mypass123";
    }
    // Features
    else if (lowerMessage.includes('feature')) {
        reply = "CityCare Features:\n✅ Submit complaints with photos\n✅ Real-time status tracking\n✅ Edit/Delete pending complaints\n✅ Print complaint receipts\n✅ Admin analytics dashboard\n✅ Department-wise filtering\n✅ AI Chatbot (that's me! 😊)";
    }
    // Print
    else if (lowerMessage.includes('print') || lowerMessage.includes('receipt')) {
        reply = "To print complaint receipt:\n1. Go to Dashboard\n2. Click 'Print/Download' button\n3. Formatted receipt opens\n4. Click 'Print Receipt' or 'Download PDF'\n\nReceipt includes all complaint details!";
    }
    // Thank you
    else if (lowerMessage.includes('thank')) {
        reply = "You're welcome! 😊 Happy to help. Feel free to ask if you have more questions!";
    }
    // Bye
    else if (lowerMessage.match(/^(bye|goodbye|see you)/)) {
        reply = "Goodbye! 👋 Have a great day! Come back if you need help with CityCare!";
    }
    // Default
    else {
        reply = "I can help you with:\n• How to submit/track complaints\n• Available departments\n• Registration and login\n• CityCare features\n• Printing receipts\n\nWhat would you like to know?";
    }
    
    res.json({ success: true, reply });
}

// Fallback: Simple Rule-Based Chatbot
function simpleRuleBasedChat(message, res) {
    const lowerMessage = message.toLowerCase().trim();
    let reply = '';
    
    if (lowerMessage.match(/^(hi|hello|hey|good morning|good evening|namaste)/)) {
        reply = "Hello! 👋 I'm CityCare Assistant. I can help with complaint submission, tracking, departments, and features. What would you like to know?";
    }
    else if (lowerMessage.includes('submit') || lowerMessage.includes('file complaint') || lowerMessage.includes('report')) {
        reply = "To submit a complaint:\n1. Register/Login to CityCare\n2. Click 'Submit Complaint'\n3. Fill in details and upload photo\n4. Select department and priority\n5. Submit! You'll get a complaint ID.";
    }
    else if (lowerMessage.includes('department')) {
        reply = "Departments:\n🛣️ Roads & Transport\n💧 Water Supply\n⚡ Electricity\n🗑️ Sanitation\n💡 Street Lights\n🌳 Parks & Gardens";
    }
    else if (lowerMessage.includes('track') || lowerMessage.includes('status')) {
        reply = "Track your complaint from Dashboard. Status: Pending → Assigned → In Progress → Resolved/Rejected";
    }
    else if (lowerMessage.includes('register') || lowerMessage.includes('sign up')) {
        reply = "Click 'Register', enter your details, and you're ready to submit complaints!";
    }
    else if (lowerMessage.includes('login')) {
        reply = "Demo accounts:\n👤 Citizen: abhay.v@example.com / mypass123\n🔐 Admin: admin@citycare.com / mypass123";
    }
    else if (lowerMessage.includes('edit') || lowerMessage.includes('delete')) {
        reply = "You can edit/delete complaints that are 'Pending' from your Dashboard.";
    }
    else if (lowerMessage.includes('feature')) {
        reply = "Features: Submit with photos, Real-time tracking, Edit/Delete, Print receipts, Analytics, Filters, AI Chatbot!";
    }
    else if (lowerMessage.includes('print') || lowerMessage.includes('receipt')) {
        reply = "Click 'Print/Download' on any complaint in Dashboard to get a PDF receipt.";
    }
    else if (lowerMessage.includes('thank')) {
        reply = "You're welcome! 😊 Happy to help!";
    }
    else if (lowerMessage.match(/^(bye|goodbye)/)) {
        reply = "Goodbye! 👋 Have a great day!";
    }
    else {
        reply = "I can help with:\n• Submitting/tracking complaints\n• Departments info\n• Registration/login\n• Features\n• Receipts\n\nWhat would you like to know?";
    }
    
    res.json({ success: true, reply });
}

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('=================================');
    console.log('🚀 CityCare Server Started');
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log('=================================');
});