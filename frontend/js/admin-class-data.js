document.addEventListener("DOMContentLoaded", () => {

    const classSelect = document.getElementById("classSelect");
    const dateFilter = document.getElementById("dateFilter");
    const subjectFilter = document.getElementById("subjectFilter");

    const fromDate = document.getElementById("fromDate");
    const toDate = document.getElementById("toDate");
    const sortOrder = document.getElementById("sortOrder");

    const loadBtn = document.getElementById("loadStudents");
    const downloadBtn = document.getElementById("downloadExcel");
    const studentTable = document.getElementById("studentTable");

    const API_BASE = "http://localhost:5000/api";
    const token = localStorage.getItem("token");

    let attendanceData = [];

    // ============================
    // 🔐 AUTH CHECK
    // ============================
    if (!token) {
        alert("Session expired. Please login again.");
        window.location.href = "/login.html";
        return;
    }

    // ============================
    // 📦 LOAD CLASSES
    // ============================
    async function loadClasses() {
        try {
            const res = await fetch(`${API_BASE}/classes`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();
            const classes = data.classes || data;

            classSelect.innerHTML = `<option value="">Select Class</option>`;

            if (!Array.isArray(classes)) {
                console.error("❌ Invalid classes data:", classes);
                return;
            }

            classes.forEach(cls => {
                const option = document.createElement("option");
                option.value = cls._id;
                option.textContent = cls.className;
                classSelect.appendChild(option);
            });

        } catch (err) {
            console.error("❌ Class load error:", err);
        }
    }

    // ============================
    // 📚 LOAD SUBJECTS (STATIC)
    // ============================
    async function loadSubjects() {
        try {
            const res = await fetch(`${API_BASE}/teachers`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();
            const teachers = data.teachers || [];

            const subjectsSet = new Set();

            teachers.forEach(t => {
                (t.subjects || []).forEach(sub => {
                    subjectsSet.add(sub);
                });
            });

            subjectFilter.innerHTML = `<option value="">All Subjects</option>`;

            subjectsSet.forEach(sub => {
                const option = document.createElement("option");
                option.value = sub;
                option.textContent = sub;
                subjectFilter.appendChild(option);
            });

        } catch (err) {
            console.error("❌ Error loading subjects:", err);
        }
    }
    // ============================
    // 📊 LOAD ATTENDANCE
    // ============================
    loadBtn.addEventListener("click", async () => {

        const classId = classSelect.value;
        const date = dateFilter.value;
        const subject = subjectFilter.value;

        // ✅ SAFE VALUES (NO CRASH)
        const from = fromDate ? fromDate.value : "";
        const to = toDate ? toDate.value : "";
        const sort = sortOrder ? sortOrder.value : "desc";

        if (!classId) {
            alert("Please select class");
            return;
        }

        if (!date && (!from || !to)) {
            alert("Select date OR date range");
            return;
        }

        studentTable.innerHTML =
            `<tr><td colspan="5">Loading...</td></tr>`;

        try {

            let url = `${API_BASE}/attendance?class=${classId}`;

            if (date) url += `&date=${date}`;
            if (from) url += `&from=${from}`;
            if (to) url += `&to=${to}`;
            if (subject) url += `&subject=${subject}`;
            if (sort) url += `&sort=${sort}`;

            console.log("📡 Fetching:", url);

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();
            const records = data.attendance || [];

            attendanceData = records;
            studentTable.innerHTML = "";

            if (!records.length) {
                studentTable.innerHTML =
                    `<tr><td colspan="5">No records found</td></tr>`;
                return;
            }

            // ============================
            // 📋 RENDER TABLE
            // ============================
            records.forEach(record => {

                const status = (record.status || "").toLowerCase();

                const formattedDate = record.date
                    ? new Date(record.date).toLocaleDateString("en-IN")
                    : "N/A";

                const row = document.createElement("tr");

                row.innerHTML = `
                    <td>${record.student?.name || "N/A"}</td>
                    <td>${record.student?.rollNo || "N/A"}</td>
                    <td>${record.subject || "N/A"}</td>
                    <td style="color:${status === "present" ? "green" : "red"};">
                        ${status}
                    </td>
                    <td>${formattedDate}</td>
                `;

                studentTable.appendChild(row);
            });

        } catch (err) {
            console.error("❌ Fetch error:", err);

            studentTable.innerHTML =
                `<tr><td colspan="5">Server error</td></tr>`;
        }

    });

    // ============================
    // 📥 DOWNLOAD EXCEL
    // ============================
    downloadBtn.addEventListener("click", () => {

        if (!attendanceData.length) {
            alert("No data to download");
            return;
        }

        const excelData = attendanceData.map(record => ({
            "Student Name": record.student?.name || "N/A",
            "Roll No": record.student?.rollNo || "N/A",
            "Subject": record.subject || "N/A",
            "Status": record.status,
            "Date": record.date
                ? new Date(record.date).toLocaleDateString("en-IN")
                : "N/A"
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
        XLSX.writeFile(workbook, "Attendance_Report.xlsx");
    });

    // ============================
    // 🚀 INIT
    // ============================
    loadClasses();
    loadSubjects();
});