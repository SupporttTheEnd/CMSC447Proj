/**
 So what is implemneted here is a very basic profile page with just the profile picture, name, and email, 
 as well as an unordered list of messages that have been posted. You can edit the html in tabs/profile.html 
 as well as the css at the very bottom of style.css. 

 1) You can try to improve the styling in the css
 2) Add additional functionality by adding a message that has you confirm the deletion
 3) If you are ambitions you can try to add a update option to edit your message with the endpoint; this would be optional though
 await fetch(`https://chttps://cmsc447-470ca-default-rtdb.firebaseio.com/notes/${messageId}.json`, {
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ date, score, note })
});
 */

import { createMessage } from "./login.js";

export async function main() {
    // handling when the user is not logged in
    if (!localStorage.getItem("userEmail")){
        return; 
    }
    await generateProfile();
    // set hooks that call toggle profile when you hit these buttons
    document.querySelector(".umbc-logo").addEventListener("click", toggleProfile);
    document.getElementById("settings-profile-image").parentElement.addEventListener("click", toggleProfile);
}

// essentially either shows the main content or the profile page on click
function toggleProfile() {
    document.getElementById("profile-page").classList.toggle('d-none');
    document.getElementById("content-wrapper").classList.toggle('d-none');
}

// creates all the content associated with the profile
async function generateProfile() {
    // basically making a request for the body of the profile page
    const profilePage = document.getElementById("profile-page"); 
    const response = await fetch(`tabs/profile.html`);
    const profileHtml = await response.text();
    // inserts this response
    document.getElementById("profile-page").innerHTML = profileHtml;

    // updates the username, email, and picture to be dynamic from local storage
    profilePage.querySelector(".userName").innerText = localStorage.getItem("userName");
    profilePage.querySelector(".userEmail").innerText = localStorage.getItem("userEmail");
    profilePage.querySelector(".userPic").src = localStorage.getItem("userPic");

    // fetches the global database
    const db = window.globalVariables.db;
    const noteQuery = `
        SELECT notes.id, notes.notes, notes.score, notes.dateTime, notes.classId
        FROM notes
        WHERE notes.email = '${localStorage.getItem("userEmail")}'
    `;

    // start a notelist with default note
    let noteList = "<li>No notes posted yet; you can express your thoughts in the notes tab.</li>"
    const noteResult = db.exec(noteQuery);

    // if we get results we can overwrite the default
    if (noteResult.length) {
        // mapping data for easier manipulation, we get basically an array of objects
        const noteData = noteResult[0].values.map(row => {
            return {
                id: row[0],
                note: row[1],
                score: row[2],
                dateTime: row[3],
                classId: row[4]  
            };
        });

        // creating dynamic content
        noteList = noteData.map(note => {
            // convert the dateTime to local time format
            const localDateTime = new Date(note.dateTime).toLocaleString();
            // storing the id as a dataset for ease of retrieval
            return `
            <li data-id="${note.id}">
                <button class="delete-message close-button">×</button>
                <h6>Unique Message ID {${note.id}}</h6>
                <em>${localDateTime}</em><br>
                <strong>Posted for ${note.classId}</strong><br>
                <strong>Stated Difficulty: ${note.score}</strong> <br>
                <p>${note.note}</p>
            </li>
            `;
        }).join('');
    }
    // inserting list
    profilePage.querySelector(".notes").innerHTML = noteList;

    // adding event listener to delete message so that it can be handled
    profilePage.querySelectorAll(".delete-message").forEach(button => {
        button.addEventListener("click", handleMessage);
    });
}

// this is the basic operation to delete the message from three places, the local database, persistant storage on firebase, and immediatley on your view
async function handleMessage(event) {
    // extracting the note to be deleted and the corresponding message id 
    const targetMessage = event.target.parentElement;
    const messageId = targetMessage.dataset.id;
    
    // delete from local database
    const db = window.globalVariables.db;
    db.exec(`DELETE FROM notes WHERE id = '${messageId}'`);
    
    // Delete from Firebase
    try {
        await fetch(`https://cmsc447-470ca-default-rtdb.firebaseio.com/notes/${messageId}.json`, {
            method: 'DELETE'
        });
    } catch (error) {
        createMessage("Error deleting from Firebase:");
    }
    
    // Remove from DOM
    targetMessage.remove();
}