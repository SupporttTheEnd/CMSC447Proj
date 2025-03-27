import { dragAndDropEnable } from './home.js';


export async function main() {
    await setupExamFilter();
    setupScoreFilter();
    await handleSubmission();
    resetFilters()
}

async function setupExamFilter() {
    try {
        let response = await fetch('database/exam.json');
        let data = await response.json();

        let formattedData = [{ id: '', text: '' }].concat(
            Object.keys(data).map(exam => ({
                id: exam,
                text: exam
            }))
        );

        $('#ap-exam-dropdown').select2({
            data: formattedData,
            width: '400px',
            placeholder: "Select AP examination...",
            allowClear: true
        });
    } catch (error) {
        console.error("Error loading AP classes:", error);
    }
}

function setupScoreFilter() {
    const scoreOptions = [
        { id: '', text: '' },
        { id: '5', text: '5' },
        { id: '4', text: '4' },
        { id: '3', text: '3' },
        { id: '2', text: '2' },
        { id: '1', text: '1' },
    ];

    $('#score-dropdown').select2({
        data: scoreOptions,
        width: '400px',
        placeholder: "Select score...",
        allowClear: true,
        minimumResultsForSearch: Infinity
    });
}

async function handleSubmission() {
    const db = window.globalVariables.db;

    $('#search-button-ap').on('click', async function () {
        const exam = $('#ap-exam-dropdown').val();
        const score = $('#score-dropdown').val();

        let response = await fetch('database/exam.json');
        let data = await response.json();

        if (data[exam] && data[exam][score]) {
            const classList = data[exam][score];
            const query = classList.map(course => `courseId LIKE '%${course}%'`).join(' OR ');

            const filteredData = db.exec(`
                SELECT courseId, name, credits
                FROM classes
                WHERE ${query} 
                LIMIT 500
            `);

            const dropzone = $('#translate-dropzone');
            dropzone.empty();

            filteredData[0].values.forEach(row => {
                dropzone.append(`
                    <div class="class-item draggable" draggable="true" id="${row[0]}">
                        <span class="course-name">[${row[0]}] ${row[1]}</span>
                        <span class="credits" style="white-space: nowrap;">${row[2]} Credits</span>
                    </div>
                `);
            });
            dragAndDropEnable();
        } else {
            $('#translate-dropzone').html('<h3 class="text-center">No classes found for the selected exam and score.</h3>');
        }
    });
}

function resetFilters() {
    $('#reset-button-ap').on('click', function () {
        $('#ap-exam-dropdown').val(null).trigger('change');
        $('#score-dropdown').val(null).trigger('change');
    });
}