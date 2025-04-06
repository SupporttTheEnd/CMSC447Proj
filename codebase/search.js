import { dragAndDropEnable } from './home.js';
import { generateInformation } from './information.js';

export async function main() {
    setupClassCategory();
    setupCreditsFilter();
    setupAvailabilityFilter();
    handleSubmission();
    preventEnterKeyOnInput();
    resetFilters();
}

function setupClassCategory() {
    const db = window.globalVariables.db;

    const classResults = db.exec("SELECT courseId, name, credits FROM classes");

    const categories = new Set();
    classResults[0].values.forEach(row => {
        const category = row[0].match(/[A-Z]+/)[0];
        categories.add(category);
    });

    const formattedData = [{ id: '', text: '' }].concat(
        Array.from(categories).map(category => ({
            id: category,
            text: category
        }))
    );

    $('#class-category').select2({
        data: formattedData,
        width: '400px',
        placeholder: "Select a class category...",
        allowClear: true
    });
}

function setupCreditsFilter() {
    const creditsOptions = [
        { id: '', text: '' },
        { id: '1', text: '1 Credit' },
        { id: '2', text: '2 Credits' },
        { id: '3', text: '3 Credits' },
        { id: '4', text: '4 Credits' },
        { id: '5', text: '5 Credits' },
        { id: '6', text: '6 Credits' }
    ];

    $('#class-credits').select2({
        data: creditsOptions,
        width: '400px',
        placeholder: "Select credits...",
        allowClear: true,
        minimumResultsForSearch: Infinity
    });
}

function setupAvailabilityFilter() {
    const availabilityOptions = [
        { id: '', text: '' },
        { id: '1', text: 'Spring' },
        { id: '2', text: 'Summer' },
        { id: '3', text: 'Fall' },
        { id: '4', text: 'Winter' }
    ];

    $('#class-availability').select2({
        data: availabilityOptions,
        width: '400px',
        placeholder: "Select availability...",
        allowClear: true,
        minimumResultsForSearch: Infinity
    });
}

function handleSubmission() {
    const db = window.globalVariables.db;
    const resultsPerPage = 15;
    let currentPage = 1;

    $('#search-button').on('click', function() {
        const query = $('#class-query').val().toLowerCase();
        const selectedCategory = $('#class-category').val();
        const selectedCredits = $('#class-credits').val();
        const selectedAvailability = $('#class-availability').val();
        const filteredData = db.exec(`
            SELECT courseId, name, credits, availability, prerequisites
            FROM classes 
            WHERE (LOWER(courseId) LIKE '%${query}%' 
            OR LOWER(name) LIKE '%${query}%')
            ${selectedCategory ? `AND courseId LIKE '${selectedCategory}%'` : ''}
            ${selectedCredits ? `AND credits = ${selectedCredits}` : ''}
            ${selectedAvailability ? `AND SUBSTR(availability, ${selectedAvailability}, 1) = '1'` : ''}
            LIMIT 500
        `);        
            
        const dropzone = $('#class-dropzone');
        dropzone.empty();
        const paginationContainer = $('.pagination-controls');
        paginationContainer.empty();

        if (filteredData[0] && filteredData[0].values.length > 0) {
            const totalPages = Math.ceil(filteredData[0].values.length / resultsPerPage);
            displayPage(filteredData[0].values, currentPage, resultsPerPage, dropzone);
            setupPaginationControls(totalPages, currentPage, filteredData[0].values, resultsPerPage, dropzone);
            dragAndDropEnable();
        } else {
            dropzone.append('<h3 class="text-center">No results.</h3>');
        }
    });
}

function displayPage(data, page, resultsPerPage, dropzone) {
    const start = (page - 1) * resultsPerPage;
    const end = start + resultsPerPage;
    const pageData = data.slice(start, end);

    dropzone.empty();
    pageData.forEach(row => {
        if (!document.querySelector(`.sidebar .dropzone #${row[0]}`)) {
            const classDiv = document.createElement("div");
            classDiv.classList.add("class-item", "draggable");
            classDiv.setAttribute("draggable", "true");
            classDiv.id = row[0];

            const spansHtml = `
                <span class="course-name"><span class="information">🛈 </span>[${row[0]}] ${row[1]}</span>
                <span class="credits" style="white-space: nowrap;">${row[2]} Credits</span>
            `;
            classDiv.innerHTML = spansHtml;

            dropzone.append(classDiv);
            generateInformation(row[4], row[3], classDiv); 
        }
    });
}

function setupPaginationControls(totalPages, currentPage, data, resultsPerPage, dropzone) {
    const paginationContainer = $('.pagination-controls');
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = $(`<button class="page-button">${i}</button>`);
        if (i === currentPage) {
            pageButton.addClass('active');
        }
        pageButton.on('click', function() {
            currentPage = i;
            displayPage(data, currentPage, resultsPerPage, dropzone);
            $('.page-button').removeClass('active');
            $(this).addClass('active');
            dragAndDropEnable();
        });
        paginationContainer.append(pageButton);
    }
    dropzone.before(paginationContainer);
}

function preventEnterKeyOnInput() {
    $('#class-query').on('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
        }
    });
}

function resetFilters() {
    $('#reset-button').on('click', function() {
        $('#class-query').val('');
        $('#class-category').val(null).trigger('change');
        $('#class-credits').val(null).trigger('change');
        $('#class-availability').val(null).trigger('change');
    });
}