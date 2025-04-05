const fs = require('fs');

function loadData(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        return [];
    }
}

function checkDuplicates(courseList) {
    const seen = new Set();
    const duplicates = [];

    courseList.forEach(course => {
        if (seen.has(course.courseId)) {
            duplicates.push(course);
        } else {
            seen.add(course.courseId);
        }
    });

    return duplicates;
}

function checkRequirementLinks(programReqs, reqKeys) {
    const requirementFails = new Set();

    programReqs.forEach(req => {
        let testId = req.courseId;
        if (req.courseId.startsWith('$')) {
            testId = req.courseId.split('$')[1];
            if (!reqKeys.includes(testId) && !requirementFails.has(testId)) {
                requirementFails.add(testId);
            }
        }
    });

    return requirementFails;
}

function checkInvalidPrereqs(filePath) {
    const courses = loadData(filePath);

    const invalidPrereqs = courses.filter(course => {
        const prereqs = course.prerequisites;
        return prereqs.length > 0 && !Array.isArray(prereqs[0]); // Check if not a double array
    });

    return invalidPrereqs;
}

const classPath = 'classes.json';
const courses = loadData(classPath);

if (courses.length > 0) {
    const duplicates = checkDuplicates(courses);

    if (duplicates.length > 0) {
        console.log('Found duplicates:');
        console.log(JSON.stringify(duplicates, null, 2));
    } else {
        console.log('No duplicates found.');
    }
}

const invalidPrereqs = checkInvalidPrereqs(classPath);
if (invalidPrereqs.length > 0) {
    console.log('Found courses with invalid prerequisites:');
    console.log(JSON.stringify(invalidPrereqs, null, 2));
} else {
    console.log('No invalid prerequisites found.');
}

const reqPath = 'requirements.json';
const reqs = loadData(reqPath);
const reqKeys = Object.keys(reqs);
const reqVals = Object.values(reqs);

if (!reqs.length) {
    const programReqPaths = [
        'class-requirements/business_technology_administration.json',
        'class-requirements/chemical_engineering.json',
        'class-requirements/computer_engineering_communications.json',
        'class-requirements/computer_engineering_cybersecurity.json',
        'class-requirements/computer_engineering_electronic_systems.json',
        'class-requirements/computer_science_minor.json',
        'class-requirements/computer_science.json',
        'class-requirements/computing_minor.json',
        'class-requirements/information_systems_minor.json',
        'class-requirements/information_systems.json',
        'class-requirements/management_minor.json',
        'class-requirements/mechanical_engineering.json'
    ];

    const requirementFails = new Set();

    programReqPaths.forEach(reqPath => {
        const programReqs = loadData(reqPath);

        if (programReqs.length > 0) {
            const fails = checkRequirementLinks(programReqs, reqKeys);
            fails.forEach(fail => requirementFails.add(fail));
        }
    });

    if (requirementFails.size > 0) {
        console.log('Found Unlinked Requirements:');
        console.log(Array.from(requirementFails));
    } else {
        console.log('No Unlinked Requirements Found');
    }
}