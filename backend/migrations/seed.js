const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs-extra');

const dbPath = path.join(__dirname, '../aimarker.db');

console.log('Seeding AIMarker database with sample data...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
    console.log('Connected to database for seeding');
});

// Sample assignment data
const sampleAssignments = [
    {
        student_name: 'Alice Johnson',
        assignment_title: 'Machine Learning Research Paper',
        filename: 'alice_ml_research.pdf',
        course: 'CS 4750 - Machine Learning',
        due_date: '2024-03-15 23:59:00',
        total_pages: 12
    },
    {
        student_name: 'Bob Chen',
        assignment_title: 'Database Design Project',
        filename: 'bob_database_project.pdf',
        course: 'CS 4640 - Database Systems',
        due_date: '2024-03-10 23:59:00',
        total_pages: 8
    },
    {
        student_name: 'Carol Williams',
        assignment_title: 'Software Engineering Proposal',
        filename: 'carol_se_proposal.pdf',
        course: 'CS 4240 - Software Engineering',
        due_date: '2024-03-20 23:59:00',
        total_pages: 15
    },
    {
        student_name: 'David Martinez',
        assignment_title: 'Computer Networks Analysis',
        filename: 'david_networks.pdf',
        course: 'CS 4760 - Computer Networks',
        due_date: '2024-03-12 23:59:00',
        total_pages: 10
    },
    {
        student_name: 'Emma Davis',
        assignment_title: 'Human-Computer Interaction Study',
        filename: 'emma_hci_study.pdf',
        course: 'CS 4804 - Human-Computer Interaction',
        due_date: '2024-03-18 23:59:00',
        total_pages: 14
    }
];

// Insert sample assignments
const insertAssignment = db.prepare(`
    INSERT INTO assignments (
        student_name, assignment_title, filename, course, 
        due_date, total_pages, file_path, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
`);

let assignmentCount = 0;

sampleAssignments.forEach((assignment, index) => {
    const filePath = `uploads/${assignment.filename}`;
    
    insertAssignment.run([
        assignment.student_name,
        assignment.assignment_title,
        assignment.filename,
        assignment.course,
        assignment.due_date,
        assignment.total_pages,
        filePath
    ], function(err) {
        if (err) {
            console.error('Error inserting assignment:', err);
        } else {
            assignmentCount++;
            console.log(`✅ Added assignment: ${assignment.student_name} - ${assignment.assignment_title}`);
            
            // Add some sample comments for the first few assignments
            if (index < 3) {
                addSampleComments(this.lastID, assignment.student_name);
            }
            
            if (assignmentCount === sampleAssignments.length) {
                finishSeeding();
            }
        }
    });
});

function addSampleComments(assignmentId, studentName) {
    const sampleComments = [
        {
            page_number: 1,
            x_position: 150,
            y_position: 200,
            relative_x: 0.2,
            relative_y: 0.3,
            comment_text: 'Good introduction, but needs more context'
        },
        {
            page_number: 2,
            x_position: 300,
            y_position: 400,
            relative_x: 0.4,
            relative_y: 0.6,
            comment_text: 'Excellent analysis here!'
        },
        {
            page_number: 1,
            x_position: 100,
            y_position: 500,
            relative_x: 0.15,
            relative_y: 0.75,
            comment_text: 'Consider adding more references'
        }
    ];
    
    const insertComment = db.prepare(`
        INSERT INTO comments (
            assignment_id, page_number, x_position, y_position,
            relative_x, relative_y, comment_text
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    sampleComments.forEach(comment => {
        insertComment.run([
            assignmentId,
            comment.page_number,
            comment.x_position,
            comment.y_position,
            comment.relative_x,
            comment.relative_y,
            comment.comment_text
        ], (err) => {
            if (err) {
                console.error('Error inserting comment:', err);
            } else {
                console.log(`   📝 Added comment for ${studentName}`);
            }
        });
    });
    
    insertComment.finalize();
}

function finishSeeding() {
    insertAssignment.finalize();
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '../uploads');
    fs.ensureDirSync(uploadsDir);
    
    console.log('');
    console.log('🎉 Database seeding complete!');
    console.log(`📄 Added ${assignmentCount} sample assignments`);
    console.log('📝 Added sample comments for first 3 assignments');
    console.log('');
    console.log('📁 Note: Place actual PDF files in backend/uploads/ directory');
    console.log('   Expected filenames:');
    sampleAssignments.forEach(a => {
        console.log(`   - ${a.filename}`);
    });
    console.log('');
    console.log('🚀 Ready to start the server with "npm start"');
    
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        }
        process.exit(0);
    });
}