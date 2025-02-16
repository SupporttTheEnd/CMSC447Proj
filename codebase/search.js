export async function main() {
    loadSearchItems();
}

function loadSearchItems() {
    const db = window.globalVariables.db;

    const classResults = db.exec("SELECT courseId, name FROM classes");

    if (classResults.length === 0) {
        console.error("No data found in the database.");
        return;
    }

    const formattedData = classResults[0].values.map(row => ({
        id: row[0],
        text: `[${row[0]}] ${row[1]}`
    }));

    $('#class-search').select2({
        data: formattedData,
        width: '400px',
        placeholder: "Search for a class...",
        allowClear: true
    });
}
