document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const iframe = document.getElementById('cracker-frame');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all
            navItems.forEach(nav => nav.classList.remove('active'));
            // Add active class to clicked
            item.classList.add('active');
            
            // Update iframe source
            const targetUrl = item.getAttribute('data-target');
            if(targetUrl) {
                iframe.src = targetUrl;
            }
        });
    });
});
