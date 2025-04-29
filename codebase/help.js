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

        setTimeout(() => {
            const chatInput = document.getElementById('chat-input');
            if (chatInput) chatInput.focus();
        }, 300);
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
        if (qa.question.toLowerCase().includes(query)) {
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
            const fallbackAnswer = generateFallbackAnswer(normalizedQuestion);
            answer = fallbackAnswer.answer;
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
        let i = 0;
        const typingSpeed = 20; // milliseconds per character

        function typeChar() {
            if (i < answer.length) {
                element.textContent += answer.charAt(i);
                i++;
                setTimeout(typeChar, typingSpeed);
            } else {
                resolve();
            }
        }

        // Start the typing process
        typeChar();
    });
}

// Find an exact match in the FAQ data
function findExactMatch(faqData, normalizedQuestion) {
    for (const qa of faqData) {
        if (normalizedQuestion === qa.question.toLowerCase().trim()) {
            return qa;
        }
    }
    return null;
}

function generateFallbackAnswer(question) {
    // Check for specific topics we might be able to handle
    if (question.includes('credit') || question.includes('credits')) {
        return {
            answer: "Credits are an important part of your academic journey. UMBC requires at least 120 credits to graduate. You need to maintain 12-19.5 credits in fall and spring semesters for full-time status. For more specific information, check your credit distribution in the charts below."
        };
    }

    if (question.includes('major') || question.includes('minor')) {
        return {
            answer: "Your major and minor selections determine the courses required for your degree. You can select multiple majors and minors from the Plan Builder tab. Remember that each combination creates a unique academic path."
        };
    }

    if (question.includes('warning') || question.includes('warnings')) {
        return {
            answer: "Warnings appear when there are issues with your schedule, like missing prerequisites or having courses in semesters when they're not typically offered. You can view all warnings by clicking the 'Show Warnings' button in your schedule."
        };
    }

    // Default fallback
    return {
        answer: "I don't have specific information about that. Try asking about credits, majors, minors, prerequisites, or schedule requirements. You can also explore the various charts on this page for insights about your academic plan."
    };
}