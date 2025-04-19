function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('hide');
    if (sidebar.classList.contains('hide')) {
        sidebar.style.top = '20%';
        sidebar.style.left = '0';
    }

    const emptyBtn = document.querySelector('.empty-btn');
    if (emptyBtn) {
        emptyBtn.disabled = true;
        setTimeout(() => {
            emptyBtn.disabled = false;
        }, 700);
    }
}

function emptyBin() {
    const dropzone = $('.sidebar .dropzone');
    dropzone.empty();
}

function switchAccount() {
    document.getElementById("google-login-button")?.children[0]?.children[0]?.children[0]?.click();
}
