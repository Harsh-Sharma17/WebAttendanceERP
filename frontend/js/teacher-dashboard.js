document.addEventListener("DOMContentLoaded", async () => {

    const token = localStorage.getItem("token");

    // 🔐 Check login
    if (!token) {
        alert("Please login first");
        window.location.href = "index.html";
        return;
    }

    try {
        const response = await fetch("https://webattendanceerp.onrender.com/api/teachers/me", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }
        });

        const data = await response.json();
        console.log("API RESPONSE:", data); // 🔥 DEBUG

        // ❌ If API error
        if (!response.ok) {
            throw new Error(data.message || "Failed to fetch teacher data");
        }

        // ===============================
        // ✅ HANDLE DIFFERENT API STRUCTURES
        // ===============================
        const teacher = data.teacher || data;

        const teacherName = teacher.name || "Teacher";
        const subjects = Array.isArray(teacher.subjects) ? teacher.subjects : [];

        // ===============================
        // ✅ UPDATE UI
        // ===============================

        // 👤 Name
        const nameEl = document.getElementById("teacherName");
        if (nameEl) {
            nameEl.innerText = teacherName;
        }

        // 📚 Subjects / Classes
        const classList = document.getElementById("classList");

        if (classList) {
            classList.innerHTML = "";

            if (subjects.length === 0) {
                const li = document.createElement("li");
                li.innerText = "No subjects assigned";
                classList.appendChild(li);
            } else {
                subjects.forEach(subject => {
                    const li = document.createElement("li");
                    li.innerText = subject;
                    classList.appendChild(li);
                });
            }
        }

    } catch (error) {
        console.error("Dashboard error:", error);

        alert("Session expired or server error. Please login again.");

        // 🔄 Force logout
        localStorage.removeItem("token");
        window.location.href = "index.html";
    }

});