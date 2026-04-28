document.addEventListener("DOMContentLoaded", async () => {

    const studentName = document.getElementById("studentName");
    const attendancePercentage = document.getElementById("attendancePercentage");
    const attendanceTable = document.getElementById("attendanceTable");

    try {
        const token = localStorage.getItem("token");

        if (!token) {
            alert("Please login first");
            window.location.href = "login.html";
            return;
        }

        // ✅ Clear old table data
        attendanceTable.innerHTML = "";

        const res = await fetch("https://webattendanceerp.onrender.com/api/students/my-attendance", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }
        });

        // ❗ Handle HTTP errors properly
        if (!res.ok) {
            throw new Error("Server error: " + res.status);
        }

        const data = await res.json();

        if (!data.success) {
            alert(data.message || "Failed to load attendance");
            return;
        }

        // ✅ Safe name rendering
        studentName.innerText = data.name || "Student";

        // ❗ No attendance case
        if (!data.attendance || data.attendance.length === 0) {
            attendancePercentage.innerText = "0%";
            attendanceTable.innerHTML = "<tr><td colspan='2'>No attendance data</td></tr>";
            return;
        }

        let totalPresent = 0;
        let totalClasses = 0;

        const subjectMap = {};

        data.attendance.forEach(item => {

            totalClasses++;

            if (item.status === "Present") {
                totalPresent++;
            }

            // ✅ Handle subject object OR string
            const subjectName = typeof item.subject === "object"
                ? item.subject.name
                : item.subject;

            if (!subjectMap[subjectName]) {
                subjectMap[subjectName] = { present: 0, total: 0 };
            }

            subjectMap[subjectName].total++;

            if (item.status === "Present") {
                subjectMap[subjectName].present++;
            }
        });

        // ✅ Overall %
        const overall = ((totalPresent / totalClasses) * 100).toFixed(2);
        attendancePercentage.innerText = overall + "%";

        // ✅ Fill table
        for (let subject in subjectMap) {

            const present = subjectMap[subject].present;
            const total = subjectMap[subject].total;

            const percent = ((present / total) * 100).toFixed(2);

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${subject}</td>
                <td>${percent}%</td>
            `;

            attendanceTable.appendChild(row);
        }

    } catch (err) {
        console.error("Error:", err);
        alert("Something went wrong while fetching attendance");
    }
});