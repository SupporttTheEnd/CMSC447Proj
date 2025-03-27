export async function main() {
    await loadTabContent('search');
    await loadTabContent('exam');
    initializeSelect2();
    setupMajorMinorValidation();
    generateYears();
    makeDraggable("sidebar", ["hide", "dropzone"]);
    darkMode();
    document.getElementById("generateButton").addEventListener("click", loadAndPopulateClasses);
}

function initializeSelect2() {
    $('.searchable-dropdown').select2({
        placeholder: "Select an Option",
        allowClear: true,
        width: '400px'
    });
}

function setupMajorMinorValidation() {
    $('#major').on('change', function () {
        let selectedMajors = $(this).find(':selected').map(function () {
            return $(this).text();
        }).get();

        $('#minor option').each(function () {
            $(this).prop('disabled', selectedMajors.includes($(this).text()));
        });

        $('#minor').trigger('change.select2');
    });

    $('#minor').on('change', function () {
        let selectedMinors = $(this).find(':selected').map(function () {
            return $(this).text();
        }).get();

        $('#major option').each(function () {
            $(this).prop('disabled', selectedMinors.includes($(this).text()));
        });

        $('#major').trigger('change.select2');
    });
}

export function dragAndDropEnable() {
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

    for (let i = 1; i <= window.globalVariables.years; i++) {
        container.appendChild(createYear(i));
    }
}

function createYear(yearNumber) {
    let yearDiv = document.createElement("div");
    yearDiv.classList.add("container", "mt-4", "px-0", `year-${yearNumber}`);

    yearDiv.innerHTML = `
        <div class="year-header text-center">Year ${yearNumber}</div>

        <div class="og-boxes">
            <div class="semester-header d-flex">
                <div class="fall semester-item">Fall Semester</div>
                <div class="fall semester-credit">Credits</div>
                <hr class="divider">
                <div class="spring semester-item">Spring Semester</div>
                <div class="spring semester-credit">Credits</div>
            </div>

            <div class="d-flex">
                <div class="fall w-50 border p-2 dropzone"></div>
                <div class="spring w-50 border p-2 dropzone"></div>
            </div>
        <div>

        <div class="d-flex flex-column align-items-center">
            <button class="additionSession"></button>
            <p> Taking Winter Or Summer Session? </p>
        </div>
    `;

    yearDiv.querySelector('.additionSession').addEventListener('click', handleAdditionalSessions);

    return yearDiv;
}

function handleAdditionalSessions(event) {
    const button = event.target;
    if (button.dataset.inserted === "true") {
        const fallBox = button.closest('.container').querySelector('.fall.dropzone');
        const springBox = button.closest('.container').querySelector('.spring.dropzone');

        const winterClasses = button.closest('.container').querySelectorAll('.winter .class-item');
        const summerClasses = button.closest('.container').querySelectorAll('.summer .class-item');

        winterClasses.forEach((classItem) => {
            fallBox.appendChild(classItem);
        });

        summerClasses.forEach((classItem) => {
            springBox.appendChild(classItem);
        });

        button.closest(".container").querySelector(".new-boxes").remove();
        button.dataset.inserted = "false";
        button.nextElementSibling.style.display = "block";
        button.style.backgroundImage = `url('images/plus.png')`;
    } else {
        button.parentElement.insertAdjacentHTML("afterend", `
            <div class="new-boxes"> 
                <div class="semester-header d-flex">
                    <div class="winter semester-item">Winter Semester</div>
                    <div class="winter semester-credit">Credits</div>
                    <hr class="divider">
                    <div class="summer semester-item">Summer Semester</div>
                    <div class="summer semester-credit">Credits</div>
                </div>

                <div class="d-flex">
                    <div class = "winter w-50 border p-2 dropzone"></div>
                    <div class = "summer w-50 border p-2 dropzone"></div>
                </div>
            </div>
        `);

        button.nextElementSibling.style.display = "none";
        button.dataset.inserted = "true";
        button.style.backgroundImage = `url('images/minus.png')`;

        dragAndDropEnable();
    }
    updateCredits();
}

async function loadAndPopulateClasses() {
    clearClasses();

    const selectedMajors = Array.from(document.getElementById("major").selectedOptions)
        .map(option => option.value);
    const selectedMinors = Array.from(document.getElementById("minor").selectedOptions)
        .map(option => option.value);

    const selectedPrograms = [...selectedMajors, ...selectedMinors];

    for (const program of selectedPrograms) {
        await populateClass(program);
    }
    
    dragAndDropEnable();
    updateCredits();
}

async function populateClass(className) {
    const db = window.globalVariables.db;

    const query = `
        SELECT classes.courseId, classes.name, classes.credits, ${className}.year, ${className}.semester
        FROM classes
        JOIN ${className} ON classes.courseId = ${className}.courseId
    `;

    const result = db.exec(query);
    if (!result.length) return;

    const combinedData = result[0].values.map(row => {
        return {
            courseId: row[0],
            name: row[1],
            credits: row[2],
            year: row[3],
            semester: row[4]
        };
    });

    combinedData.forEach(course => {
        const semesterContainer = document.querySelector(`.year-${course.year} .${course.semester}.dropzone`);
        if (semesterContainer) {
            const classDiv = document.createElement("div");
            classDiv.classList.add("class-item", "draggable");
            classDiv.setAttribute("draggable", "true");
            classDiv.id = course.courseId;

            const courseName = document.createElement("span");
            courseName.classList.add("course-name");
            courseName.textContent = "[" + course.courseId + "] " + course.name;

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

function clearClasses() {
    const dropzones = document.querySelectorAll(`#classes .dropzone`);

    dropzones.forEach(dropzone => {
        dropzone.innerHTML = "";
    });
}

function updateCredits() {
    const dropzones = document.querySelectorAll(`#classes .dropzone`);

    dropzones.forEach(dropzone => {
        const semester = dropzone.classList[0];
        const container = dropzone.closest('.container');
        const headerComponents = container.querySelectorAll(`.semester-header .${semester}`);
        const creditDisplay = container.querySelector(`.semester-header .${semester}.semester-credit`);
        let totalCredits = 0;

        dropzone.querySelectorAll('.class-item .credits').forEach(creditSpan => {
            totalCredits += parseInt(creditSpan.textContent.replace(/\D/g, ""), 10) || 0;
        });

        // Determine if the credits are valid or not
        let isValid = true;
        let message = `Credits: ${totalCredits}`;

        if (semester === "winter" && totalCredits > 4.5) {
            isValid = false;
            message += " (OverFilled)";
        } else if (semester === "summer" && totalCredits > 16) {
            isValid = false;
            message += " (OverFilled)";
        } else if (semester !== "winter" && semester !== "summer") {
            if (totalCredits < 12) {
                isValid = false;
                message += " (Underfilled)";
            } else if (totalCredits > 19.5) {
                isValid = false;
                message += " (OverFilled)";
            }
        }

        // Update the UI based on the validity of the credits
        if (!isValid) {
            headerComponents.forEach(component => {
                component.style.backgroundColor = "rgba(106, 0, 0, 0.61)";
            });
            dropzone.style.backgroundColor = "rgba(255, 143, 143, 0.36)";
            dropzone.style.setProperty("border-color", "rgba(177, 48, 48, 0.5)", "important");
            dropzone.classList.add('invalid-credits');
        } else {
            headerComponents.forEach(component => {
                component.style.backgroundColor = "";
            });
            dropzone.style.removeProperty("border-color");
            dropzone.style.backgroundColor = "";
            dropzone.classList.remove('invalid-credits');
        }

        creditDisplay.textContent = message;
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

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.additionSession').forEach(button => {
        button.addEventListener('click', handleAdditionalSessions);
    });
});
