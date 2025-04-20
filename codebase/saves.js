import { createMessage } from './login.js';
import { dragAndDropEnable, populateClassData, populateRequirementData, updateCredits, clearClasses} from './home.js';

export async function main() {
    document.getElementById("save-button").addEventListener("click", enterSaveData);
    document.getElementById("load-button").addEventListener("click", loadSaveData);
}

async function createInterface(isSave) {
    const db = window.globalVariables.db;
    const email = document.querySelector("#user-email").textContent.split("@")[0].split(":")[1];
    const savesResponse = await fetch(`https://cmsc447-470ca-default-rtdb.firebaseio.com/accounts/${email}/saves.json`);
    const savesData = await savesResponse.json();

    if (savesData) {
        Object.values(savesData).forEach(save => {
            db.run(`DROP TABLE IF EXISTS ${save.slot};`);

            db.run(`
                CREATE TABLE ${save.slot} (
                    courseId TEXT,
                    year INTEGER,
                    semester TEXT
                );
            `);

            save.body.forEach(course => {
                db.run(`INSERT OR REPLACE INTO ${save.slot} (courseId, year, semester) VALUES (?, ?, ?)`,
                    [course.courseId, course.year, course.semester]);
            });
        });
    }

    const internalHTML = `
        <div id="save-panel">
            <button id="close-save" class="close-button">×</button>
            <h2>${isSave ? "Save File" : "Load File"}</h2>
            <hr>
            <div class="save-container">
            ${[...Array(6)].map((_, index) => {
                const save = savesData && Object.values(savesData).find(s => s.slot === `slot${index + 1}`);
                return `
                    <div class="saveslot" data-slot="slot${index + 1}">
                        <h5>Slot ${index + 1}</h5>
                        <div class="date-container">
                            ${save && save.time ? new Date(save.time).toLocaleString() : "Empty Slot"}
                        </div>
                    </div>
                    `;
            }).join('')}
            </div>
            <div class="override-warning" style="display:none;">
                <span>Are you sure you want to overwrite this save slot?</span>
                <div>
                    <button type="button" id="accept-override-button" class="primary-button btn btn-primary">Yes</button>
                    <button type="button" id="deny-override-button" class="secondary-button btn">No</button>
                </div>
            </div>
        </div>
    `;

    const wrapper = document.createElement("div");
    wrapper.innerHTML = internalHTML;
    document.body.appendChild(wrapper);

    document.body.style.overflow = "hidden";
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    document.body.appendChild(overlay);

    document.getElementById("close-save").addEventListener("click", closeModal);
    document.querySelector(".modal-overlay").addEventListener("click", closeModal);

    function closeModal() {
        document.body.removeChild(wrapper);
        document.body.removeChild(overlay);
        document.body.style.overflow = "auto";
    }
}

async function enterSaveData() {
    await createInterface(true);
    let classesArray = [];
    for (let i = 0; i <= window.globalVariables.years; i++) {
        const yearContainer = document.querySelector(`.container.year-${i}`);
        if (!yearContainer) continue;

        Array.from(yearContainer.querySelectorAll(".dropzone")).forEach(dropzone => {
            Array.from(dropzone.querySelectorAll(".class-item")).forEach(course => {
                const year = i;
                const semester = course.parentElement.classList[0];
                const courseId = course.id;
                classesArray.push({ year, semester, courseId });
            });
        });
    }

    document.querySelectorAll("#save-panel .saveslot").forEach(slotElement => {
        slotElement.addEventListener("click", async () => {
            if (classesArray.length == 0) {
                createMessage("Save failed; no classes detected.", true);
                return;
            }

            if (!slotElement.querySelector(".date-container").textContent.includes("Empty Slot")) {
                const warning = document.querySelector("#save-panel .override-warning");
                warning.style.display = "block";

                const acceptButton = document.getElementById("accept-override-button");
                const denyButton = document.getElementById("deny-override-button");

                const proceed = await new Promise((resolve) => {
                    acceptButton.addEventListener("click", () => {
                        warning.style.display = "none";
                        resolve(true);
                    }, { once: true });

                    denyButton.addEventListener("click", () => {
                        warning.style.display = "none";
                        resolve(false);
                    }, { once: true });
                });

                if (!proceed) return;
            }

            const slot = slotElement.dataset.slot;
            const time = new Date().toISOString();
            const email = document.querySelector("#user-email").textContent.split("@")[0].split(":")[1];

            let dataWrapper = {
                body: classesArray,
                time: time,
                user: email,
                slot: slot
            };

            try {
                await fetch(`https://cmsc447-470ca-default-rtdb.firebaseio.com/accounts/${email}/saves/${slot}.json`, {
                    method: 'PUT',  
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(dataWrapper)
                });

                createMessage(`Your save was successfully logged.`, false);
            } catch (error) {
                createMessage("Something went wrong with your save", true);
            }

            slotElement.querySelector(".date-container").innerHTML = new Date(time).toLocaleString();
        });
    });
}

async function loadSaveData() {
    await createInterface(false);
    document.querySelectorAll("#save-panel .saveslot").forEach(slotElement => {
        slotElement.addEventListener("click", async () => {
            const slot = slotElement.dataset.slot;
            clearClasses();
            populateClassData(slot);
            createMessage(`Save slot ${slot.slice(-1)} successfully loaded.`, false);
            dragAndDropEnable();
            updateCredits();
        });
    });
}
