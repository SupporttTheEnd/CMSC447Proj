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

function checkRequirementLinks(program_reqs, reqKeys){
  const requirementFails = new Set();
  program_reqs.forEach(req => {
    testId = req.courseId;
    if (req.courseId.startsWith('$')) {
      testId = req.courseId.split('$')[1];
      if(!reqKeys.includes(testId) && !requirementFails.has(testId)){
        requirementFails.add(testId);
      }
    }
  });
  return requirementFails;
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


console.log('');


const reqPath = 'requirements.json';
const reqs = loadData(reqPath);
const reqKeys = Object.keys(reqs);

if (!reqs.length) {
  program_req_paths = [
    'class-requirements/business_technology_administration.json', 'class-requirements/chemical_engineering.json', 
    'class-requirements/computer_engineering_communications.json', 'class-requirements/computer_engineering_cybersecurity.json', 
    'class-requirements/computer_engineering_electronic_systems.json', 'class-requirements/computer_science_minor.json',
    'class-requirements/computer_science.json', 'class-requirements/computing_minor.json', 'class-requirements/information_systems_minor.json',
    'class-requirements/information_systems.json', 'class-requirements/management_minor.json', 'class-requirements/mechanical_engineering.json'
  ];

  requirementFails = new Set();
  program_req_paths.forEach(reqpath => { //goes through each major
    const program_reqs = loadData(reqpath);

    if (program_reqs.length > 0) {
      requirementFails.add(checkRequirementLinks(program_reqs, reqKeys));
    }
  });

  if (requirementFails.values > 0) {
    console.log("Found  Unlinked Requirements:");
    console.log(Array.from(requirementFails));
  }
  else {
    console.log("No Unlinked Requirements Found");
  }
  console.log('');
}


const reqVals = new Set(Object.values(reqs));
const courseIds = new Set();
const courseFails = new Set();


if (!reqs.length) {
  courses.forEach(course => {
    courseIds.add(course.courseId);
  });

  reqVals.forEach(requirement => {
    requirement.forEach(course => {
      if (!courseIds.has(course)) {
        courseFails.add(course);
      }
    });
  });

  if (courseFails.size > 0) {
    console.log("Found Unlinked Courses: ");
    console.log(courseFails);
    console.log(courseFails.size);
  }
  else {
    console.log("No Unlinked Courses Found");
  }
}