export function checkClassSequence() {
    const db = window.globalVariables.db;
    const [transfer, ...dropzones] = document.querySelectorAll(`#classes .dropzone`);

    // Iterates through each semester in schedule
    dropzones.forEach(dropzone => {
        const courses = dropzone.querySelectorAll('.class-item');
        
        // Iterates through each course in semester
        courses.forEach(course => {
            // Checks if GEP has been selected
            if (course.id) {
                const query = `
                    SELECT classes.prerequisites, classes.corequisites
                    FROM classes
                    WHERE courseId = '${course.id}'
                `;
                const result = db.exec(query);

                // Checks if course existed in classes table
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
    const semesters = ["fall", "winter", "spring", "summer"];
    const prereqs = JSON.parse(course.dataset.prereqs);
    const year = parseInt(course.closest('.container').classList[3].slice(-1));
    const semester = course.parentElement.classList[0];
    let isFulfilled = 0;

    // Iterates through each prereq combination
    for (const prereq of prereqs) {
        const numberPrereqs = prereq.length;
        let numberFulfilled = 0;

        // Iterates through each requirement in prereq combination
        for (const requirement of prereq) {
            // Checks if requirement is fulfilled
            if (prereqRequirementIsFulfilled(requirement, semesters, year, semester)) {
                numberFulfilled += 1;
                removeCoreq(course, requirement);
            }
        }

        // Checks if a prereq combination was fulfilled
        if (numberPrereqs === numberFulfilled) {
            isFulfilled = 1;
            break;
        }
    }

    // Checks if course's prereqs were fulfilled
    if (!isFulfilled) {
        console.log(course.id + " is missing a prereq");
    } else {
        console.log(course.id + " fulfills prereqs");
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

function removeCoreq(course, requirement) {
    const coreqs = JSON.parse(course.dataset.coreqs);

    for (const coreq of coreqs) {
        if (coreq.includes(requirement)) {

        }
    }
}

function coreqIsFulfilled(course) {
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
        console.log(course.id + " is missing a coreq");
    } else {
        console.log(course.id + " fulfills coreqs");
    }
}

function coreqRequirementIsFulfilled(requirement, year, semester) {
    const currSemester = document.querySelector(`.${year} .${semester}.dropzone`);

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
            <div class="year-header text-center">Warnings</div>

            <div class="semester-header d-flex">
                <div class="transfer semester-item">Warnings</div>
            </div>

            <div class="d-flex warnings-here">
            </div>
        </div>
        <div class="d-flex flex-column align-items-center add-line">
            <button class="additionSession"></button>
            <p> Want to see warnings? </p>
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
        warningbox.querySelector(".warnings-here").innerHTML = "";

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

function addWarning(course) {
    const warningContainer = document.querySelector("warning");
    const warningDiv = document.createElement("div");
    warningDiv.classList.add("warning-item");
    warningDiv.id = course.courseId;

    warningContainer.appendChild(warningDiv);
}

function clearWarnings() {
    const warningContainer = document.querySelector("warning");
    warningContainer.innerHTML = "";
}
