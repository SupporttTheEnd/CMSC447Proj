export function checkClassSequence() {
    clearWarnings();
    
    const db = window.globalVariables.db;
    const [transfer, ...dropzones] = document.querySelectorAll(`#classes .dropzone`);

    // Iterates through each semester in schedule
    dropzones.forEach(dropzone => {
        const courses = dropzone.querySelectorAll('.class-item');
        
        // Iterates through each course in semester
        courses.forEach(course => {
            // Checks if course has been selected for GEP
            if (course.id) {
                const query = `
                    SELECT classes.prerequisites, classes.corequisites
                    FROM classes
                    WHERE courseId = '${course.id}'
                `;
                const result = db.exec(query);

                if (!result.length) {
                    return;
                }

                // Identifies course's prereqs and coreqs
                result[0].values.map(row => {
                    course.dataset.prereqs = row[0];
                    course.dataset.coreqs = row[1];
                })

                // Checks if course has preqreqs
                if (JSON.parse(course.dataset.prereqs).length) {
                    prereqIsFulfilled(course);
                }

                // Checks if course has coreqs
                if (JSON.parse(course.dataset.coreqs).length) {
                    coreqIsFulfilled(course);
                }
            }
        })
    })
}

function prereqIsFulfilled(course) {
    const type = "prereq";
    const semesters = ["fall", "winter", "spring", "summer"];
    const prereqs = JSON.parse(course.dataset.prereqs);
    const year = course.closest('.container').classList[3];
    const semester = course.parentElement.classList[0];
    const db = window.globalVariables.db;
    let isFulfilled = 0;

    // Iterates through each prereq combination
    for (const prereq of prereqs) {
        const numberPrereqs = prereq.length;
        let numberFulfilled = 0;

        // Iterates through each requirement in prereq combination
        for (const requirement of prereq) {
            // Checks if requirement is not a single course
            if (requirement.includes("$")) {
                const category = requirement.replace('$', '');

                // Checks if requirement is a wildcard
                if(category.includes(".")) {
                    const wildcardQuery = `
                        SELECT courseId
                        FROM classes
                        WHERE courseId LIKE '${category.replace(/\./g, "_")}'
                    `;
                    const wildcardResult = db.exec(wildcardQuery);
                    
                    if (wildcardResult.length) {
                        // Iterates through each result for wildcard requirement
                        for (const result of wildcardResult[0].values) {
                            // Checks if wildcard requirement is fulfilled
                            if (prereqRequirementIsFulfilled(result[0], semesters, parseInt(year.slice(-1)), semester)) {
                                numberFulfilled += 1;
                                break;
                            }
                        }
                    }
                } else {
                    const gepQuery = `
                        SELECT courses
                        FROM requirements
                        WHERE category = '${category}'
                    `;
                    const gepResult = db.exec(gepQuery);

                    if (gepResult.length) {
                        const gepData = gepResult[0].values[0][0];
                        // Iterates through each result for GEP requirement
                        for (const result of gepData.replace(/["\[\]]/g, "").split(",")) {
                            // Checks if gep requirement is fulfilled
                            if (prereqRequirementIsFulfilled(result, semesters, parseInt(year.slice(-1)), semester)) {
                                numberFulfilled += 1;
                                break;
                            }
                        }
                    }
                }
            } else {
                // Checks if requirement is fulfilled
                if (prereqRequirementIsFulfilled(requirement, semesters, parseInt(year.slice(-1)), semester) || prereqIsCoreq(course, requirement, year, semester)) {
                    numberFulfilled += 1;
                    removeCoreq(course, requirement);
                }
            }
        }

        // Checks if a prereq combination was fulfilled
        if (numberPrereqs === numberFulfilled) {
            isFulfilled = 1;
        }
    }

    // Checks if course's prereqs were fulfilled
    if (!isFulfilled) {
        addWarning(course, type);
    }
}

function prereqRequirementIsFulfilled(requirement, semesters, year, semester) {
    // Iterates through each year
    for (let i = 0; i <= year; i++) {
        // Checks for transfer credits
        if (i === 0) {
            const transferCourses = document.querySelector(`.year-0 .dropzone`);

            if (transferCourses && transferCourses.querySelector(`#${requirement}`)) {

                return true;
            }
        } else {
            // Iterates through each semester
            for (let j = 0; j <= semesters.length; j++) {
                // Checks if course's year and semester was reached
                if (i === year && semesters[j] === semester) {
                    return false;
                }
                
                const prevSemester = document.querySelector(`.year-${i} .${semesters[j]}.dropzone`);
            
                // Checks if a previous semester contains requirement
                if (prevSemester && prevSemester.querySelector(`#${requirement}`)) {
                    return true;
                }
            }
        }
    }
}

function prereqIsCoreq(course, requirement, year, semester) {
    let coreqs = JSON.parse(course.dataset.coreqs);

    // Iterates through each coreq combination
    for (const coreq of coreqs) {
        // Checks if coreq combination contains prereq requirement
        if (coreq.includes(requirement) && coreqRequirementIsFulfilled(requirement, year, semester)) {
            return true;
        }
    }

    return false;
}

function removeCoreq(course, requirement) {
    let coreqs = JSON.parse(course.dataset.coreqs);

    // Iterates through each coreq combination
    for (const coreq of coreqs) {
        // Checks if coreq combination contains prereq requirement
        if (coreq.includes(requirement)) {
            course.dataset.coreqs = "[]";
            break;
        }
    }
}

function coreqIsFulfilled(course) {
    const type = "coreq";
    const coreqs = JSON.parse(course.dataset.coreqs);
    const year = course.closest('.container').classList[3];
    const semester = course.parentElement.classList[0];
    let isFulfilled = 0;

    // Iterates through each coreq combination
    for (const coreq of coreqs) {
        const numberCoreqs = coreq.length;
        let numberFulfilled = 0;

        // Iterates through each requirement in coreq combination
        for (const requirement of coreq) {
            // Checks if requirement is fulfilled
            if (coreqRequirementIsFulfilled(requirement, year, semester)) {
                numberFulfilled += 1;
            }
        }

        // Checks if a coreq combination was fulfilled
        if (numberCoreqs === numberFulfilled) {
            isFulfilled = 1;
            break;
        }
    }

    // Checks if corequisites were fulfilled
    if (!isFulfilled) {
        addWarning(course, type);
    }
}

function coreqRequirementIsFulfilled(requirement, year, semester) {
    const currSemester = document.querySelector(`.${year} .${semester}.dropzone`);

    // Checks if a current semester contains requirement
    if (currSemester.querySelector(`#${requirement}`)) {
        return true;
    }

    return false;
}

export function generateWarning() {
    let container = document.createElement("div");
    container.classList.add("mt-5", "px-0", "warning");
    container.innerHTML = `
        <div class="warning-box" style="display:none"> 
            <div class="semester-header d-flex">
                <div class="transfer semester-item">Warnings</div>
            </div>

            <div class="d-flex warning-list">
            </div>
        </div>
        <div class="d-flex flex-column align-items-center add-line">
            <button class="additionSession"></button>
            <p> Show Warnings </p>
        </div>
    `;
    container.querySelector('.additionSession').addEventListener('click', showWarningBox);

    document.getElementById("classes").appendChild(container);
}

function showWarningBox(event) {
    const button = event.target;
    const warningbox = button.closest('.warning').querySelector('.warning-box');

    if (button.dataset.inserted === "true") {
        warningbox.style.display = "none";

        button.dataset.inserted = "false";
        button.nextElementSibling.style.display = "block";
        button.style.backgroundImage = `url('images/plus.png')`;
    } else {
        warningbox.style.display = "block";
        button.dataset.inserted = "true";
        button.nextElementSibling.style.display = "none";
        button.style.backgroundImage = `url('images/minus.png')`;
    }
}

function addWarning(course, type) {
    const warningContainer = document.querySelector(".warning-list");
    const warningDiv = document.createElement("div");
    warningDiv.classList.add("warning-item");
    warningDiv.id = course.id;

    const warningMessage = document.createElement("span");
    warningMessage.textContent = `${course.id} is missing a ${type}`;

    warningDiv.appendChild(warningMessage);
    warningContainer.appendChild(warningDiv);
}

function clearWarnings() {
    const warningContainer = document.querySelector(".warning-list");
    warningContainer.innerHTML = "";
}
