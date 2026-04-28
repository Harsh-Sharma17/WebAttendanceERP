document.addEventListener("DOMContentLoaded", function(){

    const loginForm = document.querySelector("form");

    loginForm.addEventListener("submit", function(e){

        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        fetch("https://webattendanceerp.onrender.com/api/auth/login", {
            method: "POST", 
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({email, password})
        })
        .then(res => res.json())
        .then(data => {

            if(!data.token || !data.role){
                alert("Login failed");
                return;
            }

            localStorage.setItem("token", data.token);
            
            // if(!data.success){
            //     alert(data.message || "Login failed");
            //     return;
            // }

            alert(data.message);

            const role = data.role.toLowerCase();

            if(role === "admin"){
                window.location.href = "admin-dashboard.html";
            }
            else if(role === "teacher"){
                window.location.href = "teacher-dashboard.html";
            }
            else if(role === "student"){
                window.location.href = "student-dashboard.html";
            }
            else{
                alert("Unknown Role");
            }
        })
        .catch(err => {
            console.error(err);
            alert("Server error. Try again later.")
        });
    });
});