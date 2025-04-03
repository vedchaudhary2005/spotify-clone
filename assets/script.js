let currentSong = new Audio();
let songs = [];
let currFolder = "ncs"; // Default folder
let isMenuOpen = false;
let userInteracted = false; // Flag to track user interaction

// Format time function for song duration
function formatTime(seconds) {
    if (isNaN(seconds)) return "00:00";
    let minutes = Math.floor(seconds / 60);
    let secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Folders for each card
const folderMapping = [
    "fun", // First card folder
    "ncs",   // Second card folder
    "sad",   // Third card folder
    "lofi",   // Fourth card folder
    "arjit", //fifth folder
    "darshan",//Sixth Folder
    "krishna"   //seventh Folder
];

// Fetch songs from the selected folder
async function getSongs(folder) {
    currFolder = folder;
    try {
        const response = await fetch(`http://192.168.29.129:3000/assets/songs/${folder}/`);
        if (response.status === 404) {
            console.error(`Folder not found: ${folder}`);
            return [];
        }

        const html = await response.text();
        const div = document.createElement("div");
        div.innerHTML = html;
        const links = div.getElementsByTagName("a");

        const songsList = [];
        for (const link of links) {
            if (link.href.endsWith(".mp3")) {
                const songName = decodeURIComponent(link.href.split(`/${folder}/`)[1]);
                if (songName) {
                    songsList.push(songName);
                }
            }
        }
        return songsList;
    } catch (err) {
        console.error("Error fetching songs:", err);
        return [];
    }
}

// Play the selected song
const playMusic = (track, pause = false) => {
    if (!track) {
        console.error("No track provided to play");
        return;
    }
    
    // Update source with full URL path
    currentSong.src = `http://192.168.29.129:3000/assets/songs/${currFolder}/${track}`;
    
    // Update song info display
    const songInfoElement = document.querySelector(".songinfo");
    if (songInfoElement) {
        songInfoElement.innerHTML = track.replaceAll("%20", " ");
    }
    
    // Only attempt to play if user has interacted or if we're not pausing
    if (!pause && (userInteracted || document.getElementById("play").src.includes("pause.svg"))) {
        currentSong.play()
            .then(() => {
                console.log("Playing:", track);
                const playButton = document.querySelector("#play");
                if (playButton) {
                    playButton.src = "pause.svg";
                }
            })
            .catch((error) => {
                console.error("Play failed:", error);
                const playButton = document.querySelector("#play");
                if (playButton) {
                    playButton.src = "play.svg";
                }
            });
    }
};

// Hamburger menu toggle function
const toggleHamburger = () => {
    const sidebar = document.querySelector(".left");
    if (sidebar) {
        if (isMenuOpen) {
            sidebar.style.left = "-100%";  // Close the sidebar
            isMenuOpen = false;
        } else {
            sidebar.style.left = "0";  // Open the sidebar
            isMenuOpen = true;
        }
    }
};

document.addEventListener("DOMContentLoaded", async function () {
    // Flag for user interaction on any click
    document.addEventListener("click", () => {
        userInteracted = true;
    }, { once: true });
    
    // Initialize hamburger menu
    const hamburger = document.querySelector(".hamburger");
    const closeMenu = document.querySelector(".close");
    const leftMenu = document.querySelector(".left");

    // Hamburger button click event
    if (hamburger) {
        hamburger.addEventListener("click", () => {
            toggleHamburger();
        });
    }
    
    // Close button click event
    if (closeMenu) {
        closeMenu.addEventListener("click", () => {
            toggleHamburger();
        });
    }
    
    // Close the menu if clicked outside of the sidebar or hamburger
    document.addEventListener("click", (e) => {
        if (isMenuOpen && leftMenu && !leftMenu.contains(e.target) && hamburger && !hamburger.contains(e.target)) {
            leftMenu.style.left = "-100%";  // Close sidebar
            isMenuOpen = false;
        }
    });
    
    // Load default songs first
    songs = await getSongs(currFolder);
    showSongsInList(songs);
    
    // Add click events to all cards with visual feedback
    const cards = document.querySelectorAll(".card");
    cards.forEach((card, index) => {
        card.addEventListener("click", async () => {
            // Add active class to this card and remove from others
            cards.forEach(c => c.classList.remove("active"));
            card.classList.add("active");
            
            // Get the folder for this card
            const folder = folderMapping[index] || "ncs";
            console.log(`Switching to folder: ${folder}`);
            
            // Load and play songs from this folder
            songs = await getSongs(folder);
            showSongsInList(songs) // is line ko remove krna ho sakta h
            if (songs.length > 0) {
                playMusic(songs[0], !userInteracted);
                showSongsInList(songs);
            } else {
                console.log(`No songs found in folder: ${folder}`);
                document.querySelector(".songlist ul").innerHTML = "<li>No songs found in this folder</li>";
            }
        });
    });
    
    // Initialize controls
    setupAudioControls();
});

// Show songs in the list based on current array
function showSongsInList(songsList) {          
    const songUL = document.querySelector(".songlist ul");
    if (!songUL) return;
    
    songUL.innerHTML = ""; // Clear previous songs

    songsList.forEach(song => {
        const displayName = song.replaceAll("%20", " ");
        songUL.innerHTML += `
            <li>
                <img class="invert" src="music.svg" alt="">
                <div class="info">
                    <div><p>${displayName}</p></div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img class="invert" src="play.svg" alt="">
                </div>
            </li>`;
    });

    // Add click event to each song in the list
    Array.from(document.querySelectorAll(".songlist li")).forEach((e, index) => {
        e.addEventListener("click", () => {
            if (index < songsList.length) {
                playMusic(songsList[index]);
            }
        });
    });
}

// Setup audio controls
function setupAudioControls() {
    // Handle next song click
    const nextButton = document.querySelector("#next");
    if (nextButton) {
        nextButton.addEventListener("click", () => {
            if (!songs || songs.length === 0) return;
            
            let currentIndex = getCurrentSongIndex();
            
            if (currentIndex !== -1 && currentIndex + 1 < songs.length) {
                playMusic(songs[currentIndex + 1]);
            } else {
                // If current song not found or at end, play the first song (loop)
                playMusic(songs[0]);
            }
        });
    }

    // Handle previous song click
    const prevButton = document.querySelector("#prev");
    if (prevButton) {
        prevButton.addEventListener("click", () => {
            if (!songs || songs.length === 0) return;
            
            let currentIndex = getCurrentSongIndex();
            
            if (currentIndex > 0) {
                playMusic(songs[currentIndex - 1]);
            } else if (currentIndex === 0) {
                // If at first song, go to last song
                playMusic(songs[songs.length - 1]);
            } else {
                // If current song not found, play the first song
                playMusic(songs[0]);
            }
        });
    }

    // Play or pause the song
    const playButton = document.querySelector("#play");
    if (playButton) {
        playButton.addEventListener("click", () => {
            userInteracted = true; // User has interacted
            
            if (currentSong.paused) {
                currentSong.play()
                    .then(() => {
                        playButton.src = "pause.svg";
                    })
                    .catch(error => {
                        console.error("Play failed:", error);
                    });
            } else {
                currentSong.pause();
                playButton.src = "play.svg";
            }
        });
    }

    // Update song time
    currentSong.addEventListener("timeupdate", () => {
        const songTimeElement = document.querySelector(".songtime");
        const circleElement = document.querySelector(".circle");
        
        if (songTimeElement) {
            songTimeElement.innerHTML = `${formatTime(currentSong.currentTime)}/${formatTime(currentSong.duration)}`;
        }
        
        if (circleElement && !isNaN(currentSong.duration) && currentSong.duration > 0) {
            circleElement.style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
        }
    });

    // Seek to a specific time in the song when click on the ick=
    const seekbar = document.querySelector(".seekbar");
    if (seekbar) {
        seekbar.addEventListener("click", (e) => {
            const percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
            const circleElement = document.querySelector(".circle");
            
            if (circleElement) {
                circleElement.style.left = percent + "%";
            }
            
            if (!isNaN(currentSong.duration) && currentSong.duration > 0) {
                currentSong.currentTime = (currentSong.duration) * percent / 100;
            }
        });
    }

    // Adjust volume seekbar when click or release 
    const volumeSlider = document.querySelector(".range input");
    if (volumeSlider) {
        volumeSlider.addEventListener("change", (e) => {
            currentSong.volume = parseInt(e.target.value) / 100;
        });
    }
    
    // Handle song ending
    currentSong.addEventListener("ended", () => {
        let currentIndex = getCurrentSongIndex();
        
        if (currentIndex !== -1 && currentIndex + 1 < songs.length) {
            playMusic(songs[currentIndex + 1]);
        } else {
            // If at end, play the first song (loop)
            playMusic(songs[0]);
        }
    });
}

// Helper function to get current song index 
function getCurrentSongIndex() {
    const currentSongPath = currentSong.src;
    if (!currentSongPath) return -1;
    
    // Extract just the filename from the path
    const currentSongName = decodeURIComponent(currentSongPath.split("/").pop());
    return songs.indexOf(currentSongName);
}

// Show songs from the selected folder
async function showSongs() {
    songs = await getSongs(currFolder);
    showSongsInList(songs);

    // Load the first song but don't autoplay it (just set the source)
    if (songs.length > 0) {
        playMusic(songs[0], true); // true means don't autoplay
    }
}

// Initialize the app
async function main() {
    await showSongs();
}

// Only call main() if it wasn't called in DOMContentLoaded
if (document.readyState === "complete" || document.readyState === "interactive") {
    // Document already loaded, run main
    main();
}