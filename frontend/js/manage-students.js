document.addEventListener("DOMContentLoaded", async () => {

  console.log("✅ JS Loaded");

  if (typeof faceapi === "undefined") {
    alert("❌ face-api not loaded");
    return;
  }

  // =========================
  // CONFIG (🔥 FIXED)
  // =========================
  const MODEL_URL = "/models";
  const STUDENT_API = "/api/students";
  const CLASS_API = "/api/classes";

  // =========================
  // ELEMENTS
  // =========================
  const studentName = document.getElementById("studentName");
  const rollNo = document.getElementById("rollNo");
  const studentClass = document.getElementById("studentClass");
  const addStudentForm = document.getElementById("addStudentForm");
  const studentTable = document.getElementById("studentTable");

  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");
  const captureBtn = document.getElementById("captureBtn");
  const faceImageInput = document.getElementById("faceImage");

  let faceDescriptor = null;
  let cameraReady = false;

  // =========================
  // TOKEN
  // =========================
  function getToken() {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("⚠️ Please login first");
      window.location.href = "login.html";
      return null;
    }

    return token;
  }

  // =========================
  // SAFE FETCH
  // =========================
  async function safeFetch(url, options = {}) {
    try {
      const res = await fetch(url, options);

      if (!res.ok) {
        const text = await res.text();
        console.error("❌ API Error:", text);
        throw new Error(`Request failed (${res.status})`);
      }

      return await res.json();
    } catch (err) {
      console.error("❌ Fetch failed:", err);
      throw err;
    }
  }

  // =========================
  // LOAD MODELS
  // =========================
  async function loadModels() {
    try {
      console.log("📦 Loading models...");

      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

      console.log("✅ Models loaded");

    } catch (err) {
      console.error("❌ Model load error:", err);
      alert("Model loading failed");
    }
  }

  // =========================
  // CAMERA
  // =========================
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      video.srcObject = stream;

      await new Promise(resolve => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });

      cameraReady = true;
      console.log("🎥 Camera ready");

    } catch (err) {
      alert("❌ Camera error: " + err.message);
    }
  }

  // =========================
  // FACE DETECTION
  // =========================
  async function detectFace() {
    if (!video.videoWidth) return null;

    return await faceapi
      .detectSingleFace(video)
      .withFaceLandmarks()
      .withFaceDescriptor();
  }

  // =========================
  // CAPTURE FACE
  // =========================
  captureBtn.addEventListener("click", async () => {

    if (!cameraReady) {
      alert("Camera not ready");
      return;
    }

    let result = null;

    for (let i = 0; i < 10; i++) {
      result = await detectFace();
      if (result) break;
      await new Promise(r => setTimeout(r, 300));
    }

    if (!result) {
      alert("❌ Face not detected");
      return;
    }

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    faceImageInput.value = canvas.toDataURL("image/jpeg");
    faceDescriptor = Array.from(result.descriptor);

    alert("✅ Face captured");
  });

  // =========================
  // LOAD CLASSES
  // =========================
  async function loadClasses() {
    try {
      const data = await safeFetch(CLASS_API, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });

      studentClass.innerHTML = `<option value="">-- Select Class --</option>`;

      if (!data.classes || data.classes.length === 0) {
        console.warn("⚠️ No classes found");
        return;
      }

      data.classes.forEach(cls => {
        const option = document.createElement("option");
        option.value = cls._id;
        option.textContent = cls.className;
        studentClass.appendChild(option);
      });

    } catch (err) {
      console.error("❌ Class load error:", err);
      alert("Failed to load classes");
    }
  }

  // =========================
  // LOAD STUDENTS
  // =========================
  async function loadStudents() {
    try {
      const data = await safeFetch(STUDENT_API, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });

      studentTable.innerHTML = "";

      if (!data.students) return;

      data.students.forEach(addRow);

    } catch (err) {
      console.error("❌ Student load error:", err);
    }
  }

  // =========================
  // ADD STUDENT
  // =========================
  addStudentForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!faceDescriptor) {
      alert("⚠️ Capture face first");
      return;
    }

    try {
      await safeFetch(STUDENT_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          name: studentName.value.trim(),
          rollNo: rollNo.value.trim(),
          class: studentClass.value,
          faceImage: faceImageInput.value,
          faceDescriptor
        })
      });

      alert("✅ Student added");

      addStudentForm.reset();
      faceDescriptor = null;

      loadStudents();

    } catch (err) {
      console.error("❌ Add student error:", err);
      alert("Failed to add student");
    }
  });

  // =========================
  // DELETE STUDENT
  // =========================
  async function deleteStudent(id) {
    if (!confirm("Delete student?")) return;

    try {
      await safeFetch(`${STUDENT_API}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });

      loadStudents();

    } catch (err) {
      console.error("❌ Delete error:", err);
      alert("Delete failed");
    }
  }

  function addRow(student) {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${student.name}</td>
      <td>${student.rollNo}</td>
      <td>${student.class?.className || ""}</td>
      <td><button>Delete</button></td>
    `;

    row.querySelector("button").onclick = () => deleteStudent(student._id);

    studentTable.appendChild(row);
  }

  // =========================
  // INIT
  // =========================
  await loadModels();
  await startCamera();
  await loadClasses();
  await loadStudents();

});