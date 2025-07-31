class PDFHighlighter {
    constructor() {
        this.pdfDoc = null;
        this.currentPage = 1;
        this.totalPages = 0;
        this.scale = 1.2;
        this.extractedText = [];
        this.textItems = [];
        this.tooltip = null;
        this.comments = new Map();
        this.currentInput = null;
        this.suggestionDropdown = null;
        this.selectedSuggestionIndex = -1;
        this.suggestions = this.initializeSuggestions();
        this.currentInlineSuggestion = '';
        this.inputWrapper = null;
        
        this.initializeElements();
        this.bindEvents();
        this.setupPDFJS();
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
    
    setupPDFJS() {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    
    initializeSuggestions() {
        return [
            { text: "This is important", category: "emphasis" },
            { text: "Need to review", category: "action" },
            { text: "Question about this", category: "question" },
            { text: "Great point", category: "positive" },
            { text: "Needs clarification", category: "question" },
            { text: "Follow up required", category: "action" },
            { text: "Key insight", category: "emphasis" },
            { text: "Interesting finding", category: "analysis" },
            { text: "Consider alternatives", category: "suggestion" },
            { text: "Double check this", category: "caution" },
            { text: "Well explained", category: "positive" },
            { text: "Missing information", category: "gap" },
            { text: "Good example", category: "positive" },
            { text: "Unclear reasoning", category: "question" },
            { text: "Strong evidence", category: "analysis" },
            { text: "Potential issue", category: "caution" },
            { text: "Helpful context", category: "reference" },
            { text: "Main takeaway", category: "emphasis" },
            { text: "Verify source", category: "action" },
            { text: "Worth noting", category: "reference" },
            { text: "Contradicts earlier point", category: "analysis" },
            { text: "Excellent analysis", category: "positive" },
            { text: "Needs more detail", category: "gap" },
            { text: "Critical section", category: "emphasis" },
            { text: "Bookmark for later", category: "reference" }
        ];
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
    
    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file || file.type !== 'application/pdf') {
            alert('Please select a valid PDF file.');
            return;
        }
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            this.pdfDoc = await pdfjsLib.getDocument(arrayBuffer).promise;
            this.totalPages = this.pdfDoc.numPages;
            this.currentPage = 1;
            
            await this.extractAllText();
            await this.renderCurrentPage();
            this.updatePageInfo();
        } catch (error) {
            console.error('Error loading PDF:', error);
            alert('Error loading PDF file.');
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
    
    async renderCurrentPage() {
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
        
        this.pdfContainer.innerHTML = '';
        
        const pageContainer = document.createElement('div');
        pageContainer.className = 'pdf-page';
        pageContainer.style.position = 'relative';
        pageContainer.appendChild(canvas);
        
        const textLayer = document.createElement('div');
        textLayer.className = 'text-layer';
        textLayer.style.width = viewport.width + 'px';
        textLayer.style.height = viewport.height + 'px';
        pageContainer.appendChild(textLayer);
        
        this.pdfContainer.appendChild(pageContainer);
        
        await page.render(renderContext).promise;
        await this.renderTextLayer(page, viewport, textLayer);
        
        this.addCommentClickHandler(pageContainer);
        this.renderCommentsForPage();
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
    
    calculateSimilarity(text1, text2) {
        const words1 = text1.toLowerCase().split(/\s+/).filter(word => word.length > 2);
        const words2 = text2.toLowerCase().split(/\s+/).filter(word => word.length > 2);
        
        if (words1.length === 0 || words2.length === 0) return 0;
        
        const set1 = new Set(words1);
        const set2 = new Set(words2);
        
        const intersection = new Set([...set1].filter(word => set2.has(word)));
        const union = new Set([...set1, ...set2]);
        
        return intersection.size / union.size;
    }
    
    calculateCosineSimilarity(text1, text2) {
        const words1 = text1.toLowerCase().match(/\b\w+\b/g) || [];
        const words2 = text2.toLowerCase().match(/\b\w+\b/g) || [];
        
        const allWords = [...new Set([...words1, ...words2])];
        
        const vector1 = allWords.map(word => words1.filter(w => w === word).length);
        const vector2 = allWords.map(word => words2.filter(w => w === word).length);
        
        const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
        const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
        const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));
        
        if (magnitude1 === 0 || magnitude2 === 0) return 0;
        
        return dotProduct / (magnitude1 * magnitude2);
    }
    
    highlightSimilarText() {
        const searchTerm = this.searchText.value.trim();
        const threshold = parseFloat(this.thresholdSlider.value);
        
        if (!searchTerm || !this.pdfDoc) {
            alert('Please enter search text and upload a PDF.');
            return;
        }
        
        this.clearHighlights();
        
        const textLayer = document.querySelector('.text-layer');
        if (!textLayer) return;
        
        const spans = textLayer.querySelectorAll('span');
        const currentPageIndex = this.currentPage - 1;
        
        spans.forEach(span => {
            const spanText = span.textContent;
            const similarity = this.calculateCosineSimilarity(searchTerm, spanText);
            
            if (similarity >= threshold) {
                span.classList.add('highlight');
                span.style.backgroundColor = `rgba(255, 255, 0, ${0.3 + similarity * 0.4})`;
                span.dataset.similarity = similarity.toFixed(3);
                this.addTooltipListeners(span);
            }
        });
        
        const pageText = this.extractedText[currentPageIndex] || '';
        const sentences = pageText.split(/[.!?]+/).filter(s => s.trim().length > 10);
        
        sentences.forEach(sentence => {
            const similarity = this.calculateCosineSimilarity(searchTerm, sentence);
            if (similarity >= threshold) {
                console.log(`Found similar sentence (${similarity.toFixed(2)}): ${sentence.trim()}`);
            }
        });
    }
    
    clearHighlights() {
        const highlights = document.querySelectorAll('.highlight');
        highlights.forEach(highlight => {
            highlight.classList.remove('highlight');
            highlight.style.backgroundColor = '';
        });
    }
    
    changePage(delta) {
        const newPage = this.currentPage + delta;
        if (newPage >= 1 && newPage <= this.totalPages) {
            this.currentPage = newPage;
            this.renderCurrentPage();
            this.updatePageInfo();
        }
    }
    
    changeZoom(delta) {
        const newScale = this.scale + delta;
        if (newScale >= 0.5 && newScale <= 3.0) {
            this.scale = newScale;
            this.renderCurrentPage();
        }
    }
    
    updatePageInfo() {
        this.pageInfo.textContent = `Page ${this.currentPage} of ${this.totalPages}`;
        this.prevBtn.disabled = this.currentPage <= 1;
        this.nextBtn.disabled = this.currentPage >= this.totalPages;
    }
    
    addTooltipListeners(element) {
        element.addEventListener('mouseenter', (e) => this.showTooltip(e));
        element.addEventListener('mouseleave', () => this.hideTooltip());
        element.addEventListener('mousemove', (e) => this.updateTooltipPosition(e));
    }
    
    showTooltip(event) {
        this.hideTooltip();
        
        const element = event.target;
        const similarity = element.dataset.similarity;
        const text = element.textContent;
        
        const randomMessages = [
            "🎯 Found a similarity match!",
            "✨ This text looks related to your search",
            "🔍 Similar content detected",
            "💡 Potential match discovered",
            "🌟 Text similarity found",
            "🎨 Content correlation identified",
            "🚀 Match alert!",
            "🔗 Related text spotted"
        ];
        
        const randomMessage = randomMessages[Math.floor(Math.random() * randomMessages.length)];
        
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'tooltip';
        this.tooltip.innerHTML = `
            <div><strong>${randomMessage}</strong></div>
            <div style="margin-top: 5px; color: #bdc3c7;">
                Similarity: ${(parseFloat(similarity) * 100).toFixed(1)}%
            </div>
            <div style="margin-top: 3px; font-size: 11px; color: #95a5a6;">
                Text: "${text.length > 50 ? text.substring(0, 50) + '...' : text}"
            </div>
        `;
        
        document.body.appendChild(this.tooltip);
        
        this.updateTooltipPosition(event);
        
        setTimeout(() => {
            if (this.tooltip) {
                this.tooltip.classList.add('show');
            }
        }, 10);
    }
    
    updateTooltipPosition(event) {
        if (!this.tooltip) return;
        
        const tooltipRect = this.tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let left = event.pageX - tooltipRect.width / 2;
        let top = event.pageY - tooltipRect.height - 10;
        
        if (left < 10) left = 10;
        if (left + tooltipRect.width > viewportWidth - 10) {
            left = viewportWidth - tooltipRect.width - 10;
        }
        
        if (top < 10) {
            top = event.pageY + 10;
        }
        
        this.tooltip.style.left = left + 'px';
        this.tooltip.style.top = top + 'px';
    }
    
    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.remove();
            this.tooltip = null;
        }
    }
    
    addCommentClickHandler(pageContainer) {
        pageContainer.addEventListener('click', (event) => {
            if (event.target.closest('.comment-box') || event.target.closest('.comment-input')) {
                return;
            }
            
            const rect = pageContainer.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            const canvas = pageContainer.querySelector('canvas');
            const relativeX = x / canvas.width;
            const relativeY = y / canvas.height;
            
            this.createCommentInput(x, y, pageContainer, relativeX, relativeY);
        });
    }
    
    createCommentInput(x, y, container, relativeX, relativeY) {
        if (this.currentInput) {
            this.currentInput.remove();
        }
        if (this.inputWrapper) {
            this.inputWrapper.remove();
        }
        
        this.inputWrapper = document.createElement('div');
        this.inputWrapper.className = 'comment-input-wrapper';
        this.inputWrapper.style.left = x + 'px';
        this.inputWrapper.style.top = y + 'px';
        
        const background = document.createElement('div');
        background.className = 'comment-input-background';
        
        const suggestionOverlay = document.createElement('div');
        suggestionOverlay.className = 'comment-input-suggestion';
        
        const input = document.createElement('textarea');
        input.className = 'comment-input';
        input.placeholder = 'Type your comment and press Enter...';
        
        this.inputWrapper.appendChild(background);
        this.inputWrapper.appendChild(suggestionOverlay);
        this.inputWrapper.appendChild(input);
        
        container.appendChild(this.inputWrapper);
        this.currentInput = input;
        this.suggestionOverlay = suggestionOverlay;
        
        input.focus();
        
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Tab' && this.currentInlineSuggestion) {
                event.preventDefault();
                this.acceptInlineSuggestion();
                return;
            }
            
            if (this.suggestionDropdown && this.suggestionDropdown.style.display !== 'none') {
                if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    this.navigateSuggestions(1);
                    return;
                } else if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    this.navigateSuggestions(-1);
                    return;
                } else if (event.key === 'Enter' && this.selectedSuggestionIndex >= 0) {
                    event.preventDefault();
                    this.selectSuggestion();
                    return;
                }
            }
            
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                this.hideSuggestions();
                this.clearInlineSuggestion();
                this.saveComment(x, y, input.value.trim(), container, relativeX, relativeY);
            } else if (event.key === 'Escape') {
                this.hideSuggestions();
                this.clearInlineSuggestion();
                this.cancelCommentInput();
            }
        });
        
        input.addEventListener('input', () => {
            this.showSuggestions(input);
            this.updateInlineSuggestion(input);
        });
        
        input.addEventListener('blur', () => {
            setTimeout(() => {
                this.hideSuggestions();
                if (input.value.trim()) {
                    this.saveComment(x, y, input.value.trim(), container, relativeX, relativeY);
                } else {
                    this.cancelCommentInput();
                }
            }, 150);
        });
    }
    
    saveComment(x, y, text, container, relativeX, relativeY) {
        if (!text) {
            this.cancelCommentInput();
            return;
        }
        
        const commentId = `comment-${this.currentPage}-${Date.now()}`;
        const commentData = {
            id: commentId,
            page: this.currentPage,
            x: x,
            y: y,
            relativeX: relativeX,
            relativeY: relativeY,
            text: text,
            timestamp: new Date().toISOString()
        };
        
        this.comments.set(commentId, commentData);
        this.createCommentBox(commentData, container);
        this.cancelCommentInput();
    }
    
    createCommentBox(commentData, container) {
        const commentBox = document.createElement('div');
        commentBox.className = 'comment-box';
        commentBox.dataset.commentId = commentData.id;
        
        const canvas = container.querySelector('canvas');
        const scaledX = commentData.relativeX ? commentData.relativeX * canvas.width : commentData.x;
        const scaledY = commentData.relativeY ? commentData.relativeY * canvas.height : commentData.y;
        
        commentBox.style.left = scaledX + 'px';
        commentBox.style.top = scaledY + 'px';
        commentBox.textContent = commentData.text;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'comment-delete';
        deleteBtn.textContent = '×';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            this.deleteComment(commentData.id);
        };
        
        commentBox.appendChild(deleteBtn);
        container.appendChild(commentBox);
        
        this.makeDraggable(commentBox, commentData);
    }
    
    makeDraggable(element, commentData) {
        let isDragging = false;
        let startX, startY;
        
        element.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('comment-delete')) return;
            
            isDragging = true;
            startX = e.clientX - element.offsetLeft;
            startY = e.clientY - element.offsetTop;
            element.style.cursor = 'grabbing';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const newX = e.clientX - startX;
            const newY = e.clientY - startY;
            
            element.style.left = newX + 'px';
            element.style.top = newY + 'px';
            
            const canvas = element.parentElement.querySelector('canvas');
            commentData.x = newX;
            commentData.y = newY;
            commentData.relativeX = newX / canvas.width;
            commentData.relativeY = newY / canvas.height;
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                element.style.cursor = 'move';
            }
        });
    }
    
    cancelCommentInput() {
        if (this.currentInput) {
            this.currentInput.remove();
            this.currentInput = null;
        }
        if (this.inputWrapper) {
            this.inputWrapper.remove();
            this.inputWrapper = null;
        }
        this.clearInlineSuggestion();
    }
    
    deleteComment(commentId) {
        this.comments.delete(commentId);
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (commentElement) {
            commentElement.remove();
        }
    }
    
    renderCommentsForPage() {
        const pageContainer = document.querySelector('.pdf-page');
        if (!pageContainer) return;
        
        for (const [commentId, commentData] of this.comments) {
            if (commentData.page === this.currentPage) {
                this.createCommentBox(commentData, pageContainer);
            }
        }
    }
    
    showSuggestions(input) {
        const query = input.value.toLowerCase().trim();
        if (query.length < 2) {
            this.hideSuggestions();
            return;
        }
        
        const matchingSuggestions = this.suggestions.filter(suggestion => 
            suggestion.text.toLowerCase().includes(query) ||
            suggestion.category.toLowerCase().includes(query)
        ).slice(0, 6);
        
        if (matchingSuggestions.length === 0) {
            this.hideSuggestions();
            return;
        }
        
        this.hideSuggestions();
        
        this.suggestionDropdown = document.createElement('div');
        this.suggestionDropdown.className = 'suggestion-dropdown';
        
        const inputRect = input.getBoundingClientRect();
        this.suggestionDropdown.style.left = input.offsetLeft + 'px';
        this.suggestionDropdown.style.top = (input.offsetTop + input.offsetHeight + 2) + 'px';
        
        matchingSuggestions.forEach((suggestion, index) => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.innerHTML = `
                <div class="suggestion-text">${suggestion.text}</div>
                <div class="suggestion-category">${suggestion.category}</div>
            `;
            
            item.addEventListener('click', () => {
                input.value = suggestion.text;
                this.hideSuggestions();
                input.focus();
            });
            
            this.suggestionDropdown.appendChild(item);
        });
        
        input.parentElement.appendChild(this.suggestionDropdown);
        this.selectedSuggestionIndex = -1;
    }
    
    hideSuggestions() {
        if (this.suggestionDropdown) {
            this.suggestionDropdown.remove();
            this.suggestionDropdown = null;
        }
        this.selectedSuggestionIndex = -1;
    }
    
    navigateSuggestions(direction) {
        if (!this.suggestionDropdown) return;
        
        const items = this.suggestionDropdown.querySelectorAll('.suggestion-item');
        if (items.length === 0) return;
        
        if (this.selectedSuggestionIndex >= 0) {
            items[this.selectedSuggestionIndex].classList.remove('selected');
        }
        
        this.selectedSuggestionIndex += direction;
        
        if (this.selectedSuggestionIndex < 0) {
            this.selectedSuggestionIndex = items.length - 1;
        } else if (this.selectedSuggestionIndex >= items.length) {
            this.selectedSuggestionIndex = 0;
        }
        
        items[this.selectedSuggestionIndex].classList.add('selected');
        items[this.selectedSuggestionIndex].scrollIntoView({ block: 'nearest' });
    }
    
    selectSuggestion() {
        if (!this.suggestionDropdown || this.selectedSuggestionIndex < 0) return;
        
        const items = this.suggestionDropdown.querySelectorAll('.suggestion-item');
        const selectedItem = items[this.selectedSuggestionIndex];
        const suggestionText = selectedItem.querySelector('.suggestion-text').textContent;
        
        if (this.currentInput) {
            this.currentInput.value = suggestionText;
            this.hideSuggestions();
            this.currentInput.focus();
        }
    }
    
    updateInlineSuggestion(input) {
        const query = input.value.toLowerCase().trim();
        if (query.length < 2) {
            this.clearInlineSuggestion();
            return;
        }
        
        const matchingSuggestion = this.suggestions.find(suggestion => 
            suggestion.text.toLowerCase().startsWith(query) && 
            suggestion.text.toLowerCase() !== query
        );
        
        if (matchingSuggestion) {
            this.currentInlineSuggestion = matchingSuggestion.text;
            const completionText = matchingSuggestion.text.substring(query.length);
            this.suggestionOverlay.textContent = query + completionText;
        } else {
            this.clearInlineSuggestion();
        }
    }
    
    acceptInlineSuggestion() {
        if (this.currentInlineSuggestion && this.currentInput) {
            this.currentInput.value = this.currentInlineSuggestion;
            this.clearInlineSuggestion();
            this.hideSuggestions();
        }
    }
    
    clearInlineSuggestion() {
        this.currentInlineSuggestion = '';
        if (this.suggestionOverlay) {
            this.suggestionOverlay.textContent = '';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PDFHighlighter();
});