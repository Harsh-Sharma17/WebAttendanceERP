document.addEventListener("DOMContentLoaded", async () => {

    const token = localStorage.getItem("token");

    if (!token) {
        alert("Please login first");
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch("https://webattendanceerp.onrender.com/api/teachers/me", {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        }

        // Update teacher name
        document.getElementById("teacherName").innerText = data.name;

        // Update subjects/classes
        const classList = document.getElementById("classList");
        classList.innerHTML = "";

        data.subjects.forEach(subject => {
            const li = document.createElement("li");
            li.innerText = subject;
            classList.appendChild(li);
        });

    } catch (error) {
        console.error("Dashboard error:", error);
        alert("Failed to load dashboard");
    }

});