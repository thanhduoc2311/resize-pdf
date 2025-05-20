document.getElementById('file').addEventListener('change', function () {
    const fileInput = this;
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const fileSizeDisplay = document.getElementById('fileSizeDisplay');
    const fileNameUploadDisplay = document.getElementById('fileNameUploadDisplay');
    if (fileInput.files.length > 0) {
    	const file = fileInput.files[0];
    	const fileName = file.name;
    	const fileSize = formatFileSize(file.size);
        fileNameDisplay.textContent = "Đã chọn: " + fileName;
        fileSizeDisplay.textContent = "Kích thước: " + fileSize;
        fileNameUploadDisplay.textContent = "";
    } else {
        fileNameDisplay.textContent = "";
        fileSizeDisplay.textContent = "";
        fileNameUploadDisplay.textContent = "Tải tệp PDF lên";
    }
});

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

$('#upload-form').on('submit', function(e) {
    e.preventDefault();

    const formData = new FormData(this);

    $('#uploadProgressBarContainer').css('visibility', 'visible');
    $('.progress-bar').css('width', '0%').attr('aria-valuenow', 0).text('0%');

    $.ajax({
        url: '/upload',
        type: 'POST',
        data: formData,
        contentType: false,
        processData: false,
        xhr: function () {
            var xhr = new window.XMLHttpRequest();
            xhr.upload.addEventListener("progress", function(evt) {
                if (evt.lengthComputable) {
                    var percentComplete = Math.round((evt.loaded / evt.total) * 100);
                    $('.progress-bar')
                        .css('width', percentComplete + '%')
                        .attr('aria-valuenow', percentComplete)
                        .text(percentComplete + '%');
                }
            }, false);
            return xhr;
        },
        success: function (data) {
            if (data.success) {
		        $('.progress-bar').css('width', '100%').attr('aria-valuenow', 100).text('100%');

		        $('#fileNameDisplay').text('');
			    $('#fileSizeDisplay').text('');
			    $('#fileNameUploadDisplay').text('Tải tệp PDF lên');

		        $.get('/getFileList', function(files) {
		            const list = $('#listFileResize');
		            list.empty();

		            if (Array.isArray(files) && files.length > 0) {
		                files.sort((a, b) => new Date(b.mtime) - new Date(a.mtime));
		                files.forEach(function (file) {
		                    const size = (file.size / 1024).toFixed(2);
		                    const item = `
		                    <li class="li-list-file">
		                        <div class="row">
		                            <span class="col-md-7">
		                                <img src="img/pdf.svg" class="img-pdf-resize" />
		                                ${file.name}
		                            </span>
		                            <span class="col-md-3">${size} KB</span>
		                            <div class="col-md-2">
		                            	<a class="btn btn-primary" href="/download?path=Output/${file.name}">Tải về</a>
		                            	<a class="btn btn-danger btn-delete cl-white" data-filename="${file.name}">Xóa</a>
		                            </div>		                            
		                        </div>
		                    </li>`;
		                    list.append(item);
		                });
		            } else {
		                list.append('<li class="li-list-file">Không có file nào được nén.</li>');
		            }

		            setTimeout(() => {
		                $('#uploadProgressBarContainer').css('visibility', 'hidden');
		            }, 500);
		        });
		    } else {
		        alert(data.message || "Không có file nào được nén.");
		        $('#uploadProgressBarContainer').css('visibility', 'hidden');
		    }
        },
        error: function (xhr, status, err) {
            console.error("Lỗi:", xhr.responseText);
            try {
                const res = JSON.parse(xhr.responseText);
                alert(res.message || "Có lỗi xảy ra trong quá trình nén.");
            } catch (e) {
                alert("Có lỗi không xác định xảy ra.");
            }
            $('#uploadProgressBarContainer').css('visibility', 'hidden');
        }
    });
});

$('#listFileResize').on('click', '.btn-delete', function () {
    const filename = $(this).data('filename'); 

    if (!confirm("Bạn có chắc muốn xóa file này?")) return;

    $.ajax({
        url: '/delete',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ filename: filename }), 
        success: function (res) {
            if (res === 'success') {
                alert("Đã xóa file!");
                $.get('/getFileList', function(files) {
			        const list = $('#listFileResize');
			        list.empty();

			        if (Array.isArray(files) && files.length > 0) {
			            files.forEach(function (file) {
			                const size = (file.size / 1024).toFixed(2);
			                const item = `
		                    <li class="li-list-file">
		                        <div class="row">
		                            <span class="col-md-7">
		                                <img src="img/pdf.svg" class="img-pdf-resize" />
		                                ${file.name}
		                            </span>
		                            <span class="col-md-3">${size} KB</span>
		                            <div class="col-md-2">
		                            	<a class="btn btn-primary" href="/download?path=Output/${file.name}">Tải về</a>
		                            	<a class="btn btn-danger btn-delete cl-white" data-filename="${file.name}">Xóa</a>
		                            </div>		                            
		                        </div>
		                    </li>`;
			                list.append(item);
			            });
			        } else {
			            list.append('<li class="li-list-file">Không có file nào được nén.</li>');
			        }
			    });
            } else {
                alert("Xóa thất bại!");
            }
        },
        error: function (err) {
            console.error("Lỗi khi gửi yêu cầu xóa:", err);
            alert("Có lỗi xảy ra khi xóa.");
        }
    });
});

