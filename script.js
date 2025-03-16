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
            alert("A verification code has been sent to your email!");

            // ✅ Fix: Send both email & code to the backend
            fetch("/save-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email, code: verificationCode }) // ✅ Include email
            });
        })
        .catch((error) => {
            console.error("Error sending email:", error);
        });
}


// Verify the code
function verifyCode(event) {
    event.preventDefault();

    let enteredCode = document.getElementById("code").value;
    let email = document.getElementById("email").value; // Get email input

    fetch("/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, code: enteredCode }) // Include email
    })
    .then(response => response.text())
    .then(message => {
        document.getElementById("message").innerText = message;
    })
    .catch(error => console.error("Error verifying code:", error));
}

