// -----------------------------------DARK MODE-------------------------------

const darkModeBtn = document.getElementById("darkModeBtn");

darkModeBtn.onclick = function() {
    //TURN DARK
    if (darkModeBtn.checked) {
        localStorage.setItem('currentTheme', "dark");
        checkTheme();
    }
    //TURN LIGHT
    else {
        localStorage.setItem('currentTheme', "light");
        checkTheme();
    }
};

checkTheme();

function checkTheme() {
    if(localStorage.currentTheme == "light") { setLight(); darkModeBtn.checked = false; }
    else if (localStorage.currentTheme == "dark") { setDark(); darkModeBtn.checked = true; }
    else { setDark(); localStorage.currentTheme = "dark"; darkModeBtn.checked = true; }
}

function setLight() {
    document.documentElement.style.setProperty('--background-color', 'rgb(255, 255, 255)');
    document.documentElement.style.setProperty('--button-color', 'rgb(255,255,255)');
    document.documentElement.style.setProperty('--button-hover-color', 'rgb(220,220,220)');
    document.documentElement.style.setProperty('--button-text-hover', 'rgb(255,255,255)');
    document.documentElement.style.setProperty('--border-color', 'rgb(199,199,199)');
    document.documentElement.style.setProperty('--box-shadow-color', 'rgba(0, 0, 0, 0.1)');
    document.documentElement.style.setProperty('--text-color', 'rgb(0, 0, 0)');
    document.documentElement.style.setProperty('--fill-color', 'rgb(0, 0, 0)');
    document.documentElement.style.setProperty('--progress-background', 'rgb(240, 240, 240)');
    document.documentElement.style.setProperty('--menu-bg-color', 'rgba(80, 80, 80, 0.9)');
    document.documentElement.style.setProperty('--content-div-color', 'rgba(240, 240, 240,0.6)');
    document.documentElement.style.setProperty('--tab-color', 'rgba(220, 220, 220,1)');
    document.documentElement.style.setProperty('--tab-color-hover', 'rgba(210, 210, 210,1)');
    document.documentElement.style.setProperty('--tab-color-active', 'rgba(200, 200, 200,1)');
    document.documentElement.style.setProperty('--tab-active-shadowTop', 'rgba(65, 65, 65, 1)');
    /* document.documentElement.style.setProperty('--tab-active-shadowTop', 'rgba(255, 255, 150, 1)'); */

    localStorage.currentTheme = "light";
};

function setDark() {
    document.documentElement.style.setProperty('--background-color', 'rgb(38,38,38)');
    document.documentElement.style.setProperty('--button-color', 'rgb(38,38,38)');
    document.documentElement.style.setProperty('--button-hover-color', 'rgb(80,80,80)');
    document.documentElement.style.setProperty('--button-text-hover', 'rgb(255,255,255)');
    document.documentElement.style.setProperty('--border-color', 'rgb(199,199,199)');
    document.documentElement.style.setProperty('--box-shadow-color', 'rgba(255, 255, 255, 0.1)');
    document.documentElement.style.setProperty('--text-color', 'rgb(255, 255, 255)');
    document.documentElement.style.setProperty('--fill-color', 'rgb(255, 255, 255)');
    document.documentElement.style.setProperty('--progress-background', 'rgb(119, 119, 119)');
    document.documentElement.style.setProperty('--menu-bg-color', 'rgba(0, 0, 0, 0.9)');
    document.documentElement.style.setProperty('--content-div-color', 'rgb(31, 31, 31)');
    document.documentElement.style.setProperty('--tab-color', 'rgba(65, 65, 65,1)');
    document.documentElement.style.setProperty('--tab-color-hover', 'rgba(82, 82, 82,1)');
    document.documentElement.style.setProperty('--tab-color-active', 'rgba(36, 36, 36,1)');
    document.documentElement.style.setProperty('--tab-active-shadowTop', 'rgba(221, 221, 221, 1)');
    /* document.documentElement.style.setProperty('--tab-active-shadowTop', 'rgba(255, 255, 150, 1)'); */
    
    localStorage.currentTheme = "dark";
};

//-----------------------------------------------------------------------------------------------------------
