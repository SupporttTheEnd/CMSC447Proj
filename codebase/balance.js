import { generateYears } from './home.js';

export function balanceClassData() {
    let classesArray = [];

    for (let i = 1; i <= window.globalVariables.years; i++) {
        const yearContainer = document.querySelector(`.container.year-${i}`);

        yearContainer.querySelectorAll(".dropzone").forEach(dropzone => {
            dropzone.querySelectorAll(".class-item").forEach(classItem => {
                classesArray.push(classItem);
                classItem.remove();
            });
        });
    }

    for (let i = 1; i <= window.globalVariables.years; i++) {
        const yearContainer = document.querySelector(`.container.year-${i}`);

        for (let dropzone of yearContainer.querySelectorAll(".dropzone")) {    
            for (let currClasses = 0; currClasses < 5 && classesArray.length > 0; currClasses++) {
                dropzone.appendChild(classesArray.shift());
            }
        }
    
        if (classesArray.length > 0 && i === window.globalVariables.years) {
            generateYears(true);
        }
    }

    // Additional functionality to move require items to the bottom of the dropzones
    document.querySelectorAll("#classes .dropzone").forEach(dropzone => {
        dropzone.querySelectorAll(".require-item").forEach(classItem => {
            dropzone.appendChild(classItem);
        });
    });
}