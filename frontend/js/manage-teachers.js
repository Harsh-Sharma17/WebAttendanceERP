document.addEventListener("DOMContentLoaded", () => {

const teacherId = document.getElementById("teacherId");
const teacherName = document.getElementById("teacherName");
const teacherEmail = document.getElementById("teacherEmail");
const teacherClasses = document.getElementById("teacherClasses");
const teacherSubjects = document.getElementById("teacherSubjects");

const addTeacherForm = document.getElementById("addTeacherForm");
const teacherTable = document.getElementById("teacherTable");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const API_URL = "https://webattendanceerp.onrender.com/api/teachers";
const CLASS_API = "https://webattendanceerp.onrender.com/api/classes";


// =========================
// LOAD CLASSES
// =========================
async function loadClasses() {
    const token = localStorage.getItem("token");

    try {
        const res = await fetch(CLASS_API, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        const classes = Array.isArray(data) ? data : data.classes;

        teacherClasses.innerHTML = "";

        classes.forEach(cls => {
            const option = document.createElement("option");
            option.value = cls._id || cls.id;
            option.textContent = cls.className;
            teacherClasses.appendChild(option);
        });

    } catch (err) {
        console.error("Class load error:", err);
    }
}


// =========================
// LOAD TEACHERS (FIXED DELETE)
// =========================
async function loadTeachers() {
    const token = localStorage.getItem("token");

    try {
        const res = await fetch(API_URL, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        const teachers = data.teachers || data;

        teacherTable.innerHTML = "";

        teachers.forEach(teacher => {

            const row = document.createElement("tr");

            const classNames = (teacher.classes || [])
                .map(c => c.className)
                .join(", ");

            const classIds = (teacher.classes || [])
                .map(c => c._id)
                .join(",");

            const subjects = (teacher.subjects || []).join(",");

            // ❗ IMPORTANT: NO inline onclick (SAFE METHOD)
            row.innerHTML = `
                <td>${teacher.name}</td>
                <td>${teacher.email}</td>
                <td>${classNames}</td>
                <td>${subjects}</td>
                <td>
                    <button class="editBtn">Edit</button>
                    <button class="deleteBtn">Delete</button>
                </td>
            `;

            // ✅ FIX: attach event listeners properly
            const teacherIdSafe = teacher._id || teacher.id;

            row.querySelector(".editBtn").addEventListener("click", () => {
                editTeacher(
                    teacherIdSafe,
                    teacher.name,
                    teacher.email,
                    classIds,
                    subjects
                );
            });

            row.querySelector(".deleteBtn").addEventListener("click", () => {
                deleteTeacher(teacherIdSafe);
            });

            teacherTable.appendChild(row);
        });

    } catch (err) {
        console.error("Teacher load error:", err);
    }
}


// =========================
// ADD / UPDATE
// =========================
addTeacherForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    const classes = Array.from(teacherClasses.selectedOptions)
        .map(opt => opt.value);

    const subjects = teacherSubjects.value
        .split(",")
        .map(s => s.trim())
        .filter(s => s);

    const payload = {
        name: teacherName.value,
        email: teacherEmail.value,
        classes,
        subjects
    };

    try {
        let res;

        if (teacherId.value) {
            res = await fetch(`${API_URL}/${teacherId.value}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
        } else {
            res = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        resetForm();
        loadTeachers();

    } catch (err) {
        alert(err.message);
    }
});


// =========================
// DELETE (SAFE)
// =========================
async function deleteTeacher(id) {
    const token = localStorage.getItem("token");

    if (!id) {
        alert("❌ Invalid ID");
        return;
    }

    if (!confirm("Delete this teacher?")) return;

    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Delete failed");

        loadTeachers();

    } catch (err) {
        console.error(err);
        alert("Delete failed");
    }
}


// =========================
// EDIT
// =========================
function editTeacher(id, name, email, classes, subjects) {
    teacherId.value = id;
    teacherName.value = name;
    teacherEmail.value = email;
    teacherSubjects.value = subjects;

    const arr = classes.split(",");

    Array.from(teacherClasses.options).forEach(opt => {
        opt.selected = arr.includes(opt.value);
    });

    submitBtn.textContent = "Update Teacher";
    cancelEditBtn.style.display = "inline-block";
}


// =========================
// RESET
// =========================
function resetForm() {
    teacherId.value = "";
    addTeacherForm.reset();

    Array.from(teacherClasses.options).forEach(opt => opt.selected = false);

    submitBtn.textContent = "Add Teacher";
    cancelEditBtn.style.display = "none";
}

cancelEditBtn.addEventListener("click", resetForm);


// INIT
loadClasses();
loadTeachers();

});