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

const filePath = 'database/classes.json';
const courses = loadData(filePath);

if (courses.length > 0) {
  const duplicates = checkDuplicates(courses);

  if (duplicates.length > 0) {
    console.log('Found duplicates:');
    console.log(JSON.stringify(duplicates, null, 2));
  } else {
    console.log('No duplicates found.');
  }
}
