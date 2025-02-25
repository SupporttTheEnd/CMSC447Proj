import * as home from './codebase/home.js';
import * as search from './codebase/search.js';

window.globalVariables = {
    years: 4,
    db: null
}

$(document).ready(function () {
    controller();
});

async function controller() {
    await setupSQL();
    await home.main(); 
    await search.main(); 
}

async function setupSQL() {
    const SQL = await initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}` });
    window.globalVariables.db = new SQL.Database();

    const db = window.globalVariables.db;

    db.run(`
        CREATE TABLE IF NOT EXISTS classes (
            courseId TEXT PRIMARY KEY,
            name TEXT,
            credits INTEGER,
            prerequisites TEXT
        );
    `);

    const classResponse = await fetch("database/classes.json");
    const classData = await classResponse.json();

    classData.forEach(course => {
        db.run("INSERT OR REPLACE INTO classes (courseId, name, credits, prerequisites) VALUES (?, ?, ?, ?)", 
            [course.courseId, course.name, course.credits, JSON.stringify(course.prerequisites)]);
    });

    const requirementFiles = ["computer_science"]; 

    for (const file of requirementFiles) {
        const response = await fetch(`database/class-requirements/${file}.json`);
        const data = await response.json();

        db.run(`
            CREATE TABLE IF NOT EXISTS ${file} (
                courseId TEXT PRIMARY KEY,
                year INTEGER,
                semester TEXT
            );
        `);

        data.forEach(course => {
            db.run(`INSERT OR REPLACE INTO ${file} (courseId, year, semester) VALUES (?, ?, ?)`, 
                [course.courseId, course.year, course.semester]);
        });
    }
}
