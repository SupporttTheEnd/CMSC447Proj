export async function main() {
    await loadTabContent('search');
    initializeSelect2();
    setupMajorMinorValidation();
    generateYears();
    await loadAndPopulateClasses();
    updateCredits();
    dragAndDropEnable();
    darkMode();
    makeDraggable("sidebar", ["hide", "dropzone"]); 
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
            updateCredits();
        });
    });
}


function generateYears(addNew = false) {
    let container = document.getElementById("classes");

    if (addNew) {
        window.globalVariables.years++;
        container.appendChild(createYear(window.globalVariables.years));
        return;
    }

    container.innerHTML = "";
    for (let i = 1; i <= window.globalVariables.years; i++) {
        container.appendChild(createYear(i));
    }
}

function createYear(yearNumber) {
    let yearDiv = document.createElement("div");
    yearDiv.classList.add("container", "mt-4", `year-${yearNumber}`);

    yearDiv.innerHTML = `
        <div class="year-header text-center">Year ${yearNumber}</div>

        <div class="og-boxes">
            <div class="semester-header d-flex">
                <div class="semester-item">Fall Semester</div>
                <div class="fall semester-item">Credits</div>
                <hr class="divider">
                <div class="semester-item">Spring Semester</div>
                <div class="spring semester-item">Credits</div>
            </div>

            <div class="d-flex">
                <div class="fall w-50 border p-2 dropzone"></div>
                <div class="spring w-50 border p-2 dropzone"></div>
            </div>
        <div>

        <div class="d-flex flex-column align-items-center">
            <button class="additionSession" onclick="handleAdditionalSessions(this)"></button>
            <p> Taking Winter Or Summer Session? </p>
        </div>
    `;

    return yearDiv;
}

async function loadAndPopulateClasses() {
    const response = await fetch("database/classes.json");
    const classData = await response.json();

    classData.forEach(course => {
        const semesterContainer = document.querySelector(`.year-${course.year} .${course.semester}.dropzone`);
        if (semesterContainer) {
            const classDiv = document.createElement("div");
            classDiv.classList.add("class-item", "draggable");
            classDiv.setAttribute("draggable", "true");
            classDiv.id = course.courseId;

            const courseName = document.createElement("span");
            courseName.classList.add("course-name");
            courseName.textContent = course.name;

            const credits = document.createElement("span");
            credits.classList.add("credits");
            credits.textContent = `${course.credits} Credits`;
            credits.style.whiteSpace = "nowrap";

            classDiv.appendChild(courseName);
            classDiv.appendChild(credits);

            semesterContainer.appendChild(classDiv);
        }
    });
}

function updateCredits() {
    const dropzones = document.querySelectorAll(`.container .dropzone`);

    dropzones.forEach(dropzone => {
        const semester = dropzone.classList[0];

        const creditDisplay = dropzone.closest('.container').querySelector(`.semester-header .${semester}`);
        let totalCredits = 0;
        dropzone.querySelectorAll('.class-item .credits').forEach(creditSpan => {
            totalCredits += parseInt(creditSpan.textContent.replace(/\D/g, ""), 10) || 0;
        });

        creditDisplay.textContent = `Credits: ${totalCredits}`;
    });
}

function darkMode() {
    const darkModeButton = document.querySelector('#dark-mode-toggle');

    darkModeButton.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('dark-mode', 'enabled');
        } else {
            localStorage.setItem('dark-mode', 'disabled');
        }
    });

    if (localStorage.getItem('dark-mode') === 'enabled') {
        document.body.classList.add('dark-mode');
    }
}

function makeDraggable(element, excludeClasses = []) {
    const object = document.querySelector("." + element);

    let isMouseDown = false;
    let offsetX = 0;
    let offsetY = 0;

    object.addEventListener("mousedown", (e) => {
        if (excludeClasses.some(excludeClass => object.classList.contains(excludeClass) || e.target.closest(`.${excludeClass}`))) {
            return;
        }
        isMouseDown = true;
        offsetX = e.clientX - object.getBoundingClientRect().left;
        offsetY = e.clientY - object.getBoundingClientRect().top;
        object.style.cursor = "grabbing";
    });

    document.addEventListener("mousemove", (e) => {
        if (isMouseDown) {
            const left = e.clientX - offsetX;
            const top = e.clientY - offsetY;
            object.style.left = `${left}px`;
            object.style.top = `${top}px`;
        }
    });

    document.addEventListener("mouseup", () => {
        isMouseDown = false;
        object.style.cursor = "grab";
    });
}

async function loadTabContent(tabName) {
    try {
        const response = await fetch(`tabs/${tabName}.html`);
        const tabHtml = await response.text();
        document.getElementById(tabName).innerHTML = tabHtml;
    } catch (error) {
        console.error(`Error loading ${tabName}.html:`, error);
    }
}
