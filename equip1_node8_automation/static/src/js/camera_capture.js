odoo.define('ocr_document_processor.camera_capture', function(require) {
    'use strict';

    var FormRenderer = require('web.FormRenderer');

    // Perluas fungsi FormRenderer bawaan Odoo
    FormRenderer.include({
        _renderView: function () {
            var self = this;
            // Panggil render view asli
            return this._super.apply(this, arguments).then(function() {
                // Temukan input kamera setelah view selesai di-render
                var cameraInput = self.$('#camera-input');
                if (cameraInput.length) {
                    cameraInput.on('change', function(ev) {
                        var files = ev.target.files;
                        if (files.length > 0) {
                            var file = files[0];
                            var reader = new FileReader();
                            reader.onload = function(e) {
                                var base64_data = e.target.result.split(',')[1];
                                // Simpan data base64 ke field Odoo 'image_file'
                                self.state.data.image_file = base64_data;
                                self.state.data.image_filename = file.name;
                                // Perbarui view untuk menampilkan gambar yang baru
                                self.renderElement();
                            };
                            reader.readAsDataURL(file);
                        }
                    });
                }
            });
        },
    });
});