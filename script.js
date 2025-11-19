// ---------------------- ELEMENTS ----------------------
const taskInput = document.getElementById("taskInput");
const category = document.getElementById("category");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const themeBtn = document.getElementById("themeBtn");

// ---------------------- PAGE LOAD ----------------------
document.addEventListener("DOMContentLoaded", () => {
    loadTasks();
    loadTheme();

    // GSAP PAGE ANIMATION
    gsap.from(".container", {
        opacity: 0,
        y: 40,
        duration: 1,
        ease: "power3.out"
    });
});

// ---------------------- ADD TASK ----------------------
addBtn.addEventListener("click", addTask);

function addTask() {
    if (taskInput.value.trim() === "") {
        alert("Enter a task!");
        return;
    }

    const task = {
        id: Date.now(),
        text: taskInput.value,
        category: category.value,
        completed: false
    };

    addTaskToUI(task);
    saveTaskToLocal(task);

    taskInput.value = "";
}

// ---------------------- ADD TO UI ----------------------
function addTaskToUI(task) {
    const li = document.createElement("li");
    li.className = "task";
    li.setAttribute("data-id", task.id);

    li.innerHTML = `
        <span class="${task.completed ? "completed" : ""}">
            ${task.text} <small>(${task.category})</small>
        </span>

        <div class="btns">
            <button class="complete-btn">✔</button>
            <button class="edit-btn">✎</button>
            <button class="delete-btn">🗑</button>
        </div>
    `;

    // BUTTON EVENTS
    li.querySelector(".delete-btn").addEventListener("click", deleteTask);
    li.querySelector(".edit-btn").addEventListener("click", editTask);
    li.querySelector(".complete-btn").addEventListener("click", toggleComplete);

    taskList.appendChild(li);

    // GSAP ENTRY ANIMATION
    gsap.from(li, {
        opacity: 0,
        x: -50,
        duration: 0.4,
        ease: "power2.out"
    });
}

// ---------------------- LOCAL STORAGE SAVE ----------------------
function saveTaskToLocal(task) {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.push(task);
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// ---------------------- LOAD TASKS ----------------------
function loadTasks() {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.forEach(addTaskToUI);
}

// ---------------------- DELETE TASK ----------------------
function deleteTask(e) {
    let li = e.target.closest("li");
    let id = li.getAttribute("data-id");

    // GSAP DELETE ANIMATION
    gsap.to(li, {
        opacity: 0,
        height: 0,
        margin: 0,
        padding: 0,
        duration: 0.3,
        ease: "power1.in",
        onComplete: () => li.remove()
    });

    removeFromLocal(id);
}

function removeFromLocal(id) {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks = tasks.filter(t => t.id != id);
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// ---------------------- EDIT TASK ----------------------
function editTask(e) {
    let li = e.target.closest("li");
    let id = li.getAttribute("data-id");
    let textSpan = li.querySelector("span");

    let newText = prompt("Edit your task:", textSpan.textContent);
    if (newText) {
        textSpan.textContent = newText;

        let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        tasks = tasks.map(t => {
            if (t.id == id) t.text = newText;
            return t;
        });

        localStorage.setItem("tasks", JSON.stringify(tasks));
    }
}

// ---------------------- COMPLETE TASK ----------------------
function toggleComplete(e) {
    let li = e.target.closest("li");
    let id = li.getAttribute("data-id");
    let textSpan = li.querySelector("span");

    textSpan.classList.toggle("completed");

    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks = tasks.map(t => {
        if (t.id == id) t.completed = !t.completed;
        return t;
    });

    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// ---------------------- THEME TOGGLE ----------------------
themeBtn.addEventListener("click", toggleTheme);

function toggleTheme() {
    document.body.classList.toggle("dark");

    gsap.fromTo("body", { opacity: 0.7 }, { opacity: 1, duration: 0.3 });

    if (document.body.classList.contains("dark")) {
        themeBtn.textContent = "☀ Light Mode";
        localStorage.setItem("theme", "dark");
    } else {
        themeBtn.textContent = "🌙 Dark Mode";
        localStorage.setItem("theme", "light");
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark");
        themeBtn.textContent = "☀ Light Mode";
    }
}

// ---------------------- BUTTON HOVER ANIMATION ----------------------
document.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("mouseenter", () => {
        gsap.to(btn, { scale: 1.08, duration: 0.2 });
    });
    btn.addEventListener("mouseleave", () => {
        gsap.to(btn, { scale: 1, duration: 0.2 });
    });
});

// ---------------------- THEME BUTTON FLOAT ----------------------
gsap.to("#themeBtn", {
    y: -5,
    repeat: -1,
    yoyo: true,
    duration: 1.4,
    ease: "power1.inOut"
});
