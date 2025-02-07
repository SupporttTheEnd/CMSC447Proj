let globalVariables = {
    years: 4,
}

$(document).ready(function () {
    controller();
});

async function controller() {
    try {
        initializeSelect2();
        setupMajorMinorValidation();
        generateYears();
        await loadAndPopulateClasses();
        setTimeout(() => {
            dragAndDropEnable();
        }, 1000);
    } catch (error) {
        console.error("Error in controller:", error);
    }
}

function initializeSelect2() {
    $('.searchable-dropdown').select2({
        placeholder: "Select an Option",
        allowClear: true,
        width: '400px'
    });
}

function setupMajorMinorValidation() {
    // Disable selected majors in the minors dropdown
    $('#major').on('change', function () {
        let selectedMajors = $(this).val() || [];
        $('#minor option').each(function () {
            $(this).prop('disabled', selectedMajors.includes($(this).val()));
        });
        $('#minor').trigger('change.select2');
    });

    // Prevent selecting the same minor as a major
    $('#minor').on('change', function () {
        let selectedMinors = $(this).val() || [];
        $('#major option').each(function () {
            $(this).prop('disabled', selectedMinors.includes($(this).val()));
        });
        $('#major').trigger('change.select2');
    });
}

function dragAndDropEnable() {
    const draggables = document.querySelectorAll('.draggable');
    const dropzones = document.querySelectorAll('.dropzone');

    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', (e) => {
            e.target.classList.add('dragging');
        });

        draggable.addEventListener('dragend', (e) => {
            e.target.classList.remove('dragging');
        });
    });

    dropzones.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            const dragging = document.querySelector('.dragging');
            zone.appendChild(dragging);
        });
    });
}


function generateYears(addNew = false) {
    let container = document.getElementById("classes");

    if (addNew) {
        globalVariables.years++;
        container.appendChild(createYear(globalVariables.years));
        return;
    }

    container.innerHTML = "";
    for (let i = 1; i <= globalVariables.years; i++) {
        container.appendChild(createYear(i));
    }
}

function createYear(yearNumber) {
    let yearDiv = document.createElement("div");
    yearDiv.classList.add("container", "mt-4");

    yearDiv.innerHTML = `
        <div class="year-header text-center">Year ${yearNumber}</div>

        <div class="d-flex semester-header">
            <div class="semester-item">Fall Semester</div>
            <div class="semester-item">Credits</div>
            <div class="semester-item">Spring Semester</div>
            <div class="semester-item">Credits</div>
        </div>

        <div class="d-flex">
            <div id="year${yearNumber}-fall" class="w-50 border p-2 dropzone"></div>
            <div id="year${yearNumber}-spring" class="w-50 border p-2 dropzone"></div>
        </div>

        <div class="d-flex flex-column align-items-center">
            <button class="additionSession" onclick="insertAdditionalSessions(this)"></button>
            <p> Taking Winter Or Summer Session? </p>
        </div>
    `;

    return yearDiv;
}

async function loadAndPopulateClasses() {
    fetch("database/classes.json")
        .then(response => response.json())
        .then(classData => {
            classData.forEach(course => {
                const semesterContainer = document.getElementById(`year${course.year}-${course.semester}`);
                if (semesterContainer) {
                    const classDiv = document.createElement("div");
                    classDiv.classList.add("class-item", "draggable");
                    classDiv.setAttribute("draggable", "true");
                    classDiv.textContent = `${course.name} - ${course.credits} Credits`;

                    // Set the unique ID from the JSON data
                    classDiv.id = course.courseId;

                    semesterContainer.appendChild(classDiv);
                }
            });
        })
        .catch(error => console.error("Error loading JSON:", error));
}

function insertAdditionalSessions(button) {
    const yearNumber = button.closest(".container").querySelector(".year-header").textContent.match(/\d+/)[0];

    button.parentElement.insertAdjacentHTML("afterend", `
        <div class="d-flex semester-header">
            <div class="semester-item">Winter Semester</div>
            <div class="semester-item">Credits</div>
            <div class="semester-item">Summer Semester</div>
            <div class="semester-item">Credits</div>
        </div>

        <div class="d-flex">
            <div id="year${yearNumber}-winter" class="w-50 border p-2 dropzone"></div>
            <div id="year${yearNumber}-summer" class="w-50 border p-2 dropzone"></div>
        </div>

    `);

    button.parentElement.style.display = "none";

    setTimeout(() => {
        dragAndDropEnable();
    }, 1000);
}
