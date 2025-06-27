document.getElementById("uploadPicBtn").addEventListener("click", async () => {
  const fileInput = document.getElementById("profilePicInput");
  const file = fileInput.files[0];
  const email = window.selectedUserEmail;

  if (!file || !email) {
    Swal.fire("Missing Info", "Please select a file and a user.", "warning");
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
      await Swal.fire("Success", "Profile picture uploaded!", "success");
      // Reload the page to reflect new image
      location.reload();
    } else {
      Swal.fire("Upload Failed", result.message || "Upload failed.", "error");
    }
  } catch (err) {
    console.error("Error:", err);
    Swal.fire("Error", "Something went wrong.", "error");
  }
});

document.getElementById("deletePicBtn").addEventListener("click", async () => {
  const email = window.selectedUserEmail;
  if (!email) {
    Swal.fire("No User", "Please select a user first.", "warning");
    return;
  }

  const confirmation = await Swal.fire({
    title: "Are you sure?",
    text: "This will permanently delete the profile picture.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it!",
  });

  if (!confirmation.isConfirmed) return;

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
      Swal.fire("Deleted", "Profile picture has been removed.", "success");
      const currentPic = document.getElementById("currentProfilePic");
      currentPic.src = "";
      currentPic.style.display = "none";
    } else {
      Swal.fire("Delete Failed", result.message || "Could not delete the picture.", "error");
    }
  } catch (error) {
    console.error("Error deleting profile picture:", error);
    Swal.fire("Error", "Something went wrong while deleting the picture.", "error");
  }
});
