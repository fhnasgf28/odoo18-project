odoo.define('equip1_node8_automation.camera_capture', function(require) {
    'use strict';

    const FormRenderer = require('web.FormRenderer');
    const core = require('web.core');
    const _t = core._t;

    FormRenderer.include({
        events: _.extend({}, FormRenderer.prototype.events, {
            'click .open-camera-btn': '_onOpenCamera',
            'click .capture-btn': '_onCaptureImage',
            'click .retake-btn': '_onRetakeImage',
            'click .close-camera-btn': '_onCloseCamera',
        }),

        /**
         * Initialize camera stream variables
         */
        init: function() {
            this._super.apply(this, arguments);
            this.mediaStream = null;
            this.videoElement = null;
            this.canvasElement = null;
            this.imageCapture = null;
        },

        /**
         * Handle opening the camera interface and requesting permissions
         * 
         * @private
         * @param {MouseEvent} ev 
         */
        _onOpenCamera: function(ev) {
            ev.preventDefault();
            ev.stopPropagation();
            
            const self = this;
            const cameraInterface = this.$(ev.currentTarget).siblings('.camera-interface');
            
            // Request camera permissions
            navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'environment', // Use back camera on mobile devices
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            }).then(function(stream) {
                self.mediaStream = stream;
                
                // Show camera interface
                cameraInterface.removeClass('d-none');
                self.$(ev.currentTarget).addClass('d-none');
                
                // Set up video preview
                self.videoElement = cameraInterface.find('#camera-preview')[0];
                self.videoElement.srcObject = stream;
                
                // Set up canvas for image capture
                self.canvasElement = cameraInterface.find('#camera-canvas')[0];
                
                // Create ImageCapture object
                const track = stream.getVideoTracks()[0];
                self.imageCapture = new ImageCapture(track);
                
            }).catch(function(error) {
                // Handle errors
                self._displayCameraError(error);
            });
        },

        /**
         * Handle capturing an image from the camera
         * 
         * @private
         * @param {MouseEvent} ev 
         */
        _onCaptureImage: function(ev) {
            ev.preventDefault();
            ev.stopPropagation();
            
            const self = this;
            const cameraInterface = this.$(ev.currentTarget).closest('.camera-interface');
            
            // Take photo using canvas to get better control over the image
            const video = this.videoElement;
            const canvas = this.canvasElement;
            
            // Set canvas dimensions to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Draw video frame to canvas
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Convert to base64
            const imageData = canvas.toDataURL('image/jpeg');
            const base64Data = imageData.split(',')[1];
            
            // Show canvas with captured image
            $(canvas).removeClass('d-none');
            $(video).addClass('d-none');
            
            // Show retake button and hide capture button
            cameraInterface.find('.capture-btn').addClass('d-none');
            cameraInterface.find('.retake-btn').removeClass('d-none');
            
            // Update the model field with captured image
            if (this.state && this.state.data) {
                this.state.data.image_file = base64Data;
                this.state.data.image_filename = 'camera_capture.jpg';
                
                // Save the image to the record
                this._saveImageToRecord(base64Data);
            }
        },

        /**
         * Handle retaking an image
         * 
         * @private
         * @param {MouseEvent} ev 
         */
        _onRetakeImage: function(ev) {
            ev.preventDefault();
            ev.stopPropagation();
            
            const cameraInterface = this.$(ev.currentTarget).closest('.camera-interface');
            
            // Hide canvas and show video again
            cameraInterface.find('#camera-canvas').addClass('d-none');
            cameraInterface.find('#camera-preview').removeClass('d-none');
            
            // Hide retake button and show capture button
            cameraInterface.find('.retake-btn').addClass('d-none');
            cameraInterface.find('.capture-btn').removeClass('d-none');
        },

        /**
         * Handle closing the camera interface
         * 
         * @private
         * @param {MouseEvent} ev 
         */
        _onCloseCamera: function(ev) {
            ev.preventDefault();
            ev.stopPropagation();
            
            const cameraBtn = this.$('.open-camera-btn');
            const cameraInterface = this.$(ev.currentTarget).closest('.camera-interface');
            
            // Stop media stream
            if (this.mediaStream) {
                this.mediaStream.getTracks().forEach(track => track.stop());
                this.mediaStream = null;
            }
            
            // Hide camera interface and show camera button
            cameraInterface.addClass('d-none');
            cameraBtn.removeClass('d-none');
            
            // Reset video and canvas
            if (this.videoElement) {
                this.videoElement.srcObject = null;
            }
            
            // Reset buttons state
            cameraInterface.find('.capture-btn').removeClass('d-none');
            cameraInterface.find('.retake-btn').addClass('d-none');
            cameraInterface.find('#camera-canvas').addClass('d-none');
            cameraInterface.find('#camera-preview').removeClass('d-none');
        },

        /**
         * Save the captured image to the record
         * 
         * @private
         * @param {string} base64Data 
         */
        _saveImageToRecord: function(base64Data) {
            const recordID = this.state.id;
            const model = this.state.model;
            
            if (!recordID || recordID === 'virtual_0') {
                // For new records, we'll set the value in the form
                // It will be saved when the user saves the form
                return;
            }
            
            // For existing records, save immediately
            this._rpc({
                model: model,
                method: 'write',
                args: [
                    [recordID],
                    {
                        'image_file': base64Data,
                        'image_filename': 'camera_capture.jpg'
                    }
                ]
            }).then(() => {
                // Show success message
                this.displayNotification({
                    type: 'success',
                    title: _t('Success'),
                    message: _t('Image captured and saved successfully.'),
                    sticky: false,
                });
                
                // Trigger processing if auto-process is enabled
                this._processImageToExcel();
            }).catch(error => {
                console.error('Error saving image:', error);
                this.displayNotification({
                    type: 'danger',
                    title: _t('Error'),
                    message: _t('Failed to save captured image.'),
                    sticky: false,
                });
            });
        },

        /**
         * Process the captured image to Excel-like format
         * This calls the server-side OCR processing
         * 
         * @private
         */
        _processImageToExcel: function() {
            const recordID = this.state.id;
            const model = this.state.model;
            
            if (!recordID || recordID === 'virtual_0') {
                return;
            }
            
            this._rpc({
                model: model,
                method: 'action_process_document',
                args: [[recordID]]
            }).then(() => {
                // Reload the form to show the processed Excel file
                this.trigger_up('reload');
            }).catch(error => {
                console.error('Error processing image:', error);
            });
        },

        /**
         * Display camera error notifications
         * 
         * @private
         * @param {Error} error 
         */
        _displayCameraError: function(error) {
            console.error('Camera error:', error);
            
            let errorMessage = _t('Failed to access camera.');
            
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMessage = _t('Camera access was denied. Please allow camera access in your browser settings.');
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                errorMessage = _t('No camera found on this device.');
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                errorMessage = _t('Camera is already in use by another application.');
            } else if (error.name === 'OverconstrainedError') {
                errorMessage = _t('Camera does not meet the required constraints.');
            }
            
            this.displayNotification({
                type: 'danger',
                title: _t('Camera Error'),
                message: errorMessage,
                sticky: false,
            });
        }
    });
});