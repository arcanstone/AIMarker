# AIMarker - PDF Text Highlighter

A web application for uploading PDFs, highlighting similar text based on search queries, and adding interactive comments with smart suggestions.

## Features

- **PDF Upload & Viewing**: Upload and navigate through PDF documents
- **Text Similarity Highlighting**: Highlight text similar to your search query using cosine similarity
- **Interactive Comments**: Click anywhere on the PDF to add transparent, draggable comments
- **Smart Suggestions**: AI-powered text suggestions with dropdown and inline completion
- **Zoom Controls**: Zoom in/out while maintaining comment positioning
- **Responsive Design**: Clean, modern interface with sidebar controls

## Project Structure

```
highlight/
├── index.html              # Main HTML file
├── README.md              # This file
├── css/                   # Stylesheets
│   ├── base.css          # Base layout and PDF viewer styles
│   ├── sidebar.css       # Sidebar and controls styling
│   ├── highlighting.css  # Text highlighting and tooltip styles
│   ├── comments.css      # Comment system styling
│   └── suggestions.css   # Suggestion dropdown styling
└── js/                   # JavaScript modules
    ├── PDFHandler.js     # PDF loading, rendering, and navigation
    ├── TextHighlighter.js # Text similarity and highlighting logic
    ├── CommentSystem.js  # Comment creation, editing, and management
    ├── SuggestionSystem.js # Text suggestions and autocomplete
    └── PDFHighlighterApp.js # Main application controller
```

## Architecture

### Modular Design
The application follows a modular architecture with clear separation of concerns:

- **PDFHandler**: Manages PDF document loading, rendering, and navigation
- **TextHighlighter**: Handles text similarity analysis and highlighting
- **CommentSystem**: Manages comment creation, positioning, and persistence
- **SuggestionSystem**: Provides intelligent text suggestions and autocomplete
- **PDFHighlighterApp**: Main controller that coordinates all modules

### CSS Organization
Styles are organized by feature:

- **base.css**: Core layout, typography, and PDF viewer
- **sidebar.css**: Left sidebar controls and inputs
- **highlighting.css**: Text highlighting and tooltips
- **comments.css**: Comment boxes and input styling
- **suggestions.css**: Suggestion dropdown and inline completion

## Usage

1. **Upload PDF**: Click "Upload PDF" and select a PDF file
2. **Highlight Text**: 
   - Enter search text in the sidebar
   - Adjust similarity threshold (0.1 = loose, 1.0 = exact)
   - Click "Highlight Similar Text"
3. **Add Comments**:
   - Click anywhere on the PDF
   - Type your comment (suggestions will appear)
   - Press Enter to save or Escape to cancel
4. **Use Suggestions**:
   - Type 2+ characters to see dropdown suggestions
   - Use arrow keys to navigate, Enter to select
   - Press Tab to accept inline grey suggestions
5. **Navigate**:
   - Use Previous/Next buttons to change pages
   - Use Zoom In/Out to adjust scale
   - Drag comments to reposition them

## API Access

The main app instance is available globally:

```javascript
// Access the app
const app = window.pdfHighlighterApp;

// Export comments as JSON
const comments = app.exportComments();

// Import comments from JSON
app.importComments(jsonString);

// Get highlight statistics
const stats = app.getHighlightStatistics();

// Get PDF information
const pdfInfo = app.getPDFInfo();
```

## Dependencies

- **PDF.js**: Mozilla's JavaScript PDF renderer
- **Modern Browser**: Supports ES6 classes, async/await, and modern CSS

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## Technical Features

### Text Similarity Algorithm
Uses cosine similarity to compare text vectors:
- Converts text to word frequency vectors
- Calculates dot product and magnitudes
- Returns similarity score (0-1)

### Comment Positioning System
- Stores both absolute and relative coordinates
- Automatically scales comments with zoom level
- Maintains position accuracy across page changes

### Suggestion System
- 25+ pre-categorized suggestions
- Smart matching by text and category
- Dual-mode: dropdown selection and inline completion
- Tab completion for inline suggestions

### Performance Optimizations
- Modular loading for better code organization
- Event delegation for dynamic elements
- Efficient DOM manipulation
- CSS-based animations for smooth interactions

## Development

To extend the application:

1. **Add new CSS**: Create new files in `css/` directory
2. **Add new modules**: Create new classes in `js/` directory
3. **Update main controller**: Modify `PDFHighlighterApp.js` to integrate new features
4. **Update HTML**: Add new elements and script tags as needed

## License

MIT License - feel free to use and modify for your projects.