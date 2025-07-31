const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const dbPath = path.join(__dirname, '../aimarker.db');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../')));

// Serve PDF files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
    console.log('Connected to SQLite database');
});

// API Routes

// Get all assignments with pagination
app.get('/api/assignments', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const course = req.query.course;
    const status = req.query.status;
    
    let query = 'SELECT * FROM assignments';
    let params = [];
    let whereConditions = [];
    
    if (course) {
        whereConditions.push('course = ?');
        params.push(course);
    }
    
    if (status) {
        whereConditions.push('status = ?');
        params.push(status);
    }
    
    if (whereConditions.length > 0) {
        query += ' WHERE ' + whereConditions.join(' AND ');
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    db.all(query, params, (err, assignments) => {
        if (err) {
            console.error('Error fetching assignments:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM assignments';
        let countParams = [];
        
        if (whereConditions.length > 0) {
            countQuery += ' WHERE ' + whereConditions.join(' AND ');
            countParams = params.slice(0, -2); // Remove limit and offset
        }
        
        db.get(countQuery, countParams, (err, countResult) => {
            if (err) {
                console.error('Error counting assignments:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            res.json({
                assignments,
                pagination: {
                    page,
                    limit,
                    total: countResult.total,
                    totalPages: Math.ceil(countResult.total / limit)
                }
            });
        });
    });
});

// Get specific assignment by ID
app.get('/api/assignments/:id', (req, res) => {
    const assignmentId = req.params.id;
    
    db.get('SELECT * FROM assignments WHERE id = ?', [assignmentId], (err, assignment) => {
        if (err) {
            console.error('Error fetching assignment:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }
        
        res.json(assignment);
    });
});

// Get assignment by index (for navigation)
app.get('/api/assignments/index/:index', (req, res) => {
    let index = parseInt(req.params.index);
    if (isNaN(index) || index < 0) {
        index = 0;
    }
    
    const query = 'SELECT * FROM assignments ORDER BY created_at DESC LIMIT 1 OFFSET ?';
    
    db.get(query, [index], (err, assignment) => {
        if (err) {
            console.error('Error fetching assignment by index:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }
        
        // Get total count for navigation context
        db.get('SELECT COUNT(*) as total FROM assignments', (err, countResult) => {
            if (err) {
                console.error('Error counting assignments:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            res.json({
                assignment,
                navigation: {
                    currentIndex: index,
                    total: countResult.total,
                    hasNext: index < countResult.total - 1,
                    hasPrevious: index > 0
                }
            });
        });
    });
});

// Get comments for specific assignment
app.get('/api/assignments/:id/comments', (req, res) => {
    const assignmentId = req.params.id;
    const page = req.query.page ? parseInt(req.query.page) : null;
    
    let query = 'SELECT * FROM comments WHERE assignment_id = ?';
    let params = [assignmentId];
    
    if (page !== null) {
        query += ' AND page_number = ?';
        params.push(page);
    }
    
    query += ' ORDER BY created_at ASC';
    
    db.all(query, params, (err, comments) => {
        if (err) {
            console.error('Error fetching comments:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        res.json(comments);
    });
});

// Add comment to assignment
app.post('/api/assignments/:id/comments', (req, res) => {
    const assignmentId = req.params.id;
    const {
        page_number,
        x_position,
        y_position,
        relative_x,
        relative_y,
        comment_text
    } = req.body;
    
    // Validate required fields
    if (!page_number || x_position === undefined || y_position === undefined || 
        relative_x === undefined || relative_y === undefined || !comment_text) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const query = `
        INSERT INTO comments (
            assignment_id, page_number, x_position, y_position,
            relative_x, relative_y, comment_text
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(query, [
        assignmentId, page_number, x_position, y_position,
        relative_x, relative_y, comment_text
    ], function(err) {
        if (err) {
            console.error('Error adding comment:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        // Return the created comment
        db.get('SELECT * FROM comments WHERE id = ?', [this.lastID], (err, comment) => {
            if (err) {
                console.error('Error fetching created comment:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            res.status(201).json(comment);
        });
    });
});

// Update comment
app.put('/api/comments/:id', (req, res) => {
    const commentId = req.params.id;
    const {
        x_position,
        y_position,
        relative_x,
        relative_y,
        comment_text
    } = req.body;
    
    const query = `
        UPDATE comments 
        SET x_position = ?, y_position = ?, relative_x = ?, 
            relative_y = ?, comment_text = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;
    
    db.run(query, [
        x_position, y_position, relative_x, relative_y, comment_text, commentId
    ], function(err) {
        if (err) {
            console.error('Error updating comment:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        
        // Return updated comment
        db.get('SELECT * FROM comments WHERE id = ?', [commentId], (err, comment) => {
            if (err) {
                console.error('Error fetching updated comment:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            res.json(comment);
        });
    });
});

// Delete comment
app.delete('/api/comments/:id', (req, res) => {
    const commentId = req.params.id;
    
    db.run('DELETE FROM comments WHERE id = ?', [commentId], function(err) {
        if (err) {
            console.error('Error deleting comment:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        
        res.json({ message: 'Comment deleted successfully' });
    });
});

// Save highlight data
app.post('/api/assignments/:id/highlights', (req, res) => {
    const assignmentId = req.params.id;
    const {
        page_number,
        search_term,
        similarity_threshold,
        highlight_data
    } = req.body;
    
    const query = `
        INSERT OR REPLACE INTO highlights (
            assignment_id, page_number, search_term, 
            similarity_threshold, highlight_data
        ) VALUES (?, ?, ?, ?, ?)
    `;
    
    db.run(query, [
        assignmentId, page_number, search_term,
        similarity_threshold, JSON.stringify(highlight_data)
    ], function(err) {
        if (err) {
            console.error('Error saving highlights:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        res.json({ message: 'Highlights saved successfully', id: this.lastID });
    });
});

// Get highlights for assignment
app.get('/api/assignments/:id/highlights', (req, res) => {
    const assignmentId = req.params.id;
    
    db.all('SELECT * FROM highlights WHERE assignment_id = ? ORDER BY created_at DESC', 
        [assignmentId], (err, highlights) => {
        if (err) {
            console.error('Error fetching highlights:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        // Parse JSON highlight_data
        const parsedHighlights = highlights.map(h => ({
            ...h,
            highlight_data: JSON.parse(h.highlight_data)
        }));
        
        res.json(parsedHighlights);
    });
});

// Update assignment status/grade
app.put('/api/assignments/:id', (req, res) => {
    const assignmentId = req.params.id;
    const { status, grade } = req.body;
    
    let query = 'UPDATE assignments SET updated_at = CURRENT_TIMESTAMP';
    let params = [];
    
    if (status) {
        query += ', status = ?';
        params.push(status);
    }
    
    if (grade !== undefined) {
        query += ', grade = ?';
        params.push(grade);
    }
    
    query += ' WHERE id = ?';
    params.push(assignmentId);
    
    db.run(query, params, function(err) {
        if (err) {
            console.error('Error updating assignment:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Assignment not found' });
        }
        
        // Return updated assignment
        db.get('SELECT * FROM assignments WHERE id = ?', [assignmentId], (err, assignment) => {
            if (err) {
                console.error('Error fetching updated assignment:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            res.json(assignment);
        });
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 AIMarker server running on http://localhost:${PORT}`);
    console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
    console.log(`📄 Frontend available at http://localhost:${PORT}`);
});