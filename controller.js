let map = document.getElementById('map');
let isMouseDown = false;
let offset = { x: 0, y: 0 };
let currentTransform = { x: 0, y: 0 };

map.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    offset.x = e.clientX;
    offset.y = e.clientY;
    map.style.cursor = 'grabbing';
});

map.addEventListener('mousemove', (e) => {
    if (isMouseDown) {
        // Track the movement but do not apply transformations yet
        let dx = e.clientX - offset.x;
        let dy = e.clientY - offset.y;

        currentTransform.x += dx;
        currentTransform.y += dy;

        // Update the offset for the next frame
        offset.x = e.clientX;
        offset.y = e.clientY;
    }
});

map.addEventListener('mouseup', () => {
    if (isMouseDown) {
        // Apply the final transformation after mouseup
        map.style.transition = 'transform 0.3s ease';  // Smooth transition
        map.style.transform = `translate(${currentTransform.x}px, ${currentTransform.y}px)`;
        isMouseDown = false;
        map.style.cursor = 'grab';
    }
});

map.addEventListener('mouseleave', () => {
    if (isMouseDown) {
        // In case the mouse leaves the map during the drag, stop dragging
        isMouseDown = false;
        map.style.cursor = 'grab';
    }
});
