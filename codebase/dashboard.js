export function updateDashboard() {
    const classesArray = [];
    const creditMap = {};

    for (let i = 0; i <= window.globalVariables.years; i++) {
        const yearContainer = document.querySelector(`.container.year-${i}`);
        if (!yearContainer) continue;

        const dropzones = yearContainer.querySelectorAll(".dropzone");
        dropzones.forEach(dropzone => {
            const semester = dropzone.classList[0];

            dropzone.querySelectorAll(".class-item").forEach(course => {
                const credit = parseInt(course.querySelector(".credits").textContent.trim());
                if (!credit) return;

                const courseId = course.id.split(/\d/)[0];
                if (!courseId) return;

                creditMap[courseId] = (creditMap[courseId] || 0) + credit;
                if (i > 0) {
                    classesArray.push({ year: i, semester, credit });
                }
            });
        });
    }

    createBar(classesArray);
    createDonut(creditMap);
    createText(classesArray, creditMap);
}

function createBar(classesArray) {
    const canvas = document.getElementById('bar-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Destroy existing chart if it exists
    if (window.barChart) window.barChart.destroy();

    const years = [...new Set(classesArray.map(c => c.year))].sort();
    const semesters = ['spring', 'summer', 'fall', 'winter'];
    const semesterColors = {
        spring: 'rgba(152, 251, 152, 0.8)',  // PaleGreen with 80% opacity
        summer: 'rgba(255, 215, 0, 0.8)',    // Gold with 80% opacity
        fall: 'rgba(255, 140, 0, 0.8)',    // DarkOrange with 80% opacity
        winter: 'rgba(135, 206, 235, 0.8)'   // SkyBlue with 80% opacity
    };

    const dataBySemester = semesters.map(semester => {
        const data = years.map(year =>
            classesArray
                .filter(c => c.year === year && c.semester === semester)
                .reduce((sum, c) => sum + c.credit, 0)
        );

        // Only include semesters that have data
        if (data.every(v => v === 0)) return null;

        return {
            label: semester.charAt(0).toUpperCase() + semester.slice(1),
            data,
            backgroundColor: semesterColors[semester]
        };
    }).filter(Boolean);

    window.barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: years.map(y => `Year ${y}`),
            datasets: dataBySemester
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Credits by Year and Semester',
                    font: {
                        size: 20,
                        weight: 'bold'
                    }
                },
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    min: 0,
                    suggestedMax: 40,
                    title: {
                        display: true,
                        text: 'Credits',
                    }
                }
            }
        },
        plugins: [{
            id: 'dottedLine30Credits',
            afterDraw(chart) {
                const yValue = 30;
                const yScale = chart.scales.y;
                const y = yScale.getPixelForValue(yValue);

                const ctx = chart.ctx;
                ctx.save();
                ctx.beginPath();
                ctx.setLineDash([5, 5]);
                ctx.moveTo(chart.chartArea.left, y);
                ctx.lineTo(chart.chartArea.right, y);
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.restore();
            }
        }]
    });
}

function createDonut(creditMap) {
    const labels = Object.keys(creditMap);
    const data = Object.values(creditMap);
    const totalCreditsUsed = data.reduce((sum, val) => sum + val, 0);

    if (totalCreditsUsed < 120) {
        labels.push('Remaining');
        data.push(120 - totalCreditsUsed);
    }

    // Prepare canvas
    const ctx = document.getElementById('donut-chart').getContext('2d');
    if (window.creditChart) window.creditChart.destroy();

    // Custom center plugin
    const centerTextPlugin = {
        id: 'doughnutCenterText',
        beforeDraw(chart) {
            const { width, height, ctx } = chart;
            ctx.save();
            ctx.font = 'bold 16px sans-serif';
            ctx.fillStyle = '#333';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const percent = ((totalCreditsUsed / 120) * 100).toFixed(0);
            ctx.fillText(`${totalCreditsUsed}/120 Credits`, width / 2, height / 2 - 10);
            ctx.fillText(`${percent}% Completed`, width / 2, height / 2 + 12);
            ctx.restore();
        }
    };

    // Draw chart
    window.creditChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: labels.map((label, index) => {
                    if (label === 'Remaining') {
                        return '#ddd';
                    }

                    const colors = [
                        '#FAD78F',
                        '#F8CD73',
                        '#F9C25C',
                        '#E8A944',
                        '#CA7100',
                        '#B85C00',
                        '#D45500',
                        '#B24100',
                        '#9E3000',
                        '#841D08',
                        '#6A0D0D',
                        '#54102E',
                        '#3B0A45',
                        '#290D39',
                        '#1A0B2B',
                        '#0D0A17',
                        '#000000'
                    ];

                    return colors[index % colors.length]; // Cycle through colors
                })
            }]
        },
        options: {
            cutout: '70%',
            plugins: {
                datalabels: {
                    color: '#fff',
                    formatter: (value, ctx) => {
                        const percent = ((value / 120) * 100);
                        return `${percent.toFixed(0)}%`;
                    }
                },
                doughnutCenterText: true,
                title: {
                    display: true,
                    text: `Credits by Course Type`,
                    font: {
                        size: 20,
                        weight: 'bold'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (tooltipItem) => {
                            const credits = tooltipItem.raw;
                            const percent = ((credits / 120) * 100).toFixed(1);
                            return `${credits} credits (${percent}%)`; // Display credits and percentage
                        }
                    }
                },
                legend: {
                    position: 'bottom'
                }
            }
        },
        plugins: [centerTextPlugin, window.ChartDataLabels]
    });
}

function createText(classesArray, creditMap) {
    const selectedMajors = Array.from(document.getElementById("major").selectedOptions)
        .map(option => option.text);
    const selectedMinors = Array.from(document.getElementById("minor").selectedOptions)
        .map(option => option.text);

    const totalCredits = Object.values(creditMap).reduce((sum, val) => sum + val, 0);
    const maxYears = classesArray.length > 0 ? Math.max(...(classesArray.map(c => c.year))) : 0;
    const semesters = Array.from(new Set(classesArray.map(c => c.semester)));

    document.querySelector(".credit-distribution").innerHTML = `
        This graphic shows the distribution of credits across different categories. It helps you
        understand how your total credit hours are spread out over various subjects.
        <hr>
        <h5>Selected Majors:</h6>
        ${selectedMajors.length > 0 ? 
        `<ul>
            ${selectedMajors.map(major => `<li>${major}</li>`).join('')}
        </ul>` :
        `<ul>
            <p>None selected</p>
        </ul>`}
        
        <h5>Selected Minors:</h6>
        ${selectedMinors.length > 0 ? 
        `<ul>
            ${selectedMinors.map(minor => `<li>${minor}</li>`).join('')}
        </ul>` :
        `<ul>
            <p>None selected</p>
        </ul>`}
        <hr>
        You are taking <strong>${selectedMajors.length} major${selectedMajors.length != 1 ? 's' : ''} </strong>
        and <strong> ${selectedMinors.length} minor${selectedMinors.length != 1 ? 's' : ''}</strong>, 
        ${(() => {
            if (selectedMajors.length === 0) return "choose a major to get started!";
            else if (selectedMajors.length > 2) return "pursuing multiple majors represents a significant academic commitment that may extend your time to graduation.";
            else if (selectedMajors.length > 3) return "consider consulting with an academic advisor about managing this substantial course load across multiple disciplines.";
            else if (selectedMinors.length === 0) return "consider adding a minor to enhance your degree.";
            else if (selectedMinors.length > 2) return "balancing multiple minors alongside your major(s) requires careful planning.";
            else if (selectedMinors.length > 3) return "this number of minors may increase your academic workload considerably - consulting with an advisor is recommended.";
            else if (selectedMajors.length >= 1 && selectedMinors.length >= 1) return "you're building a well-rounded academic profile.";
            else return "you're on your way to completing your academic requirements.";
        })()}
        <br>
        Your schedule has a total of <strong>${totalCredits} credits </strong>
        across <strong>${Object.keys(creditMap).length} disciplines</strong>; 
        ${(() => {
            if (totalCredits < 30) return "you're just getting started with your academic journey.";
            else if (totalCredits < 60) return "you're making progress toward your degree requirements.";
            else if (totalCredits < 90) return "you've reached the halfway point in your academic program.";
            else if (totalCredits < 120) return "you're approaching graduation requirements.";
            else return "you've met or exceeded the typical credit requirements for graduation!";
        })()}
    `;

    document.querySelector(".credit-by-year").innerHTML = `
        This chart illustrates the total number of credits accumulated per academic year. Tracking your
        credits each year is crucial for making sure you're on pace to graduate within your intended
        timeline.
        <br>
        Each year, 30 credits is a good goal to aim for if you want to graduate in 4 years. This means
        taking roughly 15 credits per semester if you are only taking spring and fall semesters.
        <hr>
        Your academic journey is expected to take <strong>${maxYears} </strong> years, and you are taking classes during <strong>
        ${(() => {
            if (semesters.length === 0) return "no";
            if (semesters.length === 1) return semesters[0];
            return semesters.slice(0, -1).join(", ") + " and " + semesters.slice(-1);
        })()}
        </strong> semesters.
        <br>
        ${(() => {
            if (semesters.includes("winter") && semesters.includes("summer")) return "Good job; taking winter and summer courses can help you complete your degree faster.";
            if (semesters.includes("winter")) return "Good job; taking winter courses can help you complete your degree faster, consider taking summer courses as well.";
            if (semesters.includes("summer")) return "Good job; taking summer courses can help you complete your degree faster, consider taking winter courses as well.";
            else return "Consider taking a winter or summer course.";
        })()}
    `;
}