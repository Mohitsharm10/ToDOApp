// Dashboard logic: reads tasks from localStorage key "tasks"
// and renders charts + stats. Uses Chart.js + GSAP.

// --------------------- Helpers ---------------------
const $ = (sel) => document.querySelector(sel);
const fromNowDays = (ts) => {
  // ts is milliseconds (id)
  const d = new Date(ts);
  const today = new Date();
  // zero time for both
  return Math.floor((today.setHours(0,0,0,0) - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / (1000*60*60*24));
};

function getLastNDates(n){
  const arr = [];
  const today = new Date();
  for(let i = n-1; i >= 0; i--){
    const d = new Date();
    d.setDate(today.getDate() - i);
    arr.push(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
  }
  return arr;
}

// --------------------- DOM refs ---------------------
const totalEl = $("#totalTasks");
const completedEl = $("#completedTasks");
const pendingEl = $("#pendingTasks");
const todayEl = $("#todayTasks");
const recentList = $("#recentList");
const refreshBtn = $("#refreshBtn");

// Chart canvas elements
const progressCtx = document.getElementById("progressRing").getContext("2d");
const categoryCtx = document.getElementById("categoryPie").getContext("2d");
const weeklyCtx = document.getElementById("weeklyBar").getContext("2d");

// Chart instances
let progressChart = null;
let categoryChart = null;
let weeklyChart = null;

// --------------------- Main render ---------------------
function loadAndRender(){
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];

  // Basic stats
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;

  // Today's tasks: created today (id timestamp)
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const todayCount = tasks.filter(t => {
    const created = new Date(parseInt(t.id));
    return created >= todayStart && created <= new Date();
  }).length;

  // Update stat DOM
  totalEl.textContent = total;
  completedEl.textContent = completed;
  pendingEl.textContent = pending;
  todayEl.textContent = todayCount;

  // Recent tasks (last 7 modified/created) - sort by id desc
  const recent = tasks.slice().sort((a,b)=> b.id - a.id).slice(0,7);
  renderRecent(recent);

  // Doughnut / progress ring: completion percentage
  const completionPct = total === 0 ? 0 : Math.round((completed / total) * 100);
  renderProgressRing(completionPct);

  // Category pie
  const categories = ["Work","Study","Personal","General"];
  const catCounts = categories.map(cat => tasks.filter(t => t.category === cat).length);
  renderCategoryPie(categories, catCounts);

  // Weekly bar chart (completed tasks per day for last 7 days)
  // NOTE: current data doesn't store completion timestamp, so we approximate:
  // we'll count tasks that were *created* on each day AND currently marked completed.
  // To be more precise later, store `completedAt` when toggling complete.
  const last7 = getLastNDates(7);
  const labels = last7.map(d => d.toLocaleDateString(undefined, { weekday: 'short' }));
  const weeklyData = last7.map(d => {
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const end = start + (24*60*60*1000) - 1;
    return tasks.filter(t => {
      const created = parseInt(t.id);
      return created >= start && created <= end && t.completed;
    }).length;
  });
  renderWeeklyBar(labels, weeklyData);
}

// --------------------- Render Recent ---------------------
function renderRecent(items){
  recentList.innerHTML = "";
  if(items.length === 0){
    const li = document.createElement("li");
    li.className = "recent-item";
    li.innerHTML = `<div class="left"><div><strong>No tasks yet</strong><div class="small">Add tasks from the main app</div></div></div>`;
    recentList.appendChild(li);
    return;
  }

  items.forEach((t,i) => {
    const li = document.createElement("li");
    li.className = "recent-item";
    const badgeClass = `cat-${t.category.replace(/\s+/g,'')}`;
    const createdDate = new Date(parseInt(t.id));
    const createdLabel = createdDate.toLocaleString();

    li.innerHTML = `
      <div class="left">
        <div class="cat-badge ${badgeClass}">${t.category}</div>
        <div>
          <div style="font-weight:600">${t.text}</div>
          <div class="small">Created: ${createdLabel}</div>
        </div>
      </div>
      <div class="right small">${t.completed ? '✅ Completed' : '⏳ Pending'}</div>
    `;
    recentList.appendChild(li);

    // staggered animation with GSAP
    gsap.from(li, { opacity: 0, x: 20, duration: 0.45, delay: i * 0.06, ease: "power2.out" });
  });
}

// --------------------- Charts ---------------------
function renderProgressRing(pct){
  const data = {
    labels: ["Completed", "Remaining"],
    datasets: [{
      data: [pct, 100 - pct],
      borderWidth: 0,
      hoverOffset: 6
    }]
  };

  const config = {
    type: 'doughnut',
    data,
    options: {
      cutout: '75%',
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
        beforeDraw: undefined
      }
    }
  };

  if(progressChart) progressChart.destroy();
  progressChart = new Chart(progressCtx, config);

  // central text (circle) — draw label using plugin
  const centerText = {
    id: 'centerText',
    beforeDraw(chart) {
      const { ctx, chartArea: { width, height } } = chart;
      ctx.save();
      ctx.font = '700 20px Inter, Poppins, sans-serif';
      ctx.fillStyle = '#111827';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pct + '%', width/2, height/2);
    }
  };

  // re-create chart with plugin
  if(progressChart) progressChart.destroy();
  progressChart = new Chart(progressCtx, {
    type:'doughnut',
    data,
    options: config.options,
    plugins: [ centerText ]
  });
}

function renderCategoryPie(labels, dataArr){
  const bgColors = [
    'rgba(122,130,239,0.95)',
    'rgba(52,195,161,0.95)',
    'rgba(255,184,107,0.95)',
    'rgba(244,91,105,0.95)'
  ];
  if(categoryChart) categoryChart.destroy();
  categoryChart = new Chart(categoryCtx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{ data: dataArr, backgroundColor: bgColors }]
    },
    options: {
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

function renderWeeklyBar(labels, dataArr){
  if(weeklyChart) weeklyChart.destroy();
  weeklyChart = new Chart(weeklyCtx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Completed',
        data: dataArr,
        backgroundColor: 'rgba(106,90,205,0.85)',
        borderRadius: 6,
        barThickness: 24
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } }
      },
      plugins: { legend: { display: false } }
    }
  });
}

// --------------------- Init ---------------------
loadAndRender();

// --------------------- Refresh button ---------------------
refreshBtn.addEventListener('click', () => {
  // small pulse
  gsap.fromTo(refreshBtn, { scale: 0.95 }, { scale: 1, duration: 0.25, ease: "elastic.out(1,0.6)" });
  loadAndRender();
});

// --------------------- Optional improvement note ---------------------
/*
  Note: For accurate per-day *completion time* analytics, modify your main app's
  toggleComplete function to set a `completedAt` timestamp when a task is marked completed:
    t.completed = true;
    t.completedAt = Date.now();

  Then the weekly chart can count by completedAt instead of approximating using creation time.
*/
