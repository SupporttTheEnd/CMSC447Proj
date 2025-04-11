import { isPlanValid} from './requirements.js';
import { createMessage } from './login.js';

export function downloadScheduleAsPDF() {

    const validation = isPlanValid();
    if (!validation.isValid) {
        createMessage(`The schedule is invalid because: ${validation.reason}`);
        return;
    }
    
    confetti();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    let yOffset = 15;
    doc.addImage('/images/black-header.jpg', 'JPEG', 0, 0, pageWidth, 25);

    doc.setFontSize(25);
    doc.setTextColor(255, 255, 255);
    doc.setFont('times','bold');
    doc.text("Four-Year Academic Pathways Schedule", pageWidth / 2, yOffset, { align: "center" });
    yOffset += 20;

    for (let i = 0; i <= window.globalVariables.years; i++) {
        const yearContainer = document.querySelector(`.container.year-${i}`);
        if (!yearContainer) continue;

        const yearHeader = yearContainer.querySelector(".year-header").textContent.trim();

        const semesters = Array.from(yearContainer.querySelectorAll(".semester-header .semester-item"));
        const semesterCredits = Array.from(yearContainer.querySelectorAll(".semester-credit"));
        const dropzones = Array.from(yearContainer.querySelectorAll(".dropzone"));

        let fullTableBody = [];

        for (let j = 0; j < semesters.length; j++) {
            const semesterName = semesters[j].textContent.trim();
            const credits = semesterCredits[j].textContent.trim().replace(/\(.*?\)/g, "").trim();
            const dropzone = dropzones[j];
            const classes = Array.from(dropzone.querySelectorAll(".class-item"));

            fullTableBody.push([
                {
                    content: `${semesterName}`,
                    styles: {
                        fontStyle: 'bold',
                        textColor: [0, 0, 0],    
                        fillColor: [220, 220, 220]  
                    }
                },
                {
                    content: `${credits} Credits`,
                    styles: {
                        fontStyle: 'bold',
                        textColor: [0, 0, 0],       
                        fillColor: [220, 220, 220]  
                    }
                }
            ]);
            

            for (let k = 0; k < classes.length; k++) {
                let courseName;

                if (classes[k].classList.contains("require-item")) {
                    const selectElement = classes[k].querySelector(".require-select");
                    const selectedOption = selectElement.options[selectElement.selectedIndex];
                    courseName = selectedOption.textContent.trim().split('[')[1] || null;
                } else {
                    courseName = classes[k].querySelector(".course-name").textContent.trim().split('[')[1];
                }
                let credit = classes[k].querySelector(".credits").textContent.trim();

                if (courseName && courseName.includes("]")) {
                    courseName = "[" + courseName;
                    fullTableBody.push([courseName, credit]);
                }
            }
        }

        doc.autoTable({
            showHead: "firstPage",
            startY: yOffset,
            head: [
                [{ content: yearHeader, colSpan: 2, styles: { halign: 'center', fillColor: [0, 0, 0], fontStyle: 'bold', fontSize: 16 } }]
            ],
            body: fullTableBody,
            theme: 'striped',
            styles: {
                fontSize: 10,
                cellPadding: 3
            },
            columnStyles: {
                0: {
                    cellWidth: 120
                },
                1: { 
                    cellWidth: 'auto'
                }
            },
            margin: { left: 10, right: 10 },
            didDrawPage: (data) => {
                yOffset = data.cursor.y + 10;
            },
            didDrawCell: (data) => {
                if (data.section === 'head') {
                    doc.setLineWidth(1); 
                    doc.setDrawColor(255, 193, 7);
                    doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
                }
            }
        });
    }

    const now = new Date();

    doc.save(`Four-Year-Plan-Schedule-${now.toISOString().replace(/[:.]/g, "-")}.pdf`);
}
