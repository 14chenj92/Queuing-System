document.getElementById("emailForm").addEventListener("submit", sendMail);
document.getElementById("verifyForm").addEventListener("submit", verifyCode);

function sendMail(event) {
    event.preventDefault();

    let verificationCode = Math.floor(100000 + Math.random() * 900000); // 6-digit code
    let email = document.getElementById("email").value;

    let params = {
        email: email,
        code: verificationCode
    };

    // Send the code via email using EmailJS
    emailjs.send("service_cuab1yr", "template_sidhjme", params)
        .then(() => {

            fetch("/save-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email, code: verificationCode })
            });
        })
        .catch((error) => {
            console.error("Error sending email:", error);
        });
}


function verifyCode(event) {
    event.preventDefault();

    let enteredCode = document.getElementById("code").value;
    let email = document.getElementById("email").value; 

    fetch("/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, code: enteredCode }) 
    })
    .then(response => response.text())
    .then(message => {
        Swal.fire({
            title: "Verification",
            text: message,
            icon: message.includes("success") ? "success" : "error",
            confirmButtonText: "OK"
        }).then((result) => {
            if (message.includes("success")) {
                // Redirect after 5 seconds
                setTimeout(() => {
                    window.location.href = "booking.html";
                }, 3000);
            }
        });
    })
    .catch(error => {
        console.error("Error verifying code:", error);
        Swal.fire({
            title: "Error",
            text: "An error occurred while verifying the code.",
            icon: "error",
            confirmButtonText: "OK"
        });
    });
}



