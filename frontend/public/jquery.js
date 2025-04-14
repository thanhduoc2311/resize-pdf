document.getElementById('file').addEventListener('change', function () {
    const fileInput = this;
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    if (fileInput.files.length > 0) {
        fileNameDisplay.textContent = "Đã chọn: " + fileInput.files[0].name;
    } else {
        fileNameDisplay.textContent = "";
    }
});
