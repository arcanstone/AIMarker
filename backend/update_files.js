const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'aimarker.db');

console.log('Updating database with actual PDF files...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
    console.log('Connected to database');
});

// Update the first few assignments to use the actual PDF files
const updates = [
    {
        id: 1,
        filename: 'Academic History.pdf',
        file_path: 'uploads/Academic History.pdf'
    },
    {
        id: 2,
        filename: 'allan_resume.pdf',
        file_path: 'uploads/allan_resume.pdf'
    }
];

let updateCount = 0;

updates.forEach(update => {
    db.run(
        'UPDATE assignments SET filename = ?, file_path = ? WHERE id = ?',
        [update.filename, update.file_path, update.id],
        function(err) {
            if (err) {
                console.error('Error updating assignment:', err);
            } else {
                console.log(`✅ Updated assignment ${update.id} to use ${update.filename}`);
                updateCount++;
                
                if (updateCount === updates.length) {
                    console.log('\n🎉 Database updated successfully!');
                    console.log('The first 2 assignments now point to your actual PDF files.');
                    db.close();
                }
            }
        }
    );
});