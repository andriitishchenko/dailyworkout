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

    play(type, x) {
        var o = this.context.createOscillator()
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
        this.readyDuration = 4;

        this.onReadyStart = onReadyStart
        this.onWorkoutStart = onWorkoutStart
        this.onRestStart = onRestStart
        this.onCompleted = onCompleted
    }

    start() {

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
        }

        this.timerObj = window.setTimeout((p) => {
            clearTimeout(this.timerObj);
            this.mode += 1;
            if (this.mode > 2) {
                this.mode = 0;
                this.onCompleted();
                return;
            }
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

        this.isActive = false;

        this.timerObj = new TimeManager(
            (p) => {
                this.onReadyStart(p);
            }, (p) => {
                this.onWorkoutStart(p);
            }, (p) => {
                this.onRestStart(p);
            }, (p) => {
                this.onWorkoutCompleted(p);
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
        var i = 0;
        soundGenerator.play(Sound.Type.SINE, 1.5);
        let t = setInterval(() => {
            i++;
            soundGenerator.play(Sound.Type.SINE, 1.5);
            if (i == 2) {
                clearInterval(t);
            }
        }, 1000);
        this.status_label.innerHTML = "Prepare";
        this.displayCountdown(duration, "rgb(225, 194, 94)");
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
    }

    displayCountdown(duration, color) {
        this.drawProgress(0);
        clearInterval(this.timeCounter);
        this.time_label.innerHTML = duration.toString();
        var total = duration;
        this.timeCounter = setInterval(() => {
            total--;
            this.time_label.innerHTML = total.toString();
            var procent = (duration - total + 1) / duration * 100;
            this.drawProgress(procent, color);
        }, 1000);
    }

    displayCountdownStop() {
        clearInterval(this.timeCounter);
        this.drawProgress(0);
    }

    onWorkoutCompleted() {
        console.log("onWorkoutCompleted");
        if (!workouts.isLastItem) {
            workouts.gotoNext();
            this.timerObj.start();

        } else {
            workouts.gotoIndex(0);
            console.log("LAST ITEM, Congrats!");
            scenes.showScene(2);
        }
        clearInterval(this.timeCounter);
        this.updateUI()
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


    drawProgress(progress, color = "rgb(168, 193, 77)") {
        this.spinner_progress.style.background =
            "conic-gradient(" + color + " " +
            progress +
            "%,rgb(242, 242, 242) " +
            progress +
            "%)";
    }

}


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
document.addEventListener('DOMContentLoaded', function() {
    scenes = new SceneManager(["scene-0", "scene-1", "scene-2"], (scene) => {
        if (scene == "scene-2") {
            saveToStorage();
            updateScoreLayout();
            onPostToLeaderboard();
        }
    });
    ui = new UIManager();


}, false)

// document.addEventListener('touchend', () => window.audioContext.resume());

function onCl() {
    scenes.showScene(1);
    soundGenerator.play(Sound.Type.SINE, 0.0);
}

function updateScoreLayout() {
    let score_label = document.getElementById("score_label");

    score_label.innerHTML = SCORE.toString();
}