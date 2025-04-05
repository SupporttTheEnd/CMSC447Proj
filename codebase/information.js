export function generateInformation(prereqs, availability, target) {
    const prereqText = formatPrereq(JSON.parse(prereqs));
    const availabilityText = formatAvailability(availability);

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

    let infoSpan = target.querySelector(".information");

    const newInfoSpan = infoSpan.cloneNode(true);
    infoSpan.parentNode.replaceChild(newInfoSpan, infoSpan);
    infoSpan = newInfoSpan;

    infoSpan.addEventListener("mouseenter", () => {
        const popup = createPopup(); 

        document.body.appendChild(popup); 

        const rect = target.getBoundingClientRect();
        popup.style.left = `${rect.left + 10 + window.scrollX}px`;
        popup.style.top = `${rect.bottom + 10 + window.scrollY}px`;
        popup.style.display = "block";

        infoSpan.addEventListener("mouseleave", () => {
            if (document.body.contains(popup)) {
                popup.style.display = "none";
                document.body.removeChild(popup);
            }
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
