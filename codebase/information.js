export function generateInformation(courseId, target) {
    const db = window.globalVariables.db;

    const classQuery = `
    SELECT 
        classes.availability, classes.prerequisites, notes.name, notes.email, notes.notes, notes.score, notes.dateTime
        FROM classes
        LEFT JOIN notes ON classes.courseId = notes.classId
        WHERE classes.courseId = '${courseId}'
    `;

    const classResult = db.exec(classQuery);
    if (!classResult.length || !classResult[0].values.length) {
        return;
    }

    const [availability, prerequisites] = classResult[0].values[0];
    const prereqText = formatPrereq(JSON.parse(prerequisites));
    const availabilityText = formatAvailability(availability);

    const notes = classResult[0].values
        .map(([_, __, name, email, note, score, dateTime]) => ({
            name,
            email,
            note,
            score,
            dateTime: new Date(dateTime)
        }))
        .sort((a, b) => b.dateTime - a.dateTime) 
        .map(note => ({
            ...note,
            dateTime: note.dateTime.toLocaleString() 
        }));

    const averageScore = ((notes.reduce((acc, note) => acc + Number(note.score), 0)) / notes.length).toFixed(1);;

    function createPopup() {
        const popupHTML = `
            <div class="info-popup">
                <strong>Availability:</strong> ${availabilityText}
                <br>
                <strong>Prerequisites:</strong> ${prereqText || "None"}
            </div>
        `;

        const wrapper = document.createElement("div");
        wrapper.innerHTML = popupHTML;
        return wrapper.firstElementChild;
    }

    function createModal() {
        const validNotes = notes.filter(note => note.name && note.email && note.note && note.score && note.dateTime);

        const modalHTML = `
            <div class="info-modal">
                <button id="close-modal" class="close-button">×</button>
                <div class="modal-content">
                    <h2><strong> ${courseId} </strong> Course Information</h2>
                    <hr>
                    <p><strong>Availability:</strong> ${availabilityText}</p>
                    <p><strong>Prerequisites:</strong> ${prereqText || "None"}</p>
                    <h3>Latest Availability Insights</h3>
                    ${validNotes.length > 0 ? 
                        `<p><strong>Average Difficulty (1 = easiest, 10 = hardest):</strong> ${averageScore}</p>` 
                        : ''}
                    <ul>
                    ${validNotes.length > 0 ? validNotes.map(note => `
                        <li>
                            <strong>${note.name}</strong> (${note.email})<br>
                            <em>${note.dateTime}</em><br>
                            <strong>Difficulty:</strong> ${note.score}<br>
                            <p>${note.note}</p>
                        </li>
                    `).join('') : '<li>No messages yet</li>'}
                    </ul>
                </div>
            </div>
        `;

        const wrapper = document.createElement("div");
        wrapper.innerHTML = modalHTML;
        return wrapper.firstElementChild;
    }

    let infoSpan = target.querySelector(".information");

    const newInfoSpan = infoSpan.cloneNode(true);
    infoSpan.parentNode.replaceChild(newInfoSpan, infoSpan);
    infoSpan = newInfoSpan;

    infoSpan.addEventListener("mouseenter", () => {
        const popup = createPopup();

        document.body.appendChild(popup);

        const rect = target.getBoundingClientRect();
        popup.style.left = `${rect.left + 10 + window.scrollX}px`;
        popup.style.top = `${rect.bottom - 10 + window.scrollY}px`;
        popup.style.display = "block";

        infoSpan.addEventListener("mouseleave", () => {
            if (document.body.contains(popup)) {
                popup.style.display = "none";
                document.body.removeChild(popup);
            }
        });
    });

    infoSpan.addEventListener("click", () => {
        const modal = createModal();
        document.body.appendChild(modal);

        // Gray out the background
        document.body.style.overflow = "hidden";
        const overlay = document.createElement("div");
        overlay.className = "modal-overlay";
        document.body.appendChild(overlay);

        // Close modal logic
        document.getElementById("close-modal").addEventListener("click", () => {
            document.body.removeChild(modal);
            document.body.removeChild(overlay);
            document.body.style.overflow = "auto";
        });

        document.querySelector(".modal-overlay").addEventListener("click", () => {
            document.body.removeChild(modal);
            document.body.removeChild(overlay);
            document.body.style.overflow = "auto";
        });
    });
}

function formatPrereq(prereqGroups) {
    const itemCounts = {};
    for (const group of prereqGroups) {
        for (const item of group) {
            itemCounts[item] = (itemCounts[item] || 0) + 1;
        }
    }

    const groupCount = prereqGroups.length;
    const shared = Object.keys(itemCounts).filter(k => itemCounts[k] === groupCount);

    if (shared.length > 0) {
        const remainingGroups = prereqGroups.map(group =>
            group.filter(item => !shared.includes(item))
        );

        const orParts = remainingGroups
            .map(group => group.length === 1 ? group[0] : group.length > 0 ? `(${group.join(' and ')})` : "")
            .filter(part => part !== "");

        const orText = orParts.length > 1 ? `(${orParts.join(' or ')})` : orParts[0];
        return `${shared.join(' and ')}${orText ? ' and ' + orText : ''}`;
    } else {
        return prereqGroups
            .map(group => group.length > 0 ? (group.length === 1 ? group[0] : `(${group.join(' and ')})`) : "")
            .filter(group => group !== "")
            .join(' or ');
    }
}

function formatAvailability(availabilityCode) {
    const seasonNames = ['Spring', 'Summer', 'Fall', 'Winter'];
    return seasonNames
        .filter((_, index) => availabilityCode[index] === '1')
        .join(', ');
}
