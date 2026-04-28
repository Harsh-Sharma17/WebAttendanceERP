document.addEventListener("DOMContentLoaded", () => {

    const API_BASE = "https://webattendanceerp.onrender.com/api";

    const classFilter = document.getElementById("classFilter");
    const subjectFilter = document.getElementById("subjectFilter");
    const dateFilter = document.getElementById("dateFilter");
    const fetchBtn = document.getElementById("fetchReport");
    const reportTable = document.getElementById("reportTable");

    const token = localStorage.getItem("token");

    // ===============================
    // 🔐 AUTH CHECK
    // ===============================
    if (!token) {
        alert("Please login first");
        window.location.href = "/login.html";
        return;
    }

    // ===============================
    // 📦 LOAD CLASSES
    // ===============================
    async function loadClasses() {
        try {
            const res = await fetch(`${API_BASE}/classes`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();
            const classes = data.classes || data || [];

            classFilter.innerHTML = `<option value="">Select Class</option>`;

            classes.forEach(cls => {
                const option = document.createElement("option");
                option.value = cls._id;
                option.innerText = cls.className;
                classFilter.appendChild(option);
            });

        } catch (err) {
            console.error("❌ Class loading error:", err);
        }
    }

    // ===============================
    // 📚 LOAD SUBJECTS
    // ===============================
    async function loadSubjects() {
        try {
            const res = await fetch(`${API_BASE}/teachers/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const teacher = await res.json();

            subjectFilter.innerHTML = `<option value="">All Subjects</option>`;

            (teacher.subjects || []).forEach(sub => {
                const option = document.createElement("option");
                option.value = sub;
                option.innerText = sub;
                subjectFilter.appendChild(option);
            });

        } catch (err) {
            console.error("❌ Subject loading error:", err);
        }
    }

    // ===============================
    // 📊 FETCH ATTENDANCE REPORT
    // ===============================
    async function fetchAttendance() {

        const selectedClass = classFilter.value;
        const selectedDate = dateFilter.value;
        const selectedSubject = subjectFilter.value;

        // ✅ VALIDATION
        if (!selectedClass) {
            alert("Please select a class");
            return;
        }

        if (!selectedDate) {
            alert("Please select a date");
            return;
        }

        // ✅ BUILD CLEAN URL (VERY IMPORTANT)
        let url = `${API_BASE}/attendance?class=${selectedClass}`;

        if (selectedDate) {
            url += `&date=${selectedDate}`;
        }

        if (selectedSubject && selectedSubject !== "") {
            url += `&subject=${selectedSubject}`;
        }

        console.log("📡 Fetching:", url);

        // ✅ LOADING STATE
        reportTable.innerHTML =
            "<tr><td colspan='2'>Loading...</td></tr>";

        try {
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();

            console.log("📥 API Response:", data);

            const records = data.attendance || [];

            // ❌ ERROR
            if (!Array.isArray(records)) {
                reportTable.innerHTML =
                    "<tr><td colspan='2'>Error loading data</td></tr>";
                return;
            }

            // ❌ EMPTY
            if (records.length === 0) {
                reportTable.innerHTML =
                    "<tr><td colspan='2'>No records found</td></tr>";
                return;
            }

            // ✅ RENDER
            reportTable.innerHTML = "";

            records.forEach(record => {
                const row = document.createElement("tr");

                // 👤 NAME
                const nameCell = document.createElement("td");
                nameCell.innerText =
                    record.student?.name || "Unknown";

                // 📌 STATUS
                const statusCell = document.createElement("td");
                const status = (record.status || "").toLowerCase();

                statusCell.innerText = status;

                statusCell.style.color =
                    status === "present" ? "green" :
                    status === "absent" ? "red" : "black";

                row.appendChild(nameCell);
                row.appendChild(statusCell);

                reportTable.appendChild(row);
            });

        } catch (err) {
            console.error("❌ Report fetch error:", err);

            reportTable.innerHTML =
                "<tr><td colspan='2'>Server error</td></tr>";
        }
    }

    // ===============================
    // 🎯 EVENTS
    // ===============================
    fetchBtn.addEventListener("click", fetchAttendance);

    // ===============================
    // 🚀 INIT
    // ===============================
    loadClasses();
    loadSubjects();

});