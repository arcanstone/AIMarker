class TextHighlighter {
    constructor() {
        this.tooltip = null;
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
    
    highlightSimilarText(searchTerm, threshold, pdfHandler) {
        if (!searchTerm) {
            throw new Error('Search term is required');
        }
        
        this.clearHighlights();
        
        const textLayer = document.querySelector('.text-layer');
        if (!textLayer) return [];
        
        const spans = textLayer.querySelectorAll('span');
        const highlightedSpans = [];
        
        spans.forEach(span => {
            const spanText = span.textContent;
            const similarity = this.calculateCosineSimilarity(searchTerm, spanText);
            
            if (similarity >= threshold) {
                span.classList.add('highlight');
                span.style.backgroundColor = `rgba(255, 255, 0, ${0.3 + similarity * 0.4})`;
                span.dataset.similarity = similarity.toFixed(3);
                this.addTooltipListeners(span);
                highlightedSpans.push({
                    element: span,
                    text: spanText,
                    similarity: similarity
                });
            }
        });
        
        // Also analyze sentences for debugging
        const pageText = pdfHandler.getPageText();
        const sentences = pageText.split(/[.!?]+/).filter(s => s.trim().length > 10);
        
        sentences.forEach(sentence => {
            const similarity = this.calculateCosineSimilarity(searchTerm, sentence);
            if (similarity >= threshold) {
                console.log(`Found similar sentence (${similarity.toFixed(2)}): ${sentence.trim()}`);
            }
        });
        
        return highlightedSpans;
    }
    
    clearHighlights() {
        const highlights = document.querySelectorAll('.highlight');
        highlights.forEach(highlight => {
            highlight.classList.remove('highlight');
            highlight.style.backgroundColor = '';
            highlight.removeAttribute('data-similarity');
            // Remove existing event listeners by cloning and replacing
            const newElement = highlight.cloneNode(true);
            highlight.parentNode.replaceChild(newElement, highlight);
        });
        this.hideTooltip();
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
    
    getHighlightedElements() {
        return document.querySelectorAll('.highlight');
    }
    
    getHighlightStats() {
        const highlights = this.getHighlightedElements();
        const stats = {
            total: highlights.length,
            similarities: []
        };
        
        highlights.forEach(highlight => {
            const similarity = parseFloat(highlight.dataset.similarity);
            if (!isNaN(similarity)) {
                stats.similarities.push(similarity);
            }
        });
        
        if (stats.similarities.length > 0) {
            stats.averageSimilarity = stats.similarities.reduce((a, b) => a + b, 0) / stats.similarities.length;
            stats.maxSimilarity = Math.max(...stats.similarities);
            stats.minSimilarity = Math.min(...stats.similarities);
        }
        
        return stats;
    }
}