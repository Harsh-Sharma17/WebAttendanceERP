document.addEventListener("DOMContentLoaded", () => {

    const video = document.getElementById("camera");
    const captureBtn = document.getElementById("captureBtn");
    const faceStatus = document.getElementById("faceStatus");

    const classSelect = document.getElementById("classSelect");
    const subjectSelect = document.getElementById("subjectSelect");

    const API_URL = "http://localhost:5000/api/teachers/me";

    let cameraAccess = false;
    let stream = null;

    // ==================================
    // LOAD TEACHER (Subjects + Classes)
    // ==================================
    async function loadTeacherData() {

        const token = localStorage.getItem("token");

        if (!token) {
            faceStatus.innerText = "Unauthorized. Please login again.";
            faceStatus.style.color = "red";
            captureBtn.disabled = true;
            return;
        }

        try {
            const response = await fetch(API_URL, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const teacher = await response.json();

            if (!response.ok) {
                throw new Error(teacher.message);
            }

            // ======================
            // LOAD SUBJECTS
            // ======================
            subjectSelect.innerHTML = "<option value=''>Select Subject</option>";

            if (!teacher.subjects || teacher.subjects.length === 0) {
                faceStatus.innerText = "No subjects assigned.";
                faceStatus.style.color = "red";
                captureBtn.disabled = true;
                return;
            }

            teacher.subjects.forEach(sub => {
                const option = document.createElement("option");
                option.value = sub;
                option.textContent = sub;
                subjectSelect.appendChild(option);
            });

            // ======================
            // LOAD CLASSES
            // ======================
            classSelect.innerHTML = "<option value=''>Select Class</option>";

            if (!teacher.classes || teacher.classes.length === 0) {
                faceStatus.innerText = "No classes assigned.";
                faceStatus.style.color = "red";
                captureBtn.disabled = true;
                return;
            }

            teacher.classes.forEach(cls => {
                const option = document.createElement("option");
                option.value = cls;
                option.textContent = cls;
                classSelect.appendChild(option);
            });

        } catch (error) {
            console.log(error);
            faceStatus.innerText = "Failed to load teacher data.";
            faceStatus.style.color = "red";
            captureBtn.disabled = true;
        }
    }

    // ==================================
    // START CAMERA
    // ==================================
    async function startCamera() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });

            video.srcObject = stream;

            video.onloadedmetadata = () => {
                cameraAccess = true;
            };

        } catch (error) {
            console.log("Camera denied:", error);
            faceStatus.innerText = "Camera access denied";
            faceStatus.style.color = "red";
            captureBtn.disabled = true;
        }
    }

    // ==================================
    // CAPTURE FACE
    // ==================================
    captureBtn.addEventListener("click", () => {

        if (!cameraAccess || !stream || video.readyState !== 4) {
            alert("Camera not ready!");
            return;
        }

        if (!classSelect.value || !subjectSelect.value) {
            alert("Please select class and subject first!");
            return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const faceImage = canvas.toDataURL("image/png");

        console.log("Captured face image:", faceImage);
        console.log("Class:", classSelect.value);
        console.log("Subject:", subjectSelect.value);

        faceStatus.innerText =
            `Face Registered for ${classSelect.value} - ${subjectSelect.value} ✅`;

        faceStatus.style.color = "green";
    });

    // ==================================
    // INIT
    // ==================================
    loadTeacherData();
    startCamera();
});