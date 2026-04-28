document.addEventListener("DOMContentLoaded", async () => {

    const classSelect = document.getElementById("classSelect");
    const subjectSelect = document.getElementById("subjectSelect");
    const video = document.getElementById("attendanceCamera");
    const startBtn = document.getElementById("startAttendance");
    const stopBtn = document.getElementById("stopAttendance");
    const logBox = document.getElementById("attendanceLog");

    const API_BASE = "http://localhost:5000/api";

    let stream = null;
    let faceMatcher = null;
    let running = false;
    let interval = null;
    let marked = new Set();
    let modelsLoaded = false;

    const studentMap = {};
    const token = localStorage.getItem("token");

    // ==========================
    // 🔐 LOGIN CHECK
    // ==========================
    if (!token) {
        alert("Login first");
        window.location.href = "/login.html";
        return;
    }

    // ==========================
    // 🧠 LOAD FACE MODELS
    // ==========================
    async function loadModels() {
        if (modelsLoaded) return;

        log("Loading AI models...");

        await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
            faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
            faceapi.nets.faceRecognitionNet.loadFromUri("/models")
        ]);

        modelsLoaded = true;
        log("Models loaded ✅");
    }

    // ==========================
    // 👨‍🎓 LOAD STUDENTS
    // ==========================
    async function loadStudents() {
        try {
            const res = await fetch(`${API_BASE}/students`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();
            const students = data.students || [];

            const labeled = [];

            for (const s of students) {

                if (!s.faceDescriptor || s.faceDescriptor.length === 0)
                    continue;

                studentMap[s._id] = s.name;

                labeled.push(
                    new faceapi.LabeledFaceDescriptors(
                        s._id,
                        [new Float32Array(s.faceDescriptor)]
                    )
                );
            }

            log(`Students loaded: ${labeled.length}`);
            return labeled;

        } catch (err) {
            console.error(err);
            log("❌ Failed to load students");
            return [];
        }
    }

    // ==========================
    // 👨‍🏫 LOAD TEACHER DATA
    // ==========================
    async function loadTeacher() {
        try {
            const res = await fetch(`${API_BASE}/teachers/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const teacher = await res.json();

            classSelect.innerHTML = "<option value=''>Select Class</option>";
            subjectSelect.innerHTML = "<option value=''>Select Subject</option>";

            teacher.classes.forEach(c => {
                const opt = document.createElement("option");
                opt.value = c._id;
                opt.textContent = c.className;
                classSelect.appendChild(opt);
            });

            teacher.subjects.forEach(s => {
                const opt = document.createElement("option");
                opt.value = s;
                opt.textContent = s;
                subjectSelect.appendChild(opt);
            });

        } catch (err) {
            console.error(err);
            log("❌ Failed to load teacher data");
        }
    }

    // ==========================
    // ▶️ START ATTENDANCE
    // ==========================
    startBtn.addEventListener("click", async () => {

        if (!classSelect.value || !subjectSelect.value) {
            alert("Select class & subject");
            return;
        }

        await loadModels();

        const labeled = await loadStudents();

        if (labeled.length === 0) {
            alert("No face data found");
            return;
        }

        faceMatcher = new faceapi.FaceMatcher(labeled, 0.5);

        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;

        video.onloadedmetadata = () => {
            video.play();
            startRecognition();
        };

        running = true;
        marked.clear();

        log("Attendance started 🚀");
    });

    // ==========================
    // 🎯 FACE RECOGNITION LOOP
    // ==========================
    function startRecognition() {

        interval = setInterval(async () => {

            if (!running) return;

            const detections = await faceapi
                .detectAllFaces(video)
                .withFaceLandmarks()
                .withFaceDescriptors();

            for (const d of detections) {

                const match = faceMatcher.findBestMatch(d.descriptor);

                if (match.label !== "unknown" && !marked.has(match.label)) {

                    marked.add(match.label);

                    const name = studentMap[match.label] || "Unknown";

                    log(`Detected: ${name}`);

                    try {
                        const res = await fetch(`${API_BASE}/attendance`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                student: match.label,
                                class: classSelect.value,
                                subject: subjectSelect.value,
                                status: "present"   // 🔥 IMPORTANT (lowercase)
                            })
                        });

                        const data = await res.json();

                        if (data.success) {
                            log(`✅ Marked: ${name}`);
                        } else {
                            log(`⚠️ ${data.message}`);
                        }

                    } catch (err) {
                        console.error(err);
                        log("❌ API error");
                    }
                }
            }

        }, 1500);
    }

    // ==========================
    // ⏹ STOP ATTENDANCE
    // ==========================
    stopBtn.addEventListener("click", () => {

        clearInterval(interval);

        if (stream) {
            stream.getTracks().forEach(t => t.stop());
        }

        video.srcObject = null;
        running = false;

        log("Attendance stopped 🛑");
    });

    // ==========================
    // 📝 LOGGER
    // ==========================
    function log(msg) {
        const li = document.createElement("li");
        li.textContent = msg;
        logBox.appendChild(li);
    }

    // ==========================
    // 🚀 INIT
    // ==========================
    loadTeacher();

});