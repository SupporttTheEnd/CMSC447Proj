import { generateYears } from './home.js';

export function balanceClassData(rawCourses, rawRequirements) {
    const rawCombinedList = [];
    const combinedList = [];

    for (let i = 0; i < rawCourses.length; i++) {
        rawCombinedList.push(rawCourses[i].concat(rawRequirements[i]));
        rawCombinedList[i].sort((a, b) => ((a.year - b.year) * 10) + a.semester.localeCompare(b.semester));
    }

    rawCombinedList.sort((a, b) => b.length - a.length);

    var totalActivePrograms = rawCombinedList.length;
    var currClassesInSem = 0;
    var currYear = 1;
    var currSem = "fall";
    for (let i = 0; i < rawCombinedList[0].length; i++) {
        for (let j = 0; j < totalActivePrograms; j++) {
            if ((i + 1) > (rawCombinedList[j].length)) {
                totalActivePrograms--;
                continue;
            }

            var modifiedClass = rawCombinedList[j][i];
            
            if (currClassesInSem >= 5) {
                if (currSem == "fall") {
                    currSem = "spring";
                }
                else {
                    currSem = "fall";
                    currYear++;
                }
                currClassesInSem = 0;
            }

            if (modifiedClass.courseId.startsWith('$') || !(combinedList.find(element => 
                modifiedClass.courseId == element.courseId))){

                modifiedClass.year = currYear;
                modifiedClass.semester = currSem;
                currClassesInSem++;
                
                combinedList.push(modifiedClass);
            }
        }
    }

    for (let i = 0; i < (currYear - 4); i++){
        generateYears(true);
    }
    return combinedList;
}