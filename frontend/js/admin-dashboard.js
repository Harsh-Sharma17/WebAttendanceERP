document.addEventListener("DOMContentLoaded", () => {

    const token = localStorage.getItem("token");

    // 🔒 If token missing → redirect
    if (!token) {
        window.location.href = "unauthorized.html";
        return;
    }

    // 📊 Fetch dashboard data
    fetch("http://localhost:5000/api/dashboard", {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
        }
    })
    .then(res => {

        if (!res.ok) {

            if (res.status === 401 || res.status === 403) {
                window.location.href = "unauthorized.html";
                return;
            }

            throw new Error("Failed to load dashboard");

        }

        return res.json();
    })
    .then(data => {

        if (!data) return;

        console.log("Dashboard data:", data);

        // ✅ Set dashboard values from DB
        document.getElementById("totalStudents").innerText = data.totalStudents || 0;
        document.getElementById("totalTeachers").innerText = data.totalTeachers || 0;
        document.getElementById("totalClasses").innerText = data.totalClasses || 0;

    })
    .catch(err => {

        console.error("Dashboard error:", err);

        alert("Unable to load dashboard data. Please try again.");

    });

});