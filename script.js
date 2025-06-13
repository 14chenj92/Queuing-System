document.getElementById("emailForm").addEventListener("submit", sendMail);
document.getElementById("verifyForm").addEventListener("submit", verifyCode);

function sendMail(event) {
    event.preventDefault();

    let verificationCode = Math.floor(100000 + Math.random() * 900000); 
    let email = document.getElementById("email").value;
    let firstName = document.getElementById("firstName").value;
    let lastName = document.getElementById("lastName").value;
    let now = new Date();
    let currentDate = now.toLocaleString();

    console.log("Verification Code:", verificationCode); 

    let params = {
        email: email,
        code: verificationCode,
        firstName: firstName,
        lastName: lastName,
        date: currentDate
    };
    // Temp Fix
    fetch("/save-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, code: verificationCode })
    });

    emailjs.send("service_cuab1yr", "template_sidhjme", params)
        .catch((error) => {
            console.warn("Email service failed (OK for dev):", error);
        });
}

function verifyCode(event) {
    event.preventDefault();

    let enteredCode = document.getElementById("code").value;
    let email = document.getElementById("email").value;
    let firstName = document.getElementById("firstName").value;
    let lastName = document.getElementById("lastName").value;
    let now = new Date();
    let date = now.toLocaleString();

    fetch("/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: email,
            code: enteredCode,
            firstName: firstName,
            lastName: lastName,
            date: date
        }),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        Swal.fire({
            title: "Verification",
            html: data.generatedPassword,
            icon: data.message.includes("success") ? "success" : "error",
            confirmButtonText: "OK"
        }).then(() => {
            if (data.message.includes("success")) {
                setTimeout(() => {
                    window.location.href = "main.html";
                }, 1000);
            }
        });
    })
    .catch(error => {
        console.error("Error verifying code:", error);
        Swal.fire({
            title: "Error",
            text: "An error occurred while verifying the code. Click on Send Email again to resend the code.",
            icon: "error",
            confirmButtonText: "OK"
        });
    });
}




