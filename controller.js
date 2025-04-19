import * as home from './codebase/home.js';
import * as search from './codebase/search.js';
import * as exam from './codebase/exam.js';
import * as login from './codebase/login.js';
import * as note from './codebase/notes.js';

window.globalVariables = {
    years: 4,
    db: null,
    account: null
};

$(document).ready(function () {
    controller();
});

async function controller() {
    document.querySelector('.spinner').style.display = 'block';
    document.querySelector('#content').style.display = 'none';

    await setupSQL();
    await home.main();
    await search.main();
    await exam.main();
    await login.main();
    await note.main();

    document.querySelector('.spinner').style.display = 'none';
    document.querySelector('#content').style.display = 'block';
}

async function setupSQL() {
    const SQL = await initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}` });
    window.globalVariables.db = new SQL.Database();

    const db = window.globalVariables.db;

    const classResponse = await fetch("database/classes.json");
    const classData = await classResponse.json();

    db.run(`
        CREATE TABLE IF NOT EXISTS classes (
            courseId TEXT PRIMARY KEY,
            name TEXT,
            availability TEXT,
            credits TEXT,
            prerequisites TEXT,
            corequisites TEXT
        );
    `);

    classData.forEach(course => {
        db.run("INSERT OR REPLACE INTO classes (courseId, name, credits, availability, prerequisites, corequisites) VALUES (?, ?, ?, ?, ?, ?)",
            [course.courseId, course.name, course.credits, course.availability, JSON.stringify(course.prerequisites), JSON.stringify(course.corequisites)]);
    });

    const requirementFiles = [
        "business_technology_administration",
        "chemical_engineering",
        "computer_engineering_communications",
        "computer_engineering_cybersecurity",
        "computer_engineering_electronic_systems",
        "computer_science_minor",
        "computer_science",
        "computing_minor",
        "information_systems_minor",
        "information_systems",
        "management_minor",
        "mechanical_engineering"
    ];

    for (const file of requirementFiles) {
        const response = await fetch(`database/class-requirements/${file}.json`);
        const data = await response.json();

        db.run(`
            CREATE TABLE IF NOT EXISTS ${file} (
                courseId TEXT,
                year INTEGER,
                semester TEXT
            );
        `);

        data.forEach(course => {
            db.run(`INSERT OR REPLACE INTO ${file} (courseId, year, semester) VALUES (?, ?, ?)`,
                [course.courseId, course.year, course.semester]);
        });
    }

    const requirementResponse = await fetch("database/requirements.json");
    const requirementData = await requirementResponse.json();

    db.run(`
        CREATE TABLE IF NOT EXISTS requirements (
            category TEXT,
            courses TEXT
        );
    `);

    Object.entries(requirementData).forEach(([category, courses]) => {
        db.run("INSERT OR REPLACE INTO requirements (category, courses) VALUES (?, ?)",
            [category, JSON.stringify(courses)]);
    });

    const noteResponse = await fetch('https://cmsc447-470ca-default-rtdb.firebaseio.com/notes.json');
    const noteData = await noteResponse.json();

    db.run(`
        CREATE TABLE IF NOT EXISTS notes (
            id TEXT PRIMARY KEY,
            classId TEXT,
            name TEXT,
            email TEXT,
            notes TEXT,
            score INTEGER,
            dateTime TEXT
        );
    `);

    if (noteData) {
        Object.entries(noteData).forEach(([key, note]) => {
            db.run("INSERT INTO notes (id, classId, name, email, notes, score, dateTime) VALUES (?, ?, ?, ?, ?, ?, ?)", [
                key, note.classId, note.name, note.email, note.notes, note.score, note.dateTime
            ]);
        });
    }
    
}
