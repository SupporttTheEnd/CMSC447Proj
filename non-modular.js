function handleAdditionalSessions(button) {
    if (button.dataset.inserted === "true") {
        const fallBox = button.closest('.container').querySelector('.fall.dropzone');
        const springBox = button.closest('.container').querySelector('.spring.dropzone');

        const winterClasses = button.closest('.container').querySelectorAll('.winter .class-item');
        const summerClasses = button.closest('.container').querySelectorAll('.summer .class-item');

        winterClasses.forEach((classItem) => {
            fallBox.appendChild(classItem);
        });

        summerClasses.forEach((classItem) => {
            springBox.appendChild(classItem);
        });

        button.closest(".container").querySelector(".new-boxes").remove();
        button.dataset.inserted = "false";
        button.nextElementSibling.style.display = "block";
        button.style.backgroundImage = `url('images/plus.png')`;
    } else {
        button.parentElement.insertAdjacentHTML("afterend", `
            <div class="new-boxes"> 
                <div class="semester-header d-flex">
                    <div class="semester-item">Winter Semester</div>
                    <div class="winter semester-item">Credits</div>
                    <hr class="divider">
                    <div class="semester-item">Summer Semester</div>
                    <div class="summer semester-item">Credits</div>
                </div>

                <div class="d-flex">
                    <div class = "winter w-50 border p-2 dropzone"></div>
                    <div class = "summer w-50 border p-2 dropzone"></div>
                </div>
            </div>
        `);

        button.nextElementSibling.style.display = "none";
        button.dataset.inserted = "true";
        button.style.backgroundImage = `url('images/minus.png')`;

        dragAndDropEnable();
    }
    updateCredits();
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('hide');
    if (sidebar.classList.contains('hide')) {
        sidebar.style.top = '20%';
        sidebar.style.left = '0';
    }
}
