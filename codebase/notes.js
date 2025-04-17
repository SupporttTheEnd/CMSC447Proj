import { createMessage } from './login.js';

export async function main() {
    setupClassDropdown();
    setupRating();
    document.getElementById("post-note-button").addEventListener("click", postNewNote);
}

async function postNewNote() {
    const classId = $("#post-class").val();
    const notes = $("#post-notes").val();
    const score = document.querySelector("#post-score").value;
    const email = document.querySelector("#user-email").textContent?.split(":")[1]?.trim();
    const name = document.querySelector(".welcome-text").textContent?.split(",")[1]?.trim();

    if (!classId) {
        createMessage("Please select a class before submitting.");
        return;
    }

    if (!notes || notes.trim() === "") {
        createMessage("Please enter your notes before submitting.");
        return;
    }

    if (!score) {
        createMessage("Please select a score before submitting.");
        return;
    }

    if (!email) {
        createMessage("User email is missing. Please log in again.");
        return;
    }

    if (!name) {
        createMessage("User name is missing. Please log in again.");
        return;
    }

    const note = {
        classId,
        notes,
        score,
        email,
        name,
        dateTime: new Date().toISOString()
    };

    document.getElementById("post-note-button").disabled = true;

    try {
        await fetch('https://cmsc447-470ca-default-rtdb.firebaseio.com/notes.json', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(note)
        });

        createMessage(`Your note was successfully posted for [${note.classId}]. Thank you for submitting.`, false);
    } catch (error) {
        createMessage("Something went wrong when posting your note.", true);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    await refreshData();

    document.getElementById("post-note-button").disabled = false;
}

function setupClassDropdown() {
    const db = window.globalVariables.db;

    const classResult = db.exec("SELECT courseId, name FROM classes");
    const classData = [{ id: '', text: '' }].concat(
        classResult[0].values.map(row => {
            return {
                id: row[0],
                text: `[${row[0]}] ${row[1]}`,
            };
        })
    );
    
    $('#post-class').select2({
        data: classData,
        width: '400px',
        placeholder: "Select a class...",
        allowClear: true
    });
}

function setupRating() {
    $('#post-score').select2({
        data: [{ id: '', text: '' }].concat(
            Array.from({ length: 10 }, (_, i) => {
                const score = i + 1;
                let label = `${score}`;
                switch (score) {
                    case 1:
                        label += ' (very easy to get into)';
                        break;
                    case 2:
                        label += ' (easy to get into)';
                        break;
                    case 3:
                        label += ' (somewhat easy)';
                        break;
                    case 4:
                        label += ' (below average difficulty)';
                        break;
                    case 5:
                        label += ' (moderate difficulty)';
                        break;
                    case 6:
                        label += ' (slightly competitive)';
                        break;
                    case 7:
                        label += ' (competitive)';
                        break;
                    case 8:
                        label += ' (hard to get into)';
                        break;
                    case 9:
                        label += ' (very hard)';
                        break;
                    case 10:
                        label += ' (extremely hard to get into)';
                        break;
                }
                return { id: score, text: label };
            })
        ),
        width: '400px',
        placeholder: "How competitive was it to get into this class?",
        allowClear: true,
        minimumResultsForSearch: Infinity
    });
    
}

async function refreshData() {
    const db = window.globalVariables.db;
    const noteResponse = await fetch('https://cmsc447-470ca-default-rtdb.firebaseio.com/notes.json');
    const noteData = await noteResponse.json();

    if (noteData) {
        Object.entries(noteData).forEach(([key, note]) => {
            db.run("INSERT OR IGNORE INTO notes (id, classId, name, email, notes, score, dateTime) VALUES (?, ?, ?, ?, ?, ?, ?)", [
                key, note.classId, note.name, note.email, note.notes, note.score, note.dateTime
            ]);            
        });
    }
}