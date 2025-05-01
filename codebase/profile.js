/**
 So what is implemneted here is a very basic profile page with just the profile picture, name, and email, 
 as well as an unordered list of messages that have been posted. You can edit the html in ./tabs/profile.html 
 as well as the css at the very bottom of ./style.css. 

 1) You can try to improve the styling in the css
    a) Add a border to the list items
    b) make sure the colors work in dark mode
    c) generally just improve the appearance of everything
 2) Add additional functionality by adding a message that has you confirm the deletion
 3) If you are ambitions you can try to add a update option to edit your message with the endpoint; this would be optional though
    await fetch(`https://https://cmsc447-470ca-default-rtdb.firebaseio.com/notes/${messageId}.json`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dateTime, score, notes })
    });

    a) the dateTime is stored as an ISO 8601 timestamp, can get it with "new Date().toISOString()"
    b) the score is just a number from 1-10
    c) notes is just a chunk of text

    How I would do it is add a pencil icon (✎) <-- (Thats unicode not an emoji) to the side of the box and when clicked it would replace the fields with input fields; 
    or you could possibley just start the html structure with disabled input fields and when they are updates, you can have a save button that 
    "PUT"s (a, b, c) to the endpoint
**/

import { createMessage } from "./login.js";

export async function main() {
    // handling when the user is not logged in
    if (!localStorage.getItem("userEmail")) {
        return;
    }
    await generateProfile();
    // set hooks that call toggle profile when you hit these buttons
    document.querySelector(".umbc-logo").addEventListener("click", toggleProfile);
    document.getElementById("profile-button").parentElement.addEventListener("click", toggleProfile);
}

// essentially either shows the main content or the profile page on click, toggles the text and image as well
function toggleProfile() {
    document.getElementById("profile-page").classList.toggle('d-none');
    document.getElementById("content-wrapper").classList.toggle('d-none');

    const profileLabel = document.getElementById("profile-label");
    const profileImage = document.getElementById("settings-profile-image")

    if (profileLabel.innerText === "View Your Profile") {
        generateProfile(false);
        profileLabel.innerText = "Go Back Home";
        profileImage.src = "./images/icons/home.svg";
    } else {
        profileLabel.innerText = "View Your Profile";
        profileImage.src = localStorage.getItem("userPic");
    }
}


// creates all the content associated with the profile
async function generateProfile(initilaizing = true) {
    const profilePage = document.getElementById("profile-page");
    // basically making a request for the body of the profile page
    if (initilaizing) {
        const response = await fetch(`tabs/profile.html`);
        const profileHtml = await response.text();
        // inserts this response
        document.getElementById("profile-page").innerHTML = profileHtml;

        // updates the username, email, and picture to be dynamic from local storage
        profilePage.querySelector(".userName").innerText = localStorage.getItem("userName");
        profilePage.querySelector(".userEmail").innerText = localStorage.getItem("userEmail");
        profilePage.querySelector(".userPic").src = localStorage.getItem("userPic");

    }
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

    // I would hook the confirmation message function here; remember to use await to make it blocking and work

    // delete from local database
    const db = window.globalVariables.db;
    db.exec(`DELETE FROM notes WHERE id = '${messageId}'`);

    // Delete from Firebase
    try {
        await fetch(`https://cmsc447-470ca-default-rtdb.firebaseio.com/notes/${messageId}.json`, {
            method: 'DELETE'
        });
    } catch (error) {
        createMessage("Error deleting from Firebase");
    }

    // you can use create message here to generate a success message, pass in false as the second parameter to show it in green
    // createMessage("write something here", false);
    // Remove from DOM
    targetMessage.remove();
}

/** //this is somewhat psuedo code not real
 async function generateConfirmation(){

    // create a dynamically shown html you can use examples from save.js, you can also show the module overlay

    // promise structure that waits for user input; this is blocking
    const proceed = await new Promise((resolve) => {
        acceptButton.addEventListener("click", () => {
            resolve(true);
        }, { once: true });

        denyButton.addEventListener("click", () => {
            resolve(false);
        }, { once: true });
    });

    // after click hide the html; instead of display none, we can just remove it from the DOM 

    return proceed; (true/ false)
 }
 */