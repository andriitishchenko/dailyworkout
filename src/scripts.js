class Sound {
    //thanks to  https://marcgg.com/blog/2016/11/01/javascript-audio/
    static Type = {
        SINE: "sine",
        SQUARE: "square",
        TRIANGLE: "triangle",
        SAWTOOTH: "sawtooth"
    }

    constructor() {
        this.context = new(window.AudioContext || window.webkitAudioContext)();
    }

    play(type, x, frequency = 440.0) {
        var o = this.context.createOscillator()
        o.frequency.value = frequency
        var g = this.context.createGain()
        o.connect(g)
        o.type = type
        g.connect(this.context.destination)
        o.start(0)

        g.gain.exponentialRampToValueAtTime(
            0.00001, this.context.currentTime + x
        )
    }
}

class Workouts {

    static list = [
        { title: "Jumping jacks", description: "", images: ["img/1-0.png", "img/1-1.png"] },
        { title: "Wall sit", description: "", images: ["img/2.png"] },
        { title: "Push-ups", description: "", images: ["img/3-0.png", "img/3-1.png"] },
        { title: "Abdominal crunches", description: "", images: ["img/4-0.png", "img/4-1.png"] },
        { title: "Squats", description: "", images: ["img/6-0.png", "img/6-1.png"] },
        { title: "Step-up onto a chair", description: "", images: ["img/5-0.png", "img/5-1.png"] },
        { title: "Triceps dip on a chair", description: "", images: ["img/7-0.png", "img/7-1.png"] },
        { title: "Plank", description: "", images: ["img/8.png"] },
        { title: "High knees, running in place", description: "", images: ["img/6-0.png", "img/9-1.png"] },
        { title: "Alternating lunges", description: "", images: ["img/10-0.png", "img/10-1.png"] },
        { title: "Push-ups with rotation", description: "", images: ["img/3-0.png", "img/3-1.png", "img/11-2.png", "img/3-0.png", "img/3-1.png", "img/11-3.png"] },
        { title: "Side plank, each side", description: "", images: ["img/12.png"] },
    ]


    get list() {
        return Workouts.list;
    }

    get activeItem() {
        return this.list[this.index]
    }

    get activeItemTitle() {
        return this.activeItem.title;
    }

    get activeItemDescription() {
        return this.activeItem.description;
    }

    get activeItemImages() {
        return this.activeItem.images;
    }

    get nextItemTitle() {
        var index = this.index;
        index++;
        if (index == this.list.length) {
            return null;
        }
        return this.list[index].title;
    }

    get isLastItem() {
        return this.index == this.list.length - 1;
    }

    gotoNext() {
        this.gotoIndex(++this.index);
    }

    gotoIndex(i) {
        if (i >= 0 && i <= this.list.length) {
            this.index = i;
        }
        this.update();
    }

    update() {
        if (this.onIndexChange) {
            var isCompleted = this.list.length == this.index;
            if (isCompleted) {
                this.index = 0
            }
            this.onIndexChange(this.index, isCompleted);
        }
    }

    constructor(onIndexChange) {
        this.index = 0
        this.onIndexChange = onIndexChange
    }
}


class TimeManager {
    constructor(onReadyStart, onWorkoutStart, onRestStart, onCompleted) {
        this.mode = 0
        this.timerObj = null

        this.workDuration = 30;
        this.restDuration = 10;
        this.readyDuration = 3;

        this.onReadyStart = onReadyStart
        this.onWorkoutStart = onWorkoutStart
        this.onRestStart = onRestStart
        this.onCompleted = onCompleted
    }

    start() {
        clearTimeout(this.timerObj);
        var timout = 0;
        if (this.mode == 0) {
            this.onReadyStart(this.readyDuration);
            timout = this.readyDuration;
        } else if (this.mode == 1) {
            this.onWorkoutStart(this.workDuration);
            timout = this.workDuration;
        } else if (this.mode == 2) {
            this.onRestStart(this.restDuration);
            timout = this.restDuration;
        } else {
            this.stop();
            this.onCompleted();
            return;
        }

        this.mode++;

        this.timerObj = window.setTimeout((p) => {
            this.start()
        }, timout * 1000);
    }

    stop() {
        clearTimeout(this.timerObj)
        this.mode = 0
    }
}


class SceneManager {
    constructor(scenes, onChangeCallback) {
        this.scenes = scenes;
        this.onChangeCallback = onChangeCallback;
        this.showScene(0);
    }

    showScene(i) {
        if (i < 0 || i > this.scenes.length) {
            i = 0;
        }

        for (var index = 0; index < this.scenes.length; index++) {
            var element = document.getElementById(this.scenes[index]);
            element.classList.remove("hidden");
            if (i != index) {
                element.classList.add("hidden");
            }
        }
        this.onChangeCallback(this.scenes[i]);
    }
}



class UIManager {
    constructor() {
        this.workouts_completed = 0;
        this.isActive = false;
        this.timerObj = new TimeManager(
            (p) => {
                this.onReadyStart(p);
            }, (p) => {
                this.onWorkoutStart(p);
            }, (p) => {
                this.onRestStart(p);
            }, () => {
                this.onWorkoutCompleted();
            });

        this.progress = document.getElementById("progress");
        this.action_title = document.getElementById("action_title");
        this.action_demo = document.getElementById("action_demo");
        this.time_label = document.getElementById("timer");
        this.status_label = document.getElementById("status");
        this.spinner_progress = document.getElementById("progress-spinner")
        this.center_click_handler = document.getElementById("center_click_handler");

        this.center_click_handler.addEventListener('click', e => {
            e.preventDefault();
            if (this.isActive) {
                this.stopAnimation();
                this.displayCountdownStop();
                this.timerObj.stop();
            } else {
                this.stopAnimation();
                this.timerObj.stop();
                this.timerObj.start();
            }
            this.isActive = !this.isActive;
        });

        this.createProgress();
        this.createDemo();
        this.updateUI()
    }

    onReadyStart(duration) {
        this.displayCountdown(duration, "rgb(225, 194, 94)");
        // soundGenerator.play(Sound.Type.SINE, 1.5);
        this.status_label.innerHTML = "Get ready for";
    }

    onWorkoutStart(duration) {
        soundGenerator.play(Sound.Type.SQUARE, 1.5);
        this.status_label.innerHTML = "Do";
        this.displayCountdown(duration, "rgb(168, 193, 77)");
        this.startAnimation();
    }

    onRestStart(duration) {
        soundGenerator.play(Sound.Type.SAWTOOTH, 1.5);
        this.status_label.innerHTML = "Rest";
        this.displayCountdown(duration, "rgb(209, 169, 203)");
        this.stopAnimation();
        this.layoutRestPose();
        this.updateNextLabel();
    }

    onWorkoutCompleted() {
        this.workouts_completed++;
        if (!workouts.isLastItem) {
            workouts.gotoNext();
            this.timerObj.start();

        } else {
            console.log("LAST ITEM, Congrats!");
            workouts.gotoIndex(0);
            this.displayCountdownStop();
            scenes.showScene(2);
        }

        this.updateUI()
    }

    displayCountdown(duration, color) {
        this.displayCountdownStop();
        this.time_label.innerHTML = duration.toString();
        var total = duration;
        this.timeCounter = setInterval(() => {
            total--;

            if (duration == this.timerObj.workDuration) {
                if (Math.floor(duration / 2) == total) {
                    soundGenerator.play(Sound.Type.SINE, 1.5, 880);
                } else if (total < 10) {
                    soundGenerator.play(Sound.Type.SINE, 1.5, 880);
                }
            }

            if (duration == this.timerObj.readyDuration) {
                if (total < 4) {
                    soundGenerator.play(Sound.Type.SINE, 1.5, 880);
                }
            }

            // if (duration == this.timerObj.restDuration) {
            //     if (total < 4) {
            //         soundGenerator.play(Sound.Type.SINE, 1.5, 880);
            //     }
            // }


            this.time_label.innerHTML = total.toString();
            var procent = (duration - total + 1) / duration * 100;
            this.drawProgress(procent, color);
        }, 1000);
    }

    displayCountdownStop() {
        clearInterval(this.timeCounter);
        this.drawProgress(0);
    }



    startAnimation() {
        var active = 0;
        var count = this.action_demo.children.length;

        this.animationTimer = setInterval(() => {
            if (active >= count) {
                active = 0;
            }
            for (var i = 0; i < count; i++) {
                this.action_demo.children[i].className = "hidden";
                if (i == active) {
                    this.action_demo.children[i].classList.remove("hidden");
                }
            }
            active++;
        }, 800);
    }

    stopAnimation() {
        clearInterval(this.animationTimer);
    }

    updateUI() {
        this.updateProgress();
        this.updateLabels();
        this.createDemo();
    }

    createProgress() {
        for (var index = 0; index < workouts.list.length; index++) {
            const el = document.createElement("div");
            el.className = "page-index"
            el.innerHTML = 1 + index;
            el.dataset.index = index;
            this.progress.appendChild(el);
            el.addEventListener('click', (e) => {
                e.preventDefault();
                this.isActive = false;
                this.drawProgress(0);
                this.stopAnimation();
                this.displayCountdownStop();
                var index = e.currentTarget.dataset.index
                this.timerObj.stop()
                workouts.gotoIndex(index)
                this.updateUI()
            });
        }
    }

    createDemo() {
        this.action_demo.innerHTML = "";
        for (var index = 0; index < workouts.activeItemImages.length; index++) {
            const el = document.createElement("div");
            el.style.backgroundImage = 'url(' + workouts.activeItemImages[index] + ')';
            if (index != 0) {
                el.className = "hidden"
            }
            el.dataset.index = index;
            this.action_demo.appendChild(el);
        }
    }

    layoutRestPose() {
        this.action_demo.innerHTML = "";
        const el = document.createElement("div");
        el.style.backgroundImage = 'url(img/1-0.png)';
        this.action_demo.appendChild(el);
    }

    updateProgress() {
        let list = Array.from(this.progress.children);
        for (var i = 0; i < list.length; i++) {
            list[i].classList.remove("active_index");

            if (i == workouts.index) {
                list[i].classList.add("active_index");
            }
        }
    }

    updateLabels() {
        this.action_title.innerHTML = workouts.activeItemTitle;
        this.time_label.innerHTML = "00";
    }

    updateNextLabel() {
        if(workouts.nextItemTitle){
            this.action_title.innerHTML = "<span>next: </span>" + workouts.nextItemTitle;
        }else{
            this.action_title.innerHTML = "<span>You earned +1 point</span>";
        }
        
    }

    drawProgress(progress, color = "rgb(168, 193, 77)") {
        this.spinner_progress.style.background =
            "conic-gradient(" + color + " " +
            progress +
            "%,rgb(242, 242, 242) " +
            progress +
            "%)";
    }

}

class Score {
    constructor() {
        this.history = [];
        this.score = 1;
        this.timestamp = new Date().getTime();
    }

    toJson() {
        return JSON.stringify({ score: this.score, timestamp: this.timestamp, history: this.history });
    };

    static fromJson(json) {
        var data = JSON.parse(json ? json : null);
        let r = new Score();
        if (data) {
            r.score = data.score;
            r.timestamp = data.timestamp;
            r.history = data.history;
        }
        return r;
    }

    static fromLocalStorage() {
        return Score.fromJson(localStorage.gamestats);
    }

    addtoHistory() {
        this.history.push(new Date().getTime());
    }

    updateScore() {
        let now = new Date().getTime();
        let dif = Math.round((now - this.timestamp) / (1000 * 60 * 60 * 24));
        if (dif == 1) {
            this.score++;
        } else if (dif > 2) {
            this.score = 1;
        }

        this.timestamp = new Date().getTime();
    }

    save() {
        localStorage.gamestats = this.toJson();
    }
}



let gameScore = null;

let workouts = new Workouts((i, isfi) => {
    try {
        rotateAds();
    } catch {
        console.log("ads error");
    }

});
let soundGenerator = new Sound();
let scenes = null;
let ui = null;


var isFacebookInitiated = false;
var isFacebookInjected = false;


function onCl() {
    scenes.showScene(1);
    soundGenerator.play(Sound.Type.SINE, 0.0);
}

function updateScoreLayout() {
    let score_label = document.getElementById("score_label");
    score_label.innerHTML = isFacebookInitiated ? SCORE.toString() : gameScore.score.toString();
}


document.addEventListener('DOMContentLoaded', function() {

    gameScore = Score.fromLocalStorage();
    updateStartScreenScore(gameScore.score);

    
    scenes = new SceneManager(["scene-0", "scene-1", "scene-2"], (scene) => {
        if (scene == "scene-2") {
            // gameScore.addtoHistory();
            gameScore.updateScore();
            gameScore.save();

            saveToStorage();
            updateScoreLayout();
            onPostToLeaderboard();
        }
    });
    ui = new UIManager();
}, false);


function updateStartScreenScore(val) {
    // console.log(val);
    let score_label = document.getElementById("l_score_id");
    score_label.innerHTML = val?val.toString():"--";
}


function getScoreImageBase64(score_value = 1) {

    var canvas = document.createElement('canvas');
    canvas.id = 'canvasJavascript'
    canvas.width = 218;
    canvas.height = 218;
    canvas.ctx = canvas.getContext("2d");

    var ox = canvas.width / 2;
    var oy = canvas.height / 2;
    var radius = 50;

    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgb(220, 220, 210)";
    // ctx.fillStyle = "rgb(220, 220, 110)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.arc(ox, oy, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = '#fff';
    ctx.fill();

    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgb(168, 193, 77)";
    ctx.stroke();

    ctx.font = "bold 30px  sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgb(175, 175, 65)";
    ctx.fillText("Daily Workout", ox, oy * 0.2);


    ctx.font = "50px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgb(195, 95, 80)";
    ctx.fillText(score_value, ox, oy);


    ctx.font = "20px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgb(195, 95, 80)";
    ctx.fillText("continuous days", ox, oy * 1.7);


    var value = canvas.toDataURL();
    // document.body.appendChild(canvas);
    // console.log(value);
    return value;
}

function addFBScript() {
    if (isFacebookInjected) {
        shareFBuiFeed()
            // shareFBui();
        return;
    }

    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.crossorigin = "anonymous";
    script.setAttributeNode(document.createAttribute("async"));
    script.setAttributeNode(document.createAttribute("defer"));
    document.head.appendChild(script);

    window.fbAsyncInit = function() {
        FB.init({
            appId: '2184426505072200',
            autoLogAppEvents: true,
            xfbml: true,
            version: 'v14.0'
        })


        shareFBuiFeed()
            // shareFBui()
            // postBlobtoFB()
    };
}

function shareFBui() {
    FB.ui({
        method: 'share',
        href: window.location.href,
    }, function(response) {});
}

function shareFBuiFeed() {
    // var base64image = getScoreImageBase64(15);
    let message = 'Hey, I have been doing daily workouts for the last ' + gameScore.score + ' days, join me!';

    FB.ui({
        method: 'feed',
        display: 'popup',
        link: window.location.href,

        title: 'Daily Workout', // The same than name in feed method
        picture: window.location.href + "/assets/218.jpg",
        caption: message,
        description: "Join me!",
    }, function(response) {
        console.log(response);
    });
}


// const getBase64FromUrl = async(url) => {
//     const data = await fetch(url);
//     const blob = await data.blob();
//     return new Promise((resolve) => {
//         const reader = new FileReader();
//         reader.readAsDataURL(blob);
//         reader.onloadend = () => {
//             const base64data = reader.result;
//             resolve(base64data);
//         }
//     });
// }


function postBlobtoFB() {
    var data = getScoreImageBase64(15);
    var blob;
    try {
        var byteString = atob(data.split(',')[1]);
        var ab = new ArrayBuffer(byteString.length);
        var ia = new Uint8Array(ab);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        blob = new Blob([ab], { type: 'image/png' });
    } catch (e) {
        console.log(e);
    }
    var fd = new FormData();
    fd.append("source", blob);
    fd.append("message", "Photo Text");
    FB.login(function() {
        var auth = FB.getAuthResponse();

        var request = new XMLHttpRequest();
        request.open("POST", "https://graph.facebook.com/" + auth.userID + "/photos?access_token=" + auth.accessToken);
        request.send(fd);
    }, { scope: 'publish_actions' });
}