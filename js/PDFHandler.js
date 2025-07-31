class PDFHandler {
    constructor() {
        this.pdfDoc = null;
        this.currentPage = 1;
        this.totalPages = 0;
        this.scale = 1.2;
        this.extractedText = [];
        this.textItems = [];
        
        this.setupPDFJS();
    }
    
    setupPDFJS() {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    
    async handleFileUpload(file) {
        if (!file || file.type !== 'application/pdf') {
            throw new Error('Please select a valid PDF file.');
        }
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            this.pdfDoc = await pdfjsLib.getDocument(arrayBuffer).promise;
            this.totalPages = this.pdfDoc.numPages;
            this.currentPage = 1;
            
            await this.extractAllText();
            return {
                success: true,
                totalPages: this.totalPages,
                currentPage: this.currentPage
            };
        } catch (error) {
            console.error('Error loading PDF:', error);
            throw new Error('Error loading PDF file.');
        }
    }
    
    async extractAllText() {
        this.extractedText = [];
        this.textItems = [];
        
        for (let pageNum = 1; pageNum <= this.totalPages; pageNum++) {
            const page = await this.pdfDoc.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            const pageText = textContent.items.map(item => item.str).join(' ');
            this.extractedText.push(pageText);
            this.textItems.push(textContent.items);
        }
    }
    
    async renderPage(pageNumber, container) {
        if (!this.pdfDoc || pageNumber < 1 || pageNumber > this.totalPages) {
            throw new Error('Invalid page number or no PDF loaded');
        }
        
        this.currentPage = pageNumber;
        const page = await this.pdfDoc.getPage(this.currentPage);
        const viewport = page.getViewport({ scale: this.scale });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        
        container.innerHTML = '';
        
        const pageContainer = document.createElement('div');
        pageContainer.className = 'pdf-page';
        pageContainer.style.position = 'relative';
        pageContainer.appendChild(canvas);
        
        const textLayer = document.createElement('div');
        textLayer.className = 'text-layer';
        textLayer.style.width = viewport.width + 'px';
        textLayer.style.height = viewport.height + 'px';
        pageContainer.appendChild(textLayer);
        
        container.appendChild(pageContainer);
        
        await page.render(renderContext).promise;
        await this.renderTextLayer(page, viewport, textLayer);
        
        return pageContainer;
    }
    
    async renderTextLayer(page, viewport, textLayerDiv) {
        const textContent = await page.getTextContent();
        
        textContent.items.forEach((textItem, index) => {
            const tx = pdfjsLib.Util.transform(
                pdfjsLib.Util.transform(viewport.transform, textItem.transform),
                [1, 0, 0, -1, 0, 0]
            );
            
            const span = document.createElement('span');
            span.textContent = textItem.str;
            span.style.position = 'absolute';
            span.style.left = tx[4] + 'px';
            span.style.top = (tx[5] - Math.abs(tx[3])) + 'px';
            span.style.fontSize = Math.abs(tx[3]) + 'px';
            span.style.fontFamily = textItem.fontName || 'sans-serif';
            span.style.transformOrigin = '0% 100%';
            span.dataset.textIndex = index;
            span.dataset.text = textItem.str;
            
            textLayerDiv.appendChild(span);
        });
    }
    
    changePage(delta) {
        const newPage = this.currentPage + delta;
        if (newPage >= 1 && newPage <= this.totalPages) {
            this.currentPage = newPage;
            return true;
        }
        return false;
    }
    
    changeZoom(delta) {
        const newScale = this.scale + delta;
        if (newScale >= 0.5 && newScale <= 3.0) {
            this.scale = newScale;
            return true;
        }
        return false;
    }
    
    getPageText(pageNumber = this.currentPage) {
        const pageIndex = pageNumber - 1;
        return this.extractedText[pageIndex] || '';
    }
    
    getCurrentPage() {
        return this.currentPage;
    }
    
    getTotalPages() {
        return this.totalPages;
    }
    
    getScale() {
        return this.scale;
    }
}