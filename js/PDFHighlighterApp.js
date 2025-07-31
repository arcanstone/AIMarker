class PDFHighlighterApp {
    constructor() {
        this.pdfHandler = new PDFHandler();
        this.suggestionSystem = new SuggestionSystem();
        this.commentSystem = new CommentSystem(this.suggestionSystem);
        this.textHighlighter = new TextHighlighter();
        
        this.initializeElements();
        this.bindEvents();
        this.setupCommentSystem();
    }
    
    initializeElements() {
        this.pdfUpload = document.getElementById('pdf-upload');
        this.pdfContainer = document.getElementById('pdf-container');
        this.searchText = document.getElementById('search-text');
        this.highlightBtn = document.getElementById('highlight-btn');
        this.clearBtn = document.getElementById('clear-btn');
        this.thresholdSlider = document.getElementById('threshold');
        this.thresholdValue = document.getElementById('threshold-value');
        this.prevBtn = document.getElementById('prev-page');
        this.nextBtn = document.getElementById('next-page');
        this.pageInfo = document.getElementById('page-info');
        this.zoomInBtn = document.getElementById('zoom-in');
        this.zoomOutBtn = document.getElementById('zoom-out');
    }
    
    bindEvents() {
        this.pdfUpload.addEventListener('change', (e) => this.handleFileUpload(e));
        this.highlightBtn.addEventListener('click', () => this.highlightSimilarText());
        this.clearBtn.addEventListener('click', () => this.clearHighlights());
        this.thresholdSlider.addEventListener('input', (e) => {
            this.thresholdValue.textContent = e.target.value;
        });
        this.prevBtn.addEventListener('click', () => this.changePage(-1));
        this.nextBtn.addEventListener('click', () => this.changePage(1));
        this.zoomInBtn.addEventListener('click', () => this.changeZoom(0.2));
        this.zoomOutBtn.addEventListener('click', () => this.changeZoom(-0.2));
    }
    
    setupCommentSystem() {
        this.commentSystem.setCurrentPageGetter(() => this.pdfHandler.getCurrentPage());
    }
    
    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            const result = await this.pdfHandler.handleFileUpload(file);
            await this.renderCurrentPage();
            this.updatePageInfo();
        } catch (error) {
            alert(error.message);
        }
    }
    
    async renderCurrentPage() {
        try {
            const pageContainer = await this.pdfHandler.renderPage(
                this.pdfHandler.getCurrentPage(), 
                this.pdfContainer
            );
            
            this.commentSystem.addClickHandler(pageContainer);
            this.commentSystem.renderCommentsForPage(
                this.pdfHandler.getCurrentPage(), 
                this.pdfContainer
            );
        } catch (error) {
            console.error('Error rendering page:', error);
            alert('Error rendering PDF page.');
        }
    }
    
    highlightSimilarText() {
        const searchTerm = this.searchText.value.trim();
        const threshold = parseFloat(this.thresholdSlider.value);
        
        if (!searchTerm) {
            alert('Please enter search text.');
            return;
        }
        
        if (!this.pdfHandler.pdfDoc) {
            alert('Please upload a PDF file first.');
            return;
        }
        
        try {
            const highlights = this.textHighlighter.highlightSimilarText(
                searchTerm, 
                threshold, 
                this.pdfHandler
            );
            
            console.log(`Highlighted ${highlights.length} text elements`);
            
            // Show stats if there are highlights
            if (highlights.length > 0) {
                const stats = this.textHighlighter.getHighlightStats();
                console.log('Highlight statistics:', stats);
            }
        } catch (error) {
            console.error('Error highlighting text:', error);
            alert('Error highlighting text: ' + error.message);
        }
    }
    
    clearHighlights() {
        this.textHighlighter.clearHighlights();
    }
    
    changePage(delta) {
        if (this.pdfHandler.changePage(delta)) {
            this.renderCurrentPage();
            this.updatePageInfo();
        }
    }
    
    changeZoom(delta) {
        if (this.pdfHandler.changeZoom(delta)) {
            this.renderCurrentPage();
        }
    }
    
    updatePageInfo() {
        const currentPage = this.pdfHandler.getCurrentPage();
        const totalPages = this.pdfHandler.getTotalPages();
        
        this.pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        this.prevBtn.disabled = currentPage <= 1;
        this.nextBtn.disabled = currentPage >= totalPages;
    }
    
    // Utility methods for external access
    exportComments() {
        return this.commentSystem.exportComments();
    }
    
    importComments(jsonString) {
        if (this.commentSystem.importComments(jsonString)) {
            this.commentSystem.renderCommentsForPage(
                this.pdfHandler.getCurrentPage(), 
                this.pdfContainer
            );
            return true;
        }
        return false;
    }
    
    getHighlightStatistics() {
        return this.textHighlighter.getHighlightStats();
    }
    
    getCurrentPageComments() {
        return this.commentSystem.getCommentsForPage(this.pdfHandler.getCurrentPage());
    }
    
    getAllComments() {
        return this.commentSystem.getAllComments();
    }
    
    getPDFInfo() {
        return {
            currentPage: this.pdfHandler.getCurrentPage(),
            totalPages: this.pdfHandler.getTotalPages(),
            scale: this.pdfHandler.getScale(),
            hasDocument: !!this.pdfHandler.pdfDoc
        };
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.pdfHighlighterApp = new PDFHighlighterApp();
});