const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../aimarker.db');

console.log('Setting up AIMarker database...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
    console.log('Connected to SQLite database');
});

// Create tables
const createTables = `
-- Assignments table
CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_name TEXT NOT NULL,
    assignment_title TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    due_date DATETIME,
    course TEXT,
    grade REAL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'graded')),
    total_pages INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL,
    page_number INTEGER NOT NULL,
    x_position REAL NOT NULL,
    y_position REAL NOT NULL,
    relative_x REAL NOT NULL,
    relative_y REAL NOT NULL,
    comment_text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES assignments (id) ON DELETE CASCADE
);

-- Highlights table (for storing text highlighting data)
CREATE TABLE IF NOT EXISTS highlights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL,
    page_number INTEGER NOT NULL,
    search_term TEXT NOT NULL,
    similarity_threshold REAL NOT NULL,
    highlight_data TEXT, -- JSON data for highlight positions
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES assignments (id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_course ON assignments(course);
CREATE INDEX IF NOT EXISTS idx_comments_assignment ON comments(assignment_id);
CREATE INDEX IF NOT EXISTS idx_comments_page ON comments(assignment_id, page_number);
CREATE INDEX IF NOT EXISTS idx_highlights_assignment ON highlights(assignment_id);
`;

db.exec(createTables, (err) => {
    if (err) {
        console.error('Error creating tables:', err);
        process.exit(1);
    }
    
    console.log('✅ Database tables created successfully');
    console.log('📊 Tables created:');
    console.log('   - assignments');
    console.log('   - comments'); 
    console.log('   - highlights');
    console.log('');
    console.log('🚀 Database setup complete!');
    console.log('Next steps:');
    console.log('   1. Run "npm run seed" to add sample data');
    console.log('   2. Run "npm start" to start the server');
    
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        }
        process.exit(0);
    });
});