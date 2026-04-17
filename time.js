// 📦 Load data safely
let data = JSON.parse(localStorage.getItem("data")) || [];

// 🧠 Current tasks
let currentTasks = JSON.parse(localStorage.getItem("currentTasks")) || {
  study: [],
  health: [],
  growth: [],
  rest: []
};

// ➕ Add task
function addTask(category) {
  let input = document.getElementById(category + "Task");
  let text = input.value.trim();

  if (!text) return;

  currentTasks[category].push({ text, done: false });
localStorage.setItem("currentTasks", JSON.stringify(currentTasks));
  input.value = "";
  renderTasks();
}

// 🔄 Render tasks
// 🔄 Render tasks
function renderTasks() {
  ["study", "health", "growth", "rest"].forEach(cat => {
    let container = document.getElementById(cat + "List");
    container.innerHTML = "";

    currentTasks[cat].forEach((task, i) => {
      let div = document.createElement("div");
      div.className = "task-item" + (task.done ? " done" : "");
      
      div.innerHTML = `
  <input type="checkbox"
    ${task.done ? "checked" : ""}
    onchange="toggleTask('${cat}', ${i})">

  ${task.text}

  <button onclick="editTask('${cat}', ${i})">✏️</button>
  <button onclick="deleteTask('${cat}', ${i})">❌</button>
`;
      container.appendChild(div);
    });
  });
}

// ✅ Toggle task
function toggleTask(category, index) {
  currentTasks[category][index].done =
    !currentTasks[category][index].done;
    localStorage.setItem("currentTasks", JSON.stringify(currentTasks));

  renderTasks();
}
function editTask(category, index) {
  let newText = prompt("Edit task:", currentTasks[category][index].text);

  if (newText !== null && newText.trim() !== "") {
    currentTasks[category][index].text = newText.trim();
    localStorage.setItem("currentTasks", JSON.stringify(currentTasks));
    renderTasks();
  }
}
function deleteTask(category, index) {
  currentTasks[category].splice(index, 1);
  localStorage.setItem("currentTasks", JSON.stringify(currentTasks));
  renderTasks();
}

// 💾 Save day
function saveDay() {
  let date = document.getElementById("date").value;

  if (!date) {
    alert("Pick a date");
    return;
  }

  let total = 0;
  let done = 0;

  Object.values(currentTasks).forEach(list => {
    total += list.length;
    done += list.filter(t => t.done).length;
  });

  let productivity = total === 0 ? 0 : Math.round((done / total) * 10);

  let entry = {
    date,
    tasks: JSON.parse(JSON.stringify(currentTasks)),
    productivity
  };

  data.push(entry);
  localStorage.setItem("data", JSON.stringify(data));

  // reset
  currentTasks = { study: [], health: [], growth: [], rest: [] };
  renderTasks();

  render();
}

// 🎨 Render UI
function render() {
  
  const container = document.getElementById("entries");
  container.innerHTML = "";

  // 🔥 RESET SUMMARY FIRST
  if (data.length === 0) {
    document.getElementById("totalTasks").innerText = 0;
    document.getElementById("doneTasks").innerText = 0;
    document.getElementById("percent").innerText = "0%";

    document.getElementById("totalBar").style.width = "0%";
    document.getElementById("doneBar").style.width = "0%";
    document.getElementById("percentBar").style.width = "0%";
  }

  if (data.length === 0) {
    container.innerHTML = "Start logging today — patterns will show up soon 🚀";
  }

 data.forEach(d => {
    const div = document.createElement("div");
    div.className = "entry-card";
    
    let taskCategories = "";
    
    if (d.tasks && typeof d.tasks === "object") {
      Object.entries(d.tasks).forEach(([cat, list]) => {
        if (Array.isArray(list) && list.length > 0) {
          const catEmojis = { study: "📚", health: "💪", growth: "🌱", rest: "😴"  
};
          const catColors = { study: "#ff6b6b", health: "#4ecdc4", growth: "#ffe66d", rest: "#a8a4e6" };
          
          let tasksHtml = list.map(t => 
            `<div class="entry-task">${t.done ? "✅" : "⭕"} ${t.text}</div>`
          ).join("");
          
          taskCategories += `
            <div class="entry-category" style="border-left: 3px solid ${catColors[cat]}">
              <h5>${catEmojis[cat]} ${cat}</h5>
              ${tasksHtml}
            </div>
          `;
        }
      });
    }

    div.innerHTML = `
      <div class="entry-header">
        <div class="entry-date">📅 ${d.date}</div>
        <div class="entry-score">⚡ ${d.productivity}/10</div>
      </div>
      <div class="entry-tasks">${taskCategories}</div>
    `;

    container.appendChild(div);
  });
  // 📊 SUMMARY
  let total = 0;
  let done = 0;

  data.forEach(d => {
    if (d.tasks) {
      Object.values(d.tasks).forEach(list => {
        if (Array.isArray(list)) {
          total += list.length;
          done += list.filter(t => t.done).length;
        }
      });
    }
  });

  let percent = total === 0 ? 0 : Math.round((done / total) * 100);

  document.getElementById("totalTasks").innerText = total;
  document.getElementById("doneTasks").innerText = done;
  document.getElementById("percent").innerText = percent + "%";

  document.getElementById("totalBar").style.width = "100%";
  document.getElementById("doneBar").style.width =
    total ? (done / total) * 100 + "%" : "0%";
  document.getElementById("percentBar").style.width = percent + "%";

  generateInsight();
  drawChart();
}

function detectPattern() {
  if (data.length < 3) return "";

  let last3 = data.slice(-3);

  let skipCount = {
    study: 0,
    health: 0,
    growth: 0,
    rest: 0
  };

  let totalTasksPerDay = [];

  last3.forEach(day => {
    let total = 0;

    Object.entries(day.tasks || {}).forEach(([cat, list]) => {
      if (Array.isArray(list)) {
        total += list.length;

        list.forEach(t => {
          if (!t.done) skipCount[cat]++;
        });
      }
    });

    totalTasksPerDay.push(total);
  });

  // 🔍 most skipped category
  let worst = Object.keys(skipCount).reduce((a, b) =>
    skipCount[a] > skipCount[b] ? a : b
  );

  // 🔍 task load vs performance
  let avgTasks = totalTasksPerDay.reduce((a,b)=>a+b,0) / totalTasksPerDay.length;
  let avgProd = last3.reduce((a,b)=>a+b.productivity,0) / last3.length;

  // 🎯 pattern logic
  if (skipCount[worst] >= 3) {
    return `You keep skipping ${worst} tasks 👀`;
  }

  if (avgTasks > 6 && avgProd < 6) {
    return "You plan too much… try fewer tasks 🎯";
  }

  if (avgProd >= 8) {
    return "You're consistent these days 🔥";
  }

  return "";
}
// 💡 Insight
function generateInsight() {
  let pattern = detectPattern();

if (pattern) {
  document.getElementById("insight").innerText = pattern;
  return;
}
  if (data.length < 2) {
    document.getElementById("insight").innerText =
      "Start tracking… I’ll call you out soon 👀";
    return;
  }

  let last = data[data.length - 1];
  let prev = data[data.length - 2];

  let change = last.productivity - prev.productivity;

  let total = 0;
  let done = 0;

  Object.values(last.tasks).forEach(list => {
    total += list.length;
    done += list.filter(t => t.done).length;
  });

  let missed = total - done;

  let text = "";

  if (change > 2) {
    text = "Big jump today 🔥 whatever you did — repeat it.";
  } else if (change < -2) {
    text = "Drop detected 📉 something broke your flow.";
  } else if (missed > 3) {
    text = `You left ${missed} tasks unfinished… be honest 👀`;
  } else if (done === total && total > 0) {
    text = "Everything done. That’s rare. Respect 💪";
  } else {
    text = "You're getting there… just tighten execution.";
  }

  document.getElementById("insight").innerText = text;
}

// 📊 Chart
function drawChart() {
  const canvas = document.getElementById("chart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  const labels = data.map(d => d.date);
  const values = data.map(d => d.productivity);

  if (window.chart && typeof window.chart.destroy === "function") {
    window.chart.destroy();
  }

  window.chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        data: values,
        borderColor: "#6366f1",
        backgroundColor: "rgba(99,102,241,0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 5
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { min: 0, max: 10 }
      }
    }
  });
}

// 🚀 INIT
render();
renderTasks();