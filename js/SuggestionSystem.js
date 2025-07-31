class SuggestionSystem {
    constructor() {
        this.suggestions = this.initializeSuggestions();
        this.dropdown = null;
        this.selectedIndex = -1;
        this.currentInlineSuggestion = '';
        this.suggestionOverlay = null;
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
    
    showDropdown(input) {
        const query = input.value.toLowerCase().trim();
        if (query.length < 2) {
            this.hideDropdown();
            return;
        }
        
        const matchingSuggestions = this.suggestions.filter(suggestion => 
            suggestion.text.toLowerCase().includes(query) ||
            suggestion.category.toLowerCase().includes(query)
        ).slice(0, 6);
        
        if (matchingSuggestions.length === 0) {
            this.hideDropdown();
            return;
        }
        
        this.hideDropdown();
        
        this.dropdown = document.createElement('div');
        this.dropdown.className = 'suggestion-dropdown';
        
        this.dropdown.style.left = input.offsetLeft + 'px';
        this.dropdown.style.top = (input.offsetTop + input.offsetHeight + 2) + 'px';
        
        matchingSuggestions.forEach((suggestion, index) => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.innerHTML = `
                <div class="suggestion-text">${suggestion.text}</div>
                <div class="suggestion-category">${suggestion.category}</div>
            `;
            
            item.addEventListener('click', () => {
                input.value = suggestion.text;
                this.hideDropdown();
                input.focus();
            });
            
            this.dropdown.appendChild(item);
        });
        
        input.parentElement.appendChild(this.dropdown);
        this.selectedIndex = -1;
    }
    
    hideDropdown() {
        if (this.dropdown) {
            this.dropdown.remove();
            this.dropdown = null;
        }
        this.selectedIndex = -1;
    }
    
    navigateDropdown(direction) {
        if (!this.dropdown) return false;
        
        const items = this.dropdown.querySelectorAll('.suggestion-item');
        if (items.length === 0) return false;
        
        if (this.selectedIndex >= 0) {
            items[this.selectedIndex].classList.remove('selected');
        }
        
        this.selectedIndex += direction;
        
        if (this.selectedIndex < 0) {
            this.selectedIndex = items.length - 1;
        } else if (this.selectedIndex >= items.length) {
            this.selectedIndex = 0;
        }
        
        items[this.selectedIndex].classList.add('selected');
        items[this.selectedIndex].scrollIntoView({ block: 'nearest' });
        return true;
    }
    
    selectFromDropdown(input) {
        if (!this.dropdown || this.selectedIndex < 0) return false;
        
        const items = this.dropdown.querySelectorAll('.suggestion-item');
        const selectedItem = items[this.selectedIndex];
        const suggestionText = selectedItem.querySelector('.suggestion-text').textContent;
        
        input.value = suggestionText;
        this.hideDropdown();
        input.focus();
        return true;
    }
    
    updateInlineSuggestion(input, overlay) {
        this.suggestionOverlay = overlay;
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
            overlay.textContent = query + completionText;
        } else {
            this.clearInlineSuggestion();
        }
    }
    
    acceptInlineSuggestion(input) {
        if (this.currentInlineSuggestion && input) {
            input.value = this.currentInlineSuggestion;
            this.clearInlineSuggestion();
            this.hideDropdown();
            return true;
        }
        return false;
    }
    
    clearInlineSuggestion() {
        this.currentInlineSuggestion = '';
        if (this.suggestionOverlay) {
            this.suggestionOverlay.textContent = '';
        }
    }
    
    hasInlineSuggestion() {
        return !!this.currentInlineSuggestion;
    }
    
    hasDropdown() {
        return !!this.dropdown && this.dropdown.style.display !== 'none';
    }
    
    getSelectedIndex() {
        return this.selectedIndex;
    }
}