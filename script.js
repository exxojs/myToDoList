    (() => {
      const storageKey = "ancient-quest-board-v1";
      const priorityNames = { high: "High", medium: "Medium", low: "Low" };
      const dueNames = { today: "Due today", tomorrow: "Tomorrow", week: "This week", later: "Later", none: "No deadline" };
      const quotes = ["A steady hand wins the longest game.", "Every cooldown ends. Every quest can begin.", "Victory belongs to those who keep moving."];
      let tasks = loadTasks();
      let currentFilter = "all";
      let draggedId = null;
      let quoteIndex = 0;
      const $ = (selector) => document.querySelector(selector);
      const taskList = $("#taskList");
      const backdrop = $("#modalBackdrop");
      const form = $("#taskForm");
      const dateLabel = $("#dateLabel");

      function loadTasks() {
        try {
          const saved = localStorage.getItem(storageKey);
          if (!saved) return [];
          const parsed = JSON.parse(saved);
          if (!Array.isArray(parsed) || parsed.some((task) => !task || typeof task.id !== "string" || typeof task.title !== "string")) {
            throw new Error("Saved quest data has an invalid format.");
          }
          return parsed;
        } catch (error) {
          console.error("Could not load saved quests:", error);
          return [];
        }
      }
      function saveTasks() {
        try {
          localStorage.setItem(storageKey, JSON.stringify(tasks));
        } catch (error) {
          console.error("Could not save quests:", error);
          showToast("Could not save changes in this browser.");
        }
      }
      function showToast(message) {
        const toast = $("#toast");
        toast.textContent = message;
        toast.classList.add("show");
        window.clearTimeout(showToast.timer);
        showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2300);
      }
      function urgency(task) {
        if (task.done || task.due === "none" || task.due === "later") return "normal";
        if (task.due === "today") return "urgent";
        if (task.due === "tomorrow") return "soon";
        if (task.due === "custom" && task.customDate) {
          const target = new Date(task.customDate + "T23:59:59");
          const days = Math.ceil((target - new Date()) / 86400000);
          if (days <= 0) return "urgent";
          if (days <= 2) return "soon";
        }
        return "normal";
      }
      function dueLabel(task) {
        if (task.due !== "custom") return dueNames[task.due] || "No deadline";
        if (!task.customDate) return "Choose date";
        return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(task.customDate + "T12:00:00"));
      }
      function urgencyScore(task) {
        const urgencyWeight = { urgent: 3, soon: 2, normal: 0 }[urgency(task)];
        const priorityWeight = { high: 3, medium: 2, low: 1 }[task.priority] || 1;
        return urgencyWeight * 10 + priorityWeight;
      }
      function render() {
        const active = tasks.filter((task) => !task.done);
        const completed = tasks.filter((task) => task.done).length;
        $("#taskCount").textContent = active.length;
        $("#allCount").textContent = tasks.length;
        $("#progressNumber").textContent = tasks.length ? Math.round(completed / tasks.length * 100) + "%" : "0%";
        $("#progressLabel").textContent = `${completed} / ${tasks.length} quests complete`;
        $("#progressFill").style.width = tasks.length ? `${completed / tasks.length * 100}%` : "0%";
        $("#remainingLabel").textContent = tasks.length && completed === tasks.length ? "Ancient secured!" : active.length ? `${active.length} ${active.length === 1 ? "objective" : "objectives"} remaining` : "Awaiting first victory";

        const visible = tasks.filter((task) => currentFilter === "all" || (currentFilter === "active" ? !task.done : task.done));
        taskList.replaceChildren();
        visible.forEach((task) => {
          const rank = tasks.indexOf(task) + 1;
          const state = urgency(task);
          const card = document.createElement("article");
          card.className = `task-card${task.done ? " done" : ""}`;
          card.draggable = true;
          card.dataset.id = task.id;
          card.innerHTML = `
            <label class="check-wrap" aria-label="Mark ${escapeHtml(task.title)} complete">
              <input class="check" type="checkbox" ${task.done ? "checked" : ""} aria-label="Complete quest">
              <span class="check-ui" aria-hidden="true"></span>
            </label>
            <div class="task-main">
              <div class="task-title" title="${escapeHtml(task.title)}">${escapeHtml(task.title)}</div>
              <div class="task-note">${escapeHtml(task.note || "No battle plan added")}</div>
              <div class="task-meta">
                <span class="priority ${task.priority}"><i></i>${priorityNames[task.priority] || "Medium"}</span>
                <span class="deadline ${state}" title="Urgency is based on the deadline">
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="2.5" y="3.5" width="11" height="10" rx="1" stroke="currentColor"/><path d="M5 2v3M11 2v3M3 6.5h10" stroke="currentColor"/></svg>
                  ${escapeHtml(dueLabel(task))}${state === "urgent" ? " · Urgent" : state === "soon" ? " · Soon" : ""}
                </span>
              </div>
            </div>
            <div class="task-right">
              <span class="rank" aria-label="Rank ${rank}">${String(rank).padStart(2, "0")}</span>
              <select class="priority-select" aria-label="Set priority for ${escapeHtml(task.title)}">
                <option value="high" ${task.priority === "high" ? "selected" : ""}>High</option>
                <option value="medium" ${task.priority === "medium" ? "selected" : ""}>Medium</option>
                <option value="low" ${task.priority === "low" ? "selected" : ""}>Low</option>
              </select>
              <select class="due-select" aria-label="Set deadline for ${escapeHtml(task.title)}">
                <option value="today" ${task.due === "today" ? "selected" : ""}>Today</option>
                <option value="tomorrow" ${task.due === "tomorrow" ? "selected" : ""}>Tomorrow</option>
                <option value="week" ${task.due === "week" ? "selected" : ""}>This week</option>
                <option value="later" ${task.due === "later" ? "selected" : ""}>Later</option>
                <option value="none" ${task.due === "none" ? "selected" : ""}>No date</option>
                <option value="custom" ${task.due === "custom" ? "selected" : ""}>Custom…</option>
              </select>
              <button class="delete-task" type="button" aria-label="Remove ${escapeHtml(task.title)}"><svg viewBox="0 0 16 16" fill="none"><path d="M3 4.5h10M6 4.5V3h4v1.5m2.5 0-.6 8H4.1l-.6-8m3 2v4m3-4v4" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
            </div>`;
          card.querySelector(".check").addEventListener("change", (event) => {
            task.done = event.target.checked;
            saveTasks();
            render();
            showToast(task.done ? "Quest completed. Nice work." : "Quest returned to the stack.");
          });
          card.querySelector(".priority-select").addEventListener("change", (event) => {
            task.priority = event.target.value;
            saveTasks();
            render();
          });
          card.querySelector(".due-select").addEventListener("change", (event) => {
            if (event.target.value === "custom") {
              openModal(task);
              return;
            }
            task.due = event.target.value;
            delete task.customDate;
            saveTasks();
            render();
          });
          card.querySelector(".delete-task").addEventListener("click", () => {
            tasks = tasks.filter((item) => item.id !== task.id);
            saveTasks();
            render();
            showToast("Quest removed from the stack.");
          });
          card.addEventListener("dragstart", (event) => {
            if (event.target.closest("select,button,label")) { event.preventDefault(); return; }
            draggedId = task.id;
            card.classList.add("dragging");
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", task.id);
          });
          card.addEventListener("dragend", () => {
            draggedId = null;
            card.classList.remove("dragging");
            document.querySelectorAll(".drop-target").forEach((node) => node.classList.remove("drop-target"));
          });
          card.addEventListener("dragover", (event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            if (task.id !== draggedId) card.classList.add("drop-target");
          });
          card.addEventListener("dragleave", (event) => {
            if (!card.contains(event.relatedTarget)) card.classList.remove("drop-target");
          });
          card.addEventListener("drop", (event) => {
            event.preventDefault();
            card.classList.remove("drop-target");
            const sourceId = draggedId || event.dataTransfer.getData("text/plain");
            const from = tasks.findIndex((item) => item.id === sourceId);
            const to = tasks.findIndex((item) => item.id === task.id);
            if (from < 0 || to < 0 || from === to) return;
            const [moved] = tasks.splice(from, 1);
            tasks.splice(to, 0, moved);
            saveTasks();
            render();
          });
          taskList.append(card);
        });
        $("#emptyState").style.display = visible.length ? "none" : "block";
        updateFocus();
      }
      function updateFocus() {
        const upcoming = tasks.filter((task) => !task.done && task.due !== "none" && task.due !== "later")
          .sort((a, b) => urgencyScore(b) - urgencyScore(a)).slice(0, 2);
        const focusList = $("#focusList");
        focusList.replaceChildren();
        if (!upcoming.length) {
          const empty = document.createElement("div");
          empty.className = "focus-empty";
          empty.textContent = "No deadlines on the horizon. Take a breath.";
          focusList.append(empty);
          return;
        }
        upcoming.forEach((task, index) => {
          const item = document.createElement("div");
          item.className = "focus-item";
          item.innerHTML = `<div class="focus-icon" aria-hidden="true">${index === 0 ? "✦" : "⌁"}</div><div class="focus-copy"><div class="focus-title">${escapeHtml(task.title)}</div><div class="focus-sub">${escapeHtml(dueLabel(task))} · ${priorityNames[task.priority] || "Medium"} priority</div></div>`;
          focusList.append(item);
        });
      }
      function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
      }
      function openModal(existingTask) {
        form.dataset.editId = existingTask ? existingTask.id : "";
        $("#modalTitle").textContent = existingTask ? "Set a deadline" : "New objective";
        $("#taskName").value = existingTask ? existingTask.title : "";
        $("#taskNote").value = existingTask ? existingTask.note || "" : "";
        $("#taskPriority").value = existingTask ? existingTask.priority : "medium";
        $("#taskDue").value = existingTask ? existingTask.due : "week";
        $("#customDate").value = existingTask ? existingTask.customDate || "" : "";
        $("#customDateField").hidden = $("#taskDue").value !== "custom";
        backdrop.classList.add("open");
        window.setTimeout(() => $("#taskName").focus(), 30);
      }
      function closeModal() {
        backdrop.classList.remove("open");
        form.reset();
        form.dataset.editId = "";
        $("#customDateField").hidden = true;
      }
      $("#addButton").addEventListener("click", () => openModal());
      $("#closeModal").addEventListener("click", closeModal);
      $("#cancelModal").addEventListener("click", closeModal);
      backdrop.addEventListener("click", (event) => { if (event.target === backdrop) closeModal(); });
      document.addEventListener("keydown", (event) => { if (event.key === "Escape" && backdrop.classList.contains("open")) closeModal(); });
      $("#taskDue").addEventListener("change", (event) => {
        const custom = event.target.value === "custom";
        $("#customDateField").hidden = !custom;
        if (custom) $("#customDate").focus();
      });
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const title = $("#taskName").value.trim();
        if (!title) return;
        const due = $("#taskDue").value;
        const customDate = $("#customDate").value;
        if (due === "custom" && !customDate) {
          $("#customDate").setCustomValidity("Choose a due date.");
          $("#customDate").reportValidity();
          return;
        }
        $("#customDate").setCustomValidity("");
        const editId = form.dataset.editId;
        if (editId) {
          const task = tasks.find((item) => item.id === editId);
          if (task) {
            task.due = due;
            if (due === "custom") task.customDate = customDate;
            else delete task.customDate;
          }
        } else {
          tasks.unshift({ id: window.crypto && crypto.randomUUID ? crypto.randomUUID() : `q${Date.now()}`, title, note: $("#taskNote").value.trim(), priority: $("#taskPriority").value, due, ...(due === "custom" ? { customDate } : {}), done: false });
        }
        saveTasks();
        render();
        closeModal();
        showToast(editId ? "Deadline updated." : "New quest added to the stack.");
      });
      document.querySelectorAll(".filter").forEach((button) => button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;
        document.querySelectorAll(".filter").forEach((item) => item.classList.toggle("active", item === button));
        render();
      }));
      $("#sortButton").addEventListener("click", () => {
        const original = new Map(tasks.map((task, index) => [task.id, index]));
        tasks.sort((a, b) => urgencyScore(b) - urgencyScore(a) || original.get(a.id) - original.get(b.id));
        saveTasks();
        render();
        showToast("Quest stack ranked by urgency and priority.");
      });
      function updateDate() {
        dateLabel.textContent = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(new Date());
      }
      window.setInterval(() => {
        quoteIndex = (quoteIndex + 1) % quotes.length;
        $("#quoteText").textContent = quotes[quoteIndex];
      }, 9000);
      updateDate();
      render();
    })();
