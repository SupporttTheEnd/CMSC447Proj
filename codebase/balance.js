import { generateYears } from './home.js';

export function balanceClassData() {
    let classesArray = [], requirementsArray = [];

    let j = 0;
    for (let i = 0; i <= window.globalVariables.years; i++) {
        const yearContainer = document.querySelector(`.container.year-${i}`);
        if (!yearContainer) continue;

        Array.from(yearContainer.querySelectorAll(".dropzone")).forEach(dropzone => {
            classesArray[j] = [];
            requirementsArray[j] = [];
            Array.from(dropzone.querySelectorAll(".class-item")).forEach(classItem => {
                if (classItem.classList.contains("require-item")) {
                    requirementsArray[j].push(classItem);
                } else {
                    classesArray[j].push(classItem);
                }
            });
            j++
        });
    }

    let currYear = 1;
    let tempYear = 0;
    let currSem = 0;
    let currClassesInSem = 0;
    const maxClassesInSem = 5;
    let yearContainer = document.querySelector(`.container.year-${1}`);
    for (let i = 1; i <= 8; i++) {
        let classIndex = 0;
        let requirementIndex = 0;

        
        while (classIndex < classesArray[i].length || requirementIndex < requirementsArray[i].length) {
            
            if (classIndex < classesArray[i].length) {
                Array.from(yearContainer.querySelectorAll(".dropzone"))[currSem].appendChild(classesArray[i][classIndex]);
                classIndex++;
                currClassesInSem++;

                [tempYear, currSem, currClassesInSem] = checkBounds(currYear, currSem, currClassesInSem, maxClassesInSem);
                if (tempYear != currYear) {
                    yearContainer = document.querySelector(`.container.year-${tempYear}`);
                    currYear = tempYear;
                }
            }

            if (requirementIndex <  requirementsArray[i].length) {
                Array.from(yearContainer.querySelectorAll(".dropzone"))[currSem].appendChild(requirementsArray[i][requirementIndex])
                requirementIndex++;
                currClassesInSem++;

                [tempYear, currSem, currClassesInSem] = checkBounds(currYear, currSem, currClassesInSem, maxClassesInSem);
                if (tempYear != currYear) {
                    yearContainer = document.querySelector(`.container.year-${tempYear}`);
                    currYear = tempYear;
                }
            }
        }
    }
}

function checkBounds(currYear, currSem, currClassesInSem, maxClassesInSem){
    if (currClassesInSem >= maxClassesInSem) {
        if (currYear == window.globalVariables.years && currSem == 1) {
            generateYears(true);
        }
        
        if (currSem == 1) {
            currYear++;
            currSem = 0;
        }
        else {
            currSem = 1;
        }

        currClassesInSem = 0;
    }
    
    return [currYear, currSem, currClassesInSem];
}