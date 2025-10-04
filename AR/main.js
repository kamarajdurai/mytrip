
document.addEventListener('DOMContentLoaded', function() {
    const navbar = document.querySelector('.navbar');

    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        if (window.scrollY > 500) {
            navbar.classList.add('navbar-hidden');
        } else {
            navbar.classList.remove('navbar-hidden');
        }
    });

    // Side menu toggle
    const menuButton = document.getElementById('menuButton');
    const sideMenu = document.getElementById('sideMenu');
    
    menuButton.addEventListener('click', function(e) {
        e.stopPropagation();
        document.body.classList.toggle('menu-open');
        sideMenu.classList.toggle('open');
    });

    // Close menu when clicking outside
    document.addEventListener('click', function() {
        if (sideMenu.classList.contains('open')) {
            document.body.classList.remove('menu-open');
            sideMenu.classList.remove('open');
        }
    });

    // Prevent menu from closing when clicking inside
    sideMenu.addEventListener('click', function(e) {
        e.stopPropagation();
    });

})

  
  