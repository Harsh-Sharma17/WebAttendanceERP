document.addEventListener("DOMContentLoaded", () => {

    const userData = {
        name: "Harsh Sharma", 
        email: "harsh29012006@gmail.com",
        role: "admin"
    };

    document.getElementById("userName").textContent = userData.name;
    document.getElementById("userEmail").textContent = userData.email;
    document.getElementById("userRole").textContent = userData.role;

    const changePasswordBtn = document.getElementById("changePassword");

    changePasswordBtn.addEventListener("click", () => {
        alert("Redirecting to Change password page...");
    })
})