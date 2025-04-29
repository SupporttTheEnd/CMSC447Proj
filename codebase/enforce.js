import { createMessage } from './login.js';

export function enforceSchedule() {
    checkClassSequence();
    checkClassAvailability();
    checkDuplicateIds();

    let warningCount = document.querySelector(".warning-list").childElementCount;

    if (warningCount > 0) {
        document.querySelector(".warning").style.display = "block";
        createMessage(`There are ${warningCount} warnings. Please review your schedule.`);
    }

    // Updated warning count from duplicates
    warningCount = document.querySelector(".warning-list").childElementCount;

    const warningText = document.querySelector(".warnings-text span");
    if (warningText) {
        warningText.textContent = warningCount;
    }

    const validationResult = isPlanValid();
    if (validationResult.isValid) {
        createMessage("Plan has been validated you can now print a copy of your schedule.", false); 
        confetti();
    }
}

function checkClassSequence() {
    document.querySelector(".warning").style.display = "none";

    clearWarnings();

    const db = window.globalVariables.db;
    const [_, ...dropzones] = document.querySelectorAll(`#classes .dropzone`);

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
                result[0].values.forEach(row => {
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
    const type = "prerequisite";
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
                if (category.includes(".")) {
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
        addSequenceWarning(course, type);
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
    const type = "corequisite";
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
        addSequenceWarning(course, type);
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

function checkClassAvailability() {
    const semesters = {"spring": 0, "summer": 1, "fall": 2, "winter": 3};
    const db = window.globalVariables.db;
    const [_, ...dropzones] = document.querySelectorAll(`#classes .dropzone`);

    // Iterates through each semester in schedule
    dropzones.forEach(dropzone => {
        const courses = dropzone.querySelectorAll('.class-item');

        // Iterates through each course in semester
        courses.forEach(course => {
            const query = `
                SELECT classes.availability
                FROM classes
                WHERE courseId = '${course.id}'
            `;
            const result = db.exec(query);

            if (!result.length) {
                return;
            }

            // Identifies course's availability
            result[0].values.forEach(row => {
                course.dataset.availability = row[0];
            })

            const semester = course.parentElement.classList[0];

            // Checks if course is in available semester
            if (course.dataset.availability[semesters[semester]] !== "1") {
                addAvailabilityWarning(course);
            }
        })
    })
}

function checkDuplicateIds() {
    const ids = new Set();
    const duplicates = new Set();
    const courses = document.querySelectorAll(`#classes .class-item`);

    courses.forEach(course => {
        if (course.id) {
            if (ids.has(course.id)) {
                duplicates.add(course.id);
            } else {
                ids.add(course.id);
            }
        }
    });

    if (duplicates.size > 0) {
        const warningContainer = document.querySelector(".warning-list");
        duplicates.forEach(duplicateId => {
            const warningDiv = document.createElement("div");
            warningDiv.classList.add("warning-item");
            warningDiv.textContent = `Duplicate course ID found: ${duplicateId}`;
            warningContainer.appendChild(warningDiv);
        });

        document.querySelector(".warning").style.display = "block";
    }
}

export function generateWarning() {
    let container = document.createElement("div");
    container.classList.add("mt-5", "px-0", "warning");
    container.style.display = "none";
    container.innerHTML = `
        <div class="warning-box" style="display:none"> 
            <div class="year-header text-center">
                <span>Warnings</span>
            </div>

            <div class="d-flex warning-list">
            </div>
        </div>
        <div class="d-flex flex-column align-items-center add-line">
            <button class="additionSession"></button>
            <p class="warnings-text"> Show Warnings <span></span></p>
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

function addSequenceWarning(course, type) {
    const warningContainer = document.querySelector(".warning-list");
    const warningDiv = document.createElement("div");
    warningDiv.classList.add("warning-item");

    const warningMessage = document.createElement("span");
    warningMessage.textContent = `${course.id} is missing a ${type}`;

    warningDiv.appendChild(warningMessage);
    warningContainer.appendChild(warningDiv);
}

function addAvailabilityWarning(course) {
    const warningContainer = document.querySelector(".warning-list");
    const warningDiv = document.createElement("div");
    warningDiv.classList.add("warning-item");

    const warningMessage = document.createElement("span");
    warningMessage.textContent = `${course.id} is in a invalid semester`;

    warningDiv.appendChild(warningMessage);
    warningContainer.appendChild(warningDiv);
}

function clearWarnings() {
    const warningContainer = document.querySelector(".warning-list");
    warningContainer.innerHTML = "";
}

export function isPlanValid() {
    let totalCredits = 0;

    for (let i = 0; i <= window.globalVariables.years; i++) {
        const yearContainer = document.querySelector(`.container.year-${i}`);
        if (!yearContainer) continue;

        const dropzones = yearContainer.querySelectorAll(".dropzone");
        dropzones.forEach(dropzone => {
            dropzone.querySelectorAll(".class-item").forEach(course => {
                const credit = parseInt(course.querySelector(".credits").textContent.trim());
                if (!credit) return;

                totalCredits += credit;
            });
        });
    }
    console.log(totalCredits)
    updateChecklistItem("total-check", totalCredits >= 120);

    // Update checklist status
    const warningCount = document.querySelector(".warning-list").childElementCount;
    updateChecklistItem("warnings-check", warningCount === 0);

    const classCount = document.querySelectorAll("#classes .class-item").length;
    updateChecklistItem("classes-check", classCount > 0);

    const creditsInvalid = document.querySelector(".invalid-credits");
    updateChecklistItem("credits-check", !creditsInvalid);

    let allRequirementsSelected = true;
    const requirements = document.querySelectorAll(".require-item");
    for (const requirement of requirements) {
        if (requirement.querySelector(".require-select").selectedIndex === 0) {
            allRequirementsSelected = false;
            break;
        }
    }
    updateChecklistItem("requirements-check", allRequirementsSelected && classCount > 0);

    // Validation logic
    if (totalCredits < 120) {
        return { isValid: false, reason: "There are insufficient credits." };
    }

    if (warningCount > 0) {
        return { isValid: false, reason: "There are logical warnings." };
    }

    if (classCount === 0) {
        return { isValid: false, reason: "No classes have been added to the schedule." };
    }

    if (creditsInvalid) {
        return { isValid: false, reason: "Invalid credit count detected." };
    }

    if (!allRequirementsSelected) {
        return { isValid: false, reason: "Not all requirements have been selected." };
    }

    return { isValid: true, reason: "Plan is valid." };
}

function updateChecklistItem(id, isValid) {
    const checklistDot = document.getElementById(id);
    if (checklistDot) {
        if (isValid) {
            checklistDot.classList.remove("invalid");
            checklistDot.classList.add("valid");
        } else {
            checklistDot.classList.remove("valid");
            checklistDot.classList.add("invalid");
        }
    }
}
