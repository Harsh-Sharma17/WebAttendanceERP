document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("forgotForm");
    const message = document.getElementById("message");

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();

        if (email === "") {
            message.style.color = "red";
            message.innerText = "Please enter your email";
            return;
        }

        // Call backend forgot-password endpoint
        fetch("https://webattendanceerp.onrender.com/api/forgot-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email })
        })
        .then(res => {
            if (!res.ok) {
                throw new Error("Failed to send reset link");
            }
            return res.json();
        })
        .then(data => {
            message.style.color = "green";
            message.innerText = data.message || "If this email is registered, a reset link has been sent.";
            form.reset();
        })
        .catch(err => {
            console.error("Forgot password error:", err);
            message.style.color = "red";
            message.innerText = "Something went wrong. Please try again later.";
        });
    });
});
