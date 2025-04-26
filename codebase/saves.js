import { createMessage } from './login.js';
import { generateInformation } from './information.js';
import { dragAndDropEnable, populateClassData, populateRequirementData, updateCredits, clearClasses, generateYears} from './home.js';

export async function main() {
    document.getElementById("save-button").parentElement.addEventListener("click", () => enterSaveData());
    document.getElementById("load-button").parentElement.addEventListener("click", () => loadSaveData());
    document.getElementById("export-button").parentElement.addEventListener("click", () => enterSaveData(true));

    document.getElementById("import-button").parentElement.addEventListener("click", () => {
        document.getElementById("umbc-file-input").click();
    });
    
    document.getElementById("umbc-file-input").addEventListener("change", () => loadSaveData(true));
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
                    semester TEXT,
                    selectedId TEXT
                );
            `);

            if (save.body) {
                save.body.forEach(course => {
                    const selectedId = course.selectedId || null;
                    db.run(`INSERT OR REPLACE INTO ${save.slot} (courseId, year, semester, selectedId) VALUES (?, ?, ?, ?)`,
                        [course.courseId, course.year, course.semester, selectedId]);
                });
            }
        });
    }

    const internalHTML = `
        <div id="save-panel">
            <button id="close-save" class="close-button">×</button>
            <h2>${isSave ? 'Save File <img src="images/icons/save.svg" style="height:40px">' : 'Load File <img src="images/icons/load.svg" style="height:40px">'}</h2>
            <hr>
            <div class="override-warning" style="display:none; margin-bottom: 20px;">
                <span>Are you sure you want to overwrite this save slot?</span>
                <div>
                    <button type="button" id="accept-override-button" class="primary-button btn btn-primary">Yes</button>
                    <button type="button" id="deny-override-button" class="secondary-button btn">No</button>
                </div>
            </div>
            <div class="save-container">
            ${[...Array(12)].map((_, index) => {
                const save = savesData && Object.values(savesData).find(s => s.slot === `slot${index + 1}`);
                const hasDate = save && save.time;
                return `
                    <div class="flex-column justify-content-center align-items-center save-slot-wrapper" style="display: ${index > 5 ? 'none' : 'flex'};">
                        <div class="saveslot ${hasDate ? 'saved' : ''}" data-slot="slot${index + 1}">
                            ${isSave && hasDate ? '<button class="delete-save close-button">×</button>' : '<button class="delete-save close-button" style="display:none">×</button>'}
                            <h5>Slot ${index + 1}</h5>
                            <div class="date-container">
                                ${hasDate ? new Date(save.time).toLocaleString() : "Empty Slot"}
                            </div>
                        </div>
                        <input type="text" placeholder="Enter a note..." style="width:150px" data-slot="slot${index + 1}" value="${save && save.note ? save.note : ''}">
                    </div>
                    `;
            }).join('')}
            </div>
            <div class="d-flex flex-column align-items-center add-line" style="margin-top:30px;">
                <button class="additionSession"></button>
                <p> Show more slots </p>
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

    // Add event listener for "Show More Slots" button
    document.querySelector("#save-panel .additionSession").addEventListener("click", (event) => {
        const button = event.currentTarget;
        if (button.dataset.inserted === "true") {
            document.querySelectorAll(".save-slot-wrapper").forEach((slotElement, index) => {
                if (index > 5) {
                    slotElement.style.display = "none";
                }
            });
            button.dataset.inserted = "false";
            button.nextElementSibling.style.display = "block";
            button.style.backgroundImage = `url('images/plus.png')`;
        } else {
            document.querySelectorAll(".save-slot-wrapper").forEach((slotElement, index) => {
                if (index > 5) {
                    slotElement.style.display = "flex";
                }
            });
            button.nextElementSibling.style.display = "none";
            button.dataset.inserted = "true";
            button.style.backgroundImage = `url('images/minus.png')`;
        }
    });

    // saves your notes 
    document.querySelectorAll("#save-panel input[type='text']").forEach(input => {
        input.addEventListener("change", async (event) => {
            const slot = event.target.dataset.slot;
            const note = event.target.value;

            try {
                await fetch(`https://cmsc447-470ca-default-rtdb.firebaseio.com/accounts/${email}/saves/${slot}.json`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ note, slot })
                });
                createMessage(`Note for slot ${slot.slice(-1)} was saved`, false);
            } catch (error) {
                createMessage("Failed to save note");
            }
        });
    });

    // handles delete
    document.querySelectorAll("#save-panel .saveslot").forEach(slotElement => {
        const deleteButton = slotElement.querySelector(".delete-save");
        if (!deleteButton) return;

        const slot = slotElement.dataset.slot;

        deleteButton.addEventListener("click", async () => {
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

            try {
                await fetch(`https://cmsc447-470ca-default-rtdb.firebaseio.com/accounts/${email}/saves/${slot}.json`, {
                    method: 'DELETE'
                });

                createMessage(`Save slot ${slot.slice(-1)} was successfully deleted.`, false);
                slotElement.querySelector(".date-container").textContent = "Empty Slot";
                slotElement.classList.remove("saved");
                slotElement.parentElement.querySelector("input[type='text']").value = "";
                deleteButton.style.display = "none";
            } catch (error) {
                createMessage("Failed to delete save slot", true);
            }
        });
    });

    // handles close
    function closeModal() {
        document.body.removeChild(wrapper);
        document.body.removeChild(overlay);
        document.body.style.overflow = "auto";
    }
}

async function enterSaveData(isFile = false) {
    if(!isFile){
        await createInterface(true);
    }
        
    let classesArray = [];

    for (let i = 0; i <= window.globalVariables.years; i++) {
        const yearContainer = document.querySelector(`.container.year-${i}`);
        if (!yearContainer) continue;

        Array.from(yearContainer.querySelectorAll(".dropzone")).forEach(dropzone => {
            Array.from(dropzone.querySelectorAll(".class-item")).forEach(course => {
                const year = i;
                const semester = course.parentElement.classList[0];
                let courseId; 
                if (course.classList.contains("require-item")) {
                    courseId = course.dataset.requirement;
                    const selectedId = course.id;
                    classesArray.push({ year, semester, courseId, selectedId});
                }
                else{
                    courseId = course.id;
                    classesArray.push({ year, semester, courseId });
                }
            });
        });
    }


    if (isFile) {
        if (classesArray.length == 0) {
            createMessage(`Export failed; no classes detected.`, true);
            return;
        }
        
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, "-")
        const filename = `fyp-${timestamp}.umbc`;
    
        const json = JSON.stringify(classesArray, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
    
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a); 
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // attaches listeners to save
    document.querySelectorAll("#save-panel .saveslot").forEach(slotElement => {
        const warning = document.querySelector("#save-panel .override-warning");
        warning.style.display = "none";

        slotElement.addEventListener("click", async (event) => {
            if (event.target.classList.contains("delete-save")) return;

            if (classesArray.length == 0) {
                createMessage("Save failed; no classes detected.", true);
                return;
            }

            // if overriding
            if (!slotElement.querySelector(".date-container").textContent.includes("Empty Slot")) {
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
                    method: 'PATCH',  
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(dataWrapper)
                });

                createMessage(`Your save was successfully logged.`, false);
                slotElement.querySelector(".date-container").innerHTML = new Date(time).toLocaleString();
                slotElement.classList.add("saved");
                const deleteButton = slotElement.querySelector(".delete-save");
                deleteButton.style.display = "block";
            } catch (error) {
                createMessage("Something went wrong with your save", true);
            }
        });
    });
}

async function loadSaveData(isFile = false) {
    if(!isFile) {
        await createInterface(false);
    }
    const db = window.globalVariables.db;

    if(isFile) {
        const file = document.getElementById("umbc-file-input").files[0];
        if (!file) {
            createMessage("No file selected");
            return;
        }
        try {
            const reader = new FileReader();
            reader.onload = async function(e) {
                const classesArray = JSON.parse(e.target.result);
                const table = "tempImport_" + Date.now();
                db.run(`CREATE TABLE ${table} (
                    courseId TEXT,
                    year INTEGER,
                    semester TEXT,
                    selectedId TEXT
                );`);
                
                classesArray.forEach(course => {
                    const selectedId = course.selectedId || null;
                    db.run(`INSERT INTO ${table} (courseId, year, semester, selectedId) VALUES (?, ?, ?, ?)`,
                        [course.courseId, course.year, course.semester, selectedId]);
                });

                createMessage(`File successfully imported.`, false);

                await populateSchedule(table);
                db.run(`DROP TABLE ${table};`);
            };
            reader.readAsText(file);
        } catch (error) {
            createMessage("Error reading file");
        }
    }

    document.querySelectorAll("#save-panel .saveslot").forEach(slotElement => {
        slotElement.addEventListener("click", async () => {
            if (slotElement && slotElement.querySelector(".date-container").textContent.includes("Empty Slot")) {
                return; 
            }
            const slot = slotElement.dataset.slot;
            createMessage(`Save slot ${slot.slice(-1)} successfully loaded.`, false);
            await populateSchedule(slot)
        });
    });
}

async function populateSchedule(slot) {
    const db = window.globalVariables.db;
    let result = db.exec(`
        SELECT MAX(year) as highestYear
        FROM ${slot};
    `);

    let highestYear;
    if (result.length > 0 && result[0].values.length > 0) {
        highestYear = result[0].values[0][0];
    }

    while (window.globalVariables.years < highestYear){
        generateYears(true);
    }

    result = db.exec(`
        SELECT year, semester
        FROM ${slot}
        WHERE semester = 'winter' OR semester = 'summer'
    `);

    if (result.length) {
        const selectedData = result[0].values.map(row => {
            return {
                year: row[0],
                semester: row[1],
            };
        });
        selectedData.forEach((selection) => {
            if (!document.querySelector(`.year-${selection.year} .${selection.semester}.dropzone`)) {
                const additionButton = document.querySelector(`.year-${selection.year} .additionSession`);
                if (additionButton) {
                    additionButton.click();
                }
            }
        });
    }

    clearClasses();
    populateClassData(slot);
    populateRequirementData(slot);
    
    result = db.exec(`
        SELECT year, semester, courseId, selectedId
        FROM ${slot}
        WHERE selectedId IS NOT NULL;
    `);

    // select saved options for requirements 
    if (result.length) {
        const selectedData = result[0].values.map(row => {
            return {
                year: row[0],
                semester: row[1],
                courseId: row[2],
                selectedId: row[3]
            };
        });

        selectedData.forEach((selection) => {
            const requireDivs = document.querySelectorAll(`.year-${selection.year} .${selection.semester}.dropzone .require-item[data-requirement="${selection.courseId}"]`);
        
            let selectedRequireDiv = null;
        
            requireDivs.forEach((requireDiv) => {
                const credits = requireDiv.querySelector('.credits');

                if (credits && credits.textContent.includes("0")) {
                    selectedRequireDiv = requireDiv; 
                    return; 
                }
            });
            
            if (selectedRequireDiv) {
                const selectElement = selectedRequireDiv.querySelector('.require-select');
                selectElement.value = selection.selectedId;

                const selectedOption = selectElement.options[selectElement.selectedIndex];
                selectedRequireDiv.id = selectedOption.value;
                
                selectedRequireDiv.querySelector('.credits').textContent = `${selectedOption.dataset.credits} Credits`;

                generateInformation(selectedOption.value, selectedRequireDiv);
            }
        });
    }

    dragAndDropEnable();
    updateCredits();
}