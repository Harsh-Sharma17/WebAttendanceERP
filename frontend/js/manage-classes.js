document.addEventListener("DOMContentLoaded", () => {

    const classNameInput = document.getElementById("className");
    const classList = document.getElementById("classList");
    const addClassForm = document.getElementById("addClassForm");

    const API_URL = "http://localhost:5000/api/classes";

    // ✅ GET TOKEN
    const token = localStorage.getItem("token");

    if (!token) {
        alert("Please login first!");
        window.location.href = "login.html";
        return;
    }

    // ==========================
    // 📥 LOAD CLASSES
    // ==========================
    async function loadClasses() {
        try {
            const response = await fetch(API_URL, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Unauthorized");
            }

            const classes = data.classes;

            classList.innerHTML = "";

            if (!classes || classes.length === 0) {
                classList.innerHTML = "<li>No classes found</li>";
                return;
            }

            classes.forEach((cls) => {

                console.log("Class object:", cls); // 🔍 DEBUG

                const li = document.createElement("li");

                li.style.margin = "10px 0";

                // Show class name
                const text = document.createElement("span");
                text.textContent = cls.className.toUpperCase();

                // DELETE BUTTON
                const deleteBtn = document.createElement("button");
                deleteBtn.textContent = "Delete";

                deleteBtn.style.marginLeft = "20px";
                deleteBtn.style.padding = "6px 12px";
                deleteBtn.style.backgroundColor = "#e74c3c";
                deleteBtn.style.color = "#fff";
                deleteBtn.style.border = "none";
                deleteBtn.style.borderRadius = "6px";
                deleteBtn.style.cursor = "pointer";

                deleteBtn.onclick = async () => {
                    if (!cls._id) {
                        alert("Invalid class ID");
                        console.error("Missing _id:", cls);
                        return;
                    }

                    if (confirm("Delete this class?")) {
                        await deleteClass(cls._id); // ✅ FIXED
                    }
                };

                li.appendChild(text);
                li.appendChild(deleteBtn);
                classList.appendChild(li);
            });

        } catch (error) {
            console.error("LOAD ERROR:", error);

            alert("Session expired. Please login again.");

            localStorage.removeItem("token");
            window.location.href = "login.html";
        }
    }

    // ==========================
    // ➕ ADD CLASS
    // ==========================
    addClassForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const value = classNameInput.value.trim();

        if (!value) {
            alert("Class name required");
            return;
        }

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ className: value })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                alert(data.message || "Failed to create class");
                return;
            }

            classNameInput.value = "";
            loadClasses();

        } catch (error) {
            console.error("ADD ERROR:", error);
            alert("Something went wrong while adding class");
        }
    });

    // ==========================
    // ❌ DELETE CLASS
    // ==========================
    async function deleteClass(id) {
        try {
            if (!id) {
                alert("Invalid class ID");
                return;
            }

            const response = await fetch(`${API_URL}/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                alert(data.message || "Delete failed");
                return;
            }

            alert("Class deleted successfully ✅");
            loadClasses();

        } catch (error) {
            console.error("DELETE ERROR:", error);
            alert("Failed to delete class");
        }
    }

    // ==========================
    // 🚀 INIT
    // ==========================
    loadClasses();
});