export async function main() {
    const userEmail = localStorage.getItem('userEmail');
    const userName = localStorage.getItem('userName');
    const userPic = localStorage.getItem('userPic');
    if (userEmail && userName && userPic) {
        window.globalVariables.account = userEmail;

        document.getElementById("user-email").textContent = "Logged in as: " + userEmail;
        document.getElementById("user-email").style.display = "block";
        document.getElementById("google-login-button").style.display = "none";
        document.getElementById("google-logout-button").style.display = "inline-block";
        document.querySelector('.welcome-text').textContent = `Welcome, ${userName}`;
        document.querySelector('.welcome-text').style.display = "block";
        document.getElementById("user-pic").src = userPic;
    }

    google.accounts.id.initialize({
        client_id: "179938127617-adi0m1qnc6s00j52c1hbd38u0f9t738p.apps.googleusercontent.com",
        callback: handleCredentialResponse
    });

    google.accounts.id.renderButton(
        document.getElementById("google-login-button"),
        { theme: "outline", size: "large" }
    );

    document.getElementById("google-logout-button").addEventListener("click", googleLogout);
    toggleAccountStudentItems();
};

function handleCredentialResponse(response) {
    const userObject = jwt_decode(response.credential);
    const userEmail = userObject.email;
    const userName = userObject.name;
    const userPic = userObject.picture; 

    if (isUMBCStudent(userEmail)) {
        localStorage.setItem('userEmail', userEmail);
        localStorage.setItem('userName', userName);
        localStorage.setItem('userPic', userPic);

        document.getElementById("user-email").textContent = "Logged in as: " + userEmail;
        document.getElementById("user-email").style.display = "block";

        document.getElementById("google-login-button").style.display = "none";
        document.getElementById("google-logout-button").style.display = "inline-block";

        document.querySelector('.welcome-text').textContent = `Hello, ${userName}`;
        document.querySelector('.welcome-text').style.display = "block";

        document.getElementById("user-pic").src = userPic;

        window.globalVariables.account = userEmail;
        toggleAccountStudentItems();
    } else {
        createMessage("You need to be a UMBC student to access this feature.");
        googleLogout();
    }
}

function googleLogout() {
    google.accounts.id.disableAutoSelect();

    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userPic');

    document.getElementById("google-logout-button").style.display = "none";
    document.getElementById("google-login-button").style.display = "inline-block";

    document.getElementById("user-email").style.display = "none";

    document.querySelector('.welcome-text').style.display = "none";

    window.globalVariables.account = null;
    
    toggleAccountStudentItems();
}

function toggleAccountStudentItems() {
    const isLoggedIn = (window.globalVariables.account != null);
    const elements = document.querySelectorAll('.account-student');
    elements.forEach(element => {
        element.style.display = isLoggedIn ? 'unset' : 'none';
    });
}

function isUMBCStudent(email) {
    return email.endsWith("@umbc.edu");
}

export function createMessage(message, isError = true) {
    if(document.querySelector(".alert-toggle input:checked")){
        return;
    }

    const existingMessages = Array.from(document.querySelectorAll('.message-box'));
    
    if (existingMessages.some(msgBox => msgBox.textContent.includes(message))) {
        return;
    }
    
    const messageBox = document.createElement('div');
    messageBox.classList.add('message-box');
    
    if (isError) {
        messageBox.classList.add('error');
    } else {
        messageBox.classList.add('success');
    }
    
    messageBox.textContent = message;
    const closeButton = document.createElement('button');
    closeButton.classList.add('close-button');
    closeButton.textContent = '×';
    closeButton.addEventListener('click', () => {
        messageBox.remove();
    });
    
    messageBox.appendChild(closeButton);
    document.querySelector('.message-container').appendChild(messageBox);

    setTimeout(() => {
        messageBox.classList.add('fade-out');
        setTimeout(() => messageBox.remove(), 500);
    }, 5000);
}
