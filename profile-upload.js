document.getElementById("uploadPicBtn").addEventListener("click", async () => {
  const fileInput = document.getElementById("profilePicInput");
  const file = fileInput.files[0];
  const email = window.selectedUserEmail;

  if (!file || !email) {
    alert("No file or user selected.");
    return;
  }

  const formData = new FormData();
  formData.append("image", file);
  formData.append("email", email);

  try {
    const res = await fetch("/api/upload-profile-pic", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();

    if (result.success) {
      alert("Profile picture uploaded!");
      document.getElementById("currentProfilePic").src = `/uploads/${email}.jpg?${Date.now()}`;
    } else {
      alert("Upload failed.");
    }
  } catch (err) {
    console.error("Error:", err);
    alert("Something went wrong.");
  }
});

document.getElementById("deletePicBtn").addEventListener("click", async () => {
  const email = window.selectedUserEmail;
  if (!email) {
    alert("No user selected.");
    return;
  }

  if (!confirm("Are you sure you want to delete the profile picture?")) return;

  try {
    const res = await fetch("/api/delete-profile-pic", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const result = await res.json();

    if (result.success) {
      alert("Profile picture deleted.");
      const currentPic = document.getElementById("currentProfilePic");
      currentPic.src = "";
      currentPic.style.display = "none";
    } else {
      alert(result.message || "Failed to delete picture.");
    }
  } catch (error) {
    console.error("Error deleting profile picture:", error);
    alert("Something went wrong while deleting the picture.");
  }
});
