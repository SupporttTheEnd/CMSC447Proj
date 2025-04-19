export function checkClassAvailability() {
    const semesters = {"spring": 0, "summer": 1, "fall": 2, "winter": 3};
    const db = window.globalVariables.db;
    const [_, ...dropzones] = document.querySelectorAll(`#classes .dropzone`);

    // Iterates through each semester in schedule
    dropzones.forEach(dropzone => {
        const courses = dropzone.querySelectorAll('.class-item');

        // Iterates through each course in semester
        courses.forEach(course => {
            const query = `
                SELECT classes.availability
                FROM classes
                WHERE courseId = '${course.id}'
            `;
            const result = db.exec(query);

            if (!result.length) {
                return;
            }

            // Identifies course's availability
            result[0].values.forEach(row => {
                course.dataset.availability = row[0];
            })

            console.log(course)

            const semester = course.parentElement.classList[0];

            // Checks if course is in available semester
            if (course.dataset.availability[semesters[semester]] !== "1") {
                console.log("Course is not in valid semester")
            }
        })
    })
}
