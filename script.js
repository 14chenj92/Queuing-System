document.getElementById("emailForm").addEventListener("submit", sendMail);
document.getElementById("verifyForm").addEventListener("submit", verifyCode);

function sendMail(event) {
    event.preventDefault();

    let verificationCode = Math.floor(100000 + Math.random() * 900000); 
    let email = document.getElementById("email").value;

    let params = {
        email: email,
        code: verificationCode
    };

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
    console.log(enteredCode, email)
    fetch("/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, code: enteredCode }),
        credentials: 'include' 
    })
    .then(response => response.json()) 
    .then(data => {
        Swal.fire({
            title: "Verification",
            html: data.generatedPassword, 
            icon: data.message.includes("success") ? "success" : "error",
            confirmButtonText: "OK"
        }).then((result) => {
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
            text: "An error occurred while verifying the code.",
            icon: "error",
            confirmButtonText: "OK"
        });
    });
}



