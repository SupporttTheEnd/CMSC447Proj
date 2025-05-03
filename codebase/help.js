export async function main() {
    // Initialize chat in minimized state
    await setupChatAssistant();
    await initializeChat();
}

function setupChatAssistant() {
    const chatIcon = document.getElementById('chat-icon');
    const chatContainer = document.getElementById('chat-container');
    const minimizeButton = document.getElementById('close-chat');

    chatIcon.addEventListener('click', () => {
        chatContainer.classList.add('visible');
        chatIcon.style.display = 'none';
        const chatInput = document.getElementById('chat-input');
        if (chatInput) chatInput.focus();
    });

    // Hide chat when minimize button is clicked
    minimizeButton.addEventListener('click', () => {
        chatContainer.classList.remove('visible');
        chatIcon.style.display = 'flex';
    });
}

// Chat system functionality
async function initializeChat() {
    const chatInput = document.getElementById('chat-input');
    const chatMessage = document.getElementById('chat-message');
    const suggestionButtons = document.querySelectorAll('.suggestion-btn');
    const suggestedQuestions = document.querySelector('.suggested-questions');

    // Store default suggestions for reset
    const defaultSuggestions = [];
    suggestionButtons.forEach(button => {
        defaultSuggestions.push(button.textContent);
    });

    const response = await fetch('database/answer.json');
    const faqData = await response.json();

    // Set up input event for real-time suggestions
    chatInput.addEventListener('input', () => {
        const query = chatInput.value.trim().toLowerCase();
        if (query.length >= 2) {
            // Find matching questions
            const suggestions = findSuggestions(query, faqData);
            displaySuggestions(suggestions, suggestedQuestions, chatInput, faqData, chatMessage, defaultSuggestions);
        } else {
            // Reset to default suggestions
            resetSuggestions(suggestedQuestions, defaultSuggestions, faqData, chatMessage);
        }
    });

    // Reset to default suggestions when input is cleared or unfocused
    chatInput.addEventListener('blur', () => {
        if (chatInput.value.trim() === '') {
            resetSuggestions(suggestedQuestions, defaultSuggestions, faqData, chatMessage);
        }
    });


    // Set up event listeners for chat
    chatInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            const question = chatInput.value.trim();
            if (question && !window.globalVariables.isGeneratingResponse) {
                window.globalVariables.isGeneratingResponse = true;
                await answerQuestion(question, faqData, chatMessage);
                window.globalVariables.isGeneratingResponse = false;
                chatInput.value = '';
                // Reset to default suggestions
                resetSuggestions(suggestedQuestions, defaultSuggestions, faqData, chatMessage);
            }
        }
    });

    // Set up initial suggestion buttons
    setupSuggestionButtons(suggestedQuestions, faqData, chatMessage);
}

// on button click, start answering question on the button result
function setupSuggestionButtons(container, faqData, chatMessage) {
    const buttons = container.querySelectorAll('.suggestion-btn');
    buttons.forEach(button => {
        button.addEventListener('click', async () => {
            const question = button.textContent;
            if (!window.globalVariables.isGeneratingResponse) {
                window.globalVariables.isGeneratingResponse = true;
                await answerQuestion(question, faqData, chatMessage);
                window.globalVariables.isGeneratingResponse = false;
            }
        });
    });
}

function findSuggestions(query, data) {
    const results = [];

    for (const qa of data) {
        if (!qa.question.startsWith("*") && qa.question.toLowerCase().includes(query)) {
            results.push({
                question: qa.question
            });

            // Limit to max 5 suggestions
            if (results.length >= 5) {
                return results;
            }
        }
    }

    return results;
}

function displaySuggestions(suggestions, container, inputElement, faqData, chatMessage, defaultSuggestions) {
    if (!container) return;

    // Clear existing suggestions
    container.innerHTML = '';

    if (suggestions.length > 0) {
        // Add new suggestion buttons
        suggestions.forEach(suggestion => {
            const button = document.createElement('button');
            button.classList.add('suggestion-btn');
            button.textContent = suggestion.question;
            button.addEventListener('click', async () => {
                if (!window.globalVariables.isGeneratingResponse) {
                    window.globalVariables.isGeneratingResponse = true;
                    await answerQuestion(suggestion.question, faqData, chatMessage);
                    window.globalVariables.isGeneratingResponse = false;
                
                    inputElement.value = '';
                }
            });
            container.appendChild(button);
        });
    } else {
        // Add default buttons if no suggestions
        resetSuggestions(container, defaultSuggestions, faqData, chatMessage);
    }
}

function resetSuggestions(container, defaultSuggestions, faqData, chatMessage) {
    container.innerHTML = '';

    defaultSuggestions.forEach(text => {
        const button = document.createElement('button');
        button.classList.add('suggestion-btn');
        button.textContent = text;
        button.addEventListener('click', async () => {
            if (!window.globalVariables.isGeneratingResponse) {
                window.globalVariables.isGeneratingResponse = true;
                await answerQuestion(text, faqData, chatMessage);
                window.globalVariables.isGeneratingResponse = false;
            }
        });
        container.appendChild(button);
    });
}

// Process a user question and find the best matching answer
async function answerQuestion(question, data, chatMessageElement) {
    return new Promise((resolve) => {
        // Show typing animation
        chatMessageElement.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';

        // Find the answer
        let answer = '';
        const normalizedQuestion = question.toLowerCase().trim();

        // Check for exact matches in FAQ
        const exactMatch = findExactMatch(data, normalizedQuestion);
        
        if (exactMatch) {
            answer = exactMatch.answer;
        } else {
            const keywordMatch = findKeywordMatch(data, normalizedQuestion);
            if (keywordMatch) {
                answer = keywordMatch.answer;
            } else {
                // Generate a fallback answer
                const fallbackAnswer = generateFallbackAnswer(normalizedQuestion);
                answer = fallbackAnswer.answer;
            }
        }

        // Type out the answer with a delay
        setTimeout(async () => {
            await typeOutAnswer(answer, chatMessageElement);
            resolve();
        }, 800); // Simulate thinking time
    });
}

// Type out the answer one character at a time
function typeOutAnswer(answer, element) {
    return new Promise((resolve) => {
        element.textContent = '';
        
        // Add class to start mouth animation
        document.querySelector('.mascot-mouth').classList.add('talking');
        
        let i = 0;
        const typingSpeed = 20; // milliseconds per character

        function typeChar() {
            if (i < answer.length) {
                element.textContent += answer.charAt(i);
                i++;
                setTimeout(typeChar, typingSpeed);
            } else {
                // Stop mouth animation when done talking
                setTimeout(() => {
                    document.querySelector('.mascot-mouth').classList.remove('talking');
                    resolve();
                }, 300);
            }
        }

        // Start the typing process
        typeChar();
    });
}

// Find an exact match in the FAQ data
function findExactMatch(faqData, normalizedQuestion) {
    for (const qa of faqData) {
        if (normalizedQuestion === qa.question.toLowerCase().trim().replace(/\*/g, '')) {
            return qa;
        }
    }
    return null;
}

function findKeywordMatch(faqData, normalizedQuestion) {
    const keywords = extractKeywords(normalizedQuestion);
    let bestMatch = null;
    let highestScore = 0.2; 

    // find the entry with the highest score
    for (const qa of faqData) {
        const questionKeywords = extractKeywords(qa.question.toLowerCase());
        const answerKeywords = extractKeywords(qa.answer.toLowerCase());

        // Calculate match score based on keyword overlap
        if (keywords.length === 0) break;

        let matchCount = 0; // Changed to let instead of const
        for(const keyword of keywords){
            if ([...questionKeywords, ...answerKeywords].includes(keyword)) {
                matchCount++;
            }
        }

        const matchScore = matchCount / keywords.length;

        if (matchScore > highestScore) {
            highestScore = matchScore;
            bestMatch = qa;
        }
    }

    return bestMatch;
}

function extractKeywords(text) {
    // Remove common stop words
    const stopWords = new Set([
        'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'with', 'about', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall',
        'should', 'can', 'could', 'may', 'might', 'must', 'i', 'you', 'he',
        'she', 'it', 'we', 'they', 'this', 'that', 'these', 'those', 'what',
        'how', 'why', 'when', 'where', 'who'
    ]);

    return text
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .split(/\s+/)
        .filter(word => word.length > 1 && !stopWords.has(word));
}

function generateFallbackAnswer(question) {
    // Check for specific topics we might be able to handle
    if (question.includes('credit')) {
        return {
            answer: "Credits are an important part of your academic journey. UMBC requires at least 120 credits to graduate. You need to maintain 12-19.5 credits in fall and spring semesters for full-time status. For more specific information, check your credit distribution in the charts below."
        };
    }

    if (question.includes('major') || question.includes('minor')) {
        return {
            answer: "Your major and minor selections determine the courses required for your degree. You can select multiple majors and minors from the Plan Builder tab. Remember that each combination creates a unique academic path."
        };
    }

    if (question.includes('warning')) {
        return {
            answer: "Warnings appear when there are issues with your schedule, like missing prerequisites or having courses in semesters when they're not typically offered. You can view all warnings by clicking the 'Show Warnings' button in your schedule."
        };
    }

    if (question.includes('javascript')) {
        return {
            answer: "A decent language that has been really overused; this website is a big blob of Javascript."
        };
    }

    if (question.includes('andrew') || question.includes('william') || question.includes('bryn') || question.includes('emma')) {
        return {
            answer: "Hello Creator"
        };
    }
    
    if (question.includes('egg')) {
        return {
            answer: "This is easter egg 1; perhaps the only one. Congrats on finding it. "
        };
    }
    
    // Default fallback
    return {
        answer: "I don't have specific information about that. Try asking about credits, majors, minors, prerequisites, or schedule requirements."
    };
}