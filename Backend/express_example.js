// Express.js Example Route (for reference)
// Note: This project uses FastAPI (Python), but here's the Express equivalent

const express = require('express');
const router = express.Router();

// Middleware to parse JSON
router.use(express.json());

// Business profile creation route
router.post('/api/business', async (req, res) => {
  try {
    const { name, type, location, description } = req.body;
    
    // Validation
    if (!name || !type || !location || !description) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }
    
    if (description.length < 20) {
      return res.status(400).json({
        success: false,
        error: 'Description must be at least 20 characters'
      });
    }
    
    // Create business profile (example with MongoDB/Mongoose)
    const newBusiness = new Business({
      name,
      type,
      location,
      description,
      userId: req.user.id, // from auth middleware
      createdAt: new Date()
    });
    
    await newBusiness.save();
    
    // Return success response
    res.status(201).json({
      success: true,
      data: newBusiness,
      message: 'Business profile created successfully'
    });
    
  } catch (error) {
    console.error('Error creating business profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create business profile'
    });
  }
});

// Get business profile
router.get('/api/business/:id', async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    
    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business profile not found'
      });
    }
    
    res.json({
      success: true,
      data: business
    });
    
  } catch (error) {
    console.error('Error fetching business profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch business profile'
    });
  }
});

module.exports = router;

// Usage in main app:
// const businessRoutes = require('./routes/business');
// app.use(businessRoutes);